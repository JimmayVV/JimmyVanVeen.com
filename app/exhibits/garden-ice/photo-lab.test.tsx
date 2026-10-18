import { existsSync } from "node:fs";
import { join } from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { OLD_GARDEN, TD_GARDEN } from "./geometry";
import { landmarkPoint, project, solveHomography } from "./homography";
import { PhotoLab, rinkFeatures } from "./photo-lab";
import { REFERENCE_PHOTOS, defaultAnchors } from "./photos";

const PUBLIC_DIR = join(import.meta.dirname, "..", "..", "..", "public");

describe("reference photos", () => {
  it.each(REFERENCE_PHOTOS)("$id ships its image and an open licence", (photo) => {
    expect(existsSync(join(PUBLIC_DIR, photo.src))).toBe(true);
    expect(existsSync(join(PUBLIC_DIR, photo.thumb))).toBe(true);
    expect(photo.credit.license).toMatch(/^(CC BY|Public domain)/);
    expect(photo.credit.source).toMatch(
      photo.credit.site === "Flickr"
        ? /^https:\/\/www\.flickr\.com\//
        : /^https:\/\/commons\.wikimedia\.org\//,
    );
  });

  it.each(REFERENCE_PHOTOS)(
    "$id anchors define a perspective that lands each one where it was placed",
    (photo) => {
      const rink = photo.arena === "old" ? OLD_GARDEN : TD_GARDEN;
      const h = solveHomography(
        photo.anchors.map((a) => landmarkPoint(rink, a.landmark)),
        photo.anchors.map((a) => a.at),
      );
      expect(h).not.toBeNull();
      if (!h) return;
      for (const anchor of photo.anchors) {
        const p = project(h, landmarkPoint(rink, anchor.landmark));
        expect(p?.[0]).toBeCloseTo(anchor.at[0], 4);
        expect(p?.[1]).toBeCloseTo(anchor.at[1], 4);
      }
    },
  );

  it("anchors each photo to four different landmarks", () => {
    for (const photo of REFERENCE_PHOTOS) {
      expect(new Set(photo.anchors.map((a) => a.landmark)).size).toBe(4);
    }
  });

  it("starts a visitor's photo with handles inside the frame", () => {
    for (const anchor of defaultAnchors(1000, 600)) {
      expect(anchor.at[0]).toBeGreaterThan(0);
      expect(anchor.at[0]).toBeLessThan(1000);
      expect(anchor.at[1]).toBeGreaterThan(0);
      expect(anchor.at[1]).toBeLessThan(600);
    }
  });
});

describe("rinkFeatures", () => {
  it("draws every regulation marking once", () => {
    const f = rinkFeatures(TD_GARDEN);
    expect(f.circles).toHaveLength(5);
    expect(f.dots).toHaveLength(9);
    expect(f.blueLines).toHaveLength(2);
    expect(f.goalLines).toHaveLength(2);
    expect(f.creases).toHaveLength(2);
    expect(f.nets).toHaveLength(2);
  });

  it("ends each goal line on the curved boards, not past them", () => {
    const [left] = rinkFeatures(TD_GARDEN).goalLines;
    const end = left?.[1];
    // At 89 ft from center the 28 ft corner has curved in to about 36.75 ft.
    expect(end?.[1]).toBeCloseTo(36.75, 1);
  });
});

describe("PhotoLab", () => {
  const html = renderToStaticMarkup(<PhotoLab old={OLD_GARDEN} modern={TD_GARDEN} />);

  it("opens on the first reference photo, credited", () => {
    const first = REFERENCE_PHOTOS[0];
    expect(html).toContain(`src="${first?.src}"`);
    expect(html).toContain(first?.credit.author);
    expect(html).toContain(
      first?.credit.license === "Public domain" ? "in the public domain" : first?.credit.license,
    );
  });

  it("draws both rinks and the ice between them", () => {
    expect(html).toContain("lab-rink-old");
    expect(html).toContain("lab-rink-modern");
    expect(html).toContain('fill-rule="evenodd"');
  });

  it("offers every reference photo and a way to use your own", () => {
    for (const photo of REFERENCE_PHOTOS) expect(html).toContain(photo.label);
    expect(html).toContain('type="file"');
    expect(html).toContain("Use your own photo");
  });

  it("keeps the fit handles hidden until asked for", () => {
    expect(html).not.toContain("lab-handle");
  });
});

describe("PhotoLab with your own photo", () => {
  it("says so when the chosen file isn't an image, instead of doing nothing", async () => {
    const { fireEvent, render, screen } = await import("@testing-library/react");
    const { container } = render(<PhotoLab old={OLD_GARDEN} modern={TD_GARDEN} />);
    const input = container.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new Error("expected the file input");

    const notes = new File(["not a photo"], "notes.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [notes] } });

    expect(screen.getByRole("alert").textContent).toContain("“notes.txt” isn’t an image");
  });
});
