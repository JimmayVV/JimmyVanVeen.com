import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ShareButtons } from "./share-buttons";

const writeText = vi.fn();

describe("ShareButtons", () => {
  beforeEach(() => {
    writeText.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  });

  it("copies the X link and says so", async () => {
    render(<ShareButtons slug="auto-merge-for-a-fleet-of-one" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy link for X" }));

    await waitFor(() => expect(screen.getByText("Copied link for X")).toBeTruthy());
    expect(writeText).toHaveBeenCalledWith(
      "https://www.jimmyvanveen.com/blog/auto-merge-for-a-fleet-of-one?ref=x&campaign=auto-merge-for-a-fleet-of-one",
    );
  });

  it("copies each platform's own link", async () => {
    render(<ShareButtons slug="do-hard-things" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy link for LinkedIn" }));
    await waitFor(() => expect(screen.getByText("Copied link for LinkedIn")).toBeTruthy());
    expect(writeText).toHaveBeenLastCalledWith(
      "https://www.jimmyvanveen.com/blog/do-hard-things?ref=linkedin&campaign=do-hard-things",
    );
  });

  it("shows the link on hover, so a refused clipboard still leaves it reachable", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    render(<ShareButtons slug="do-hard-things" />);

    const bluesky = screen.getByRole("button", { name: "Copy link for Bluesky" });
    expect(bluesky.getAttribute("title")).toBe(
      "https://www.jimmyvanveen.com/blog/do-hard-things?ref=bsky&campaign=do-hard-things",
    );
    fireEvent.click(bluesky);
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(screen.queryByText(/Copied link/)).toBeNull();
  });
});
