import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { OLD_GARDEN, TD_GARDEN } from "./geometry";
import { type Era, RinkPlan } from "./rink-plan";

function render(era: Era, unit: "ft" | "m" = "ft", labels = true) {
  return renderToStaticMarkup(
    <RinkPlan old={OLD_GARDEN} modern={TD_GARDEN} era={era} unit={unit} labels={labels} />,
  );
}

describe("RinkPlan", () => {
  it("draws both rinks with both sets of dimensions", () => {
    const html = render("both");
    for (const label of ["200 ft", "85 ft", "191 ft", "83 ft"]) expect(html).toContain(label);
    expect(html).toContain("is-both");
    expect(html).toContain("Boston Garden ice drawn inside TD Garden ice");
  });

  it("draws the 1995 rink alone at its own size", () => {
    const html = render("old");
    expect(html).toContain("191 ft");
    expect(html).toContain("83 ft");
    expect(html).not.toContain("200 ft");
    expect(html).toContain("is-old");
  });

  it("draws today's rink alone at its own size", () => {
    const html = render("modern");
    expect(html).toContain("200 ft");
    expect(html).not.toContain("191 ft");
    expect(html).not.toContain("is-both");
  });

  it("labels in meters on request", () => {
    const html = render("both", "m");
    expect(html).toContain("60.96 m");
    expect(html).toContain("58.22 m");
    expect(html).not.toContain(" ft");
  });

  it("leaves the numbers off a thumbnail", () => {
    expect(render("both", "ft", false)).not.toContain("<text");
  });

  it("dashes only the four old corners, which are a guess", () => {
    const html = render("both");
    expect(html.match(/class="rink-old-corner"/g)).toHaveLength(4);
    expect(html.match(/class="rink-old-board"/g)).toHaveLength(4);
  });
});
