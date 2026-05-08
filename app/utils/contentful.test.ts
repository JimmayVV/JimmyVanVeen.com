import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createClient = vi.fn();

vi.mock("contentful", () => ({
  createClient: (...args: unknown[]) => createClient(...args),
}));

const originalEnv = { ...process.env };

const importContentful = async () => {
  vi.resetModules();
  return await import("./contentful");
};

describe("contentful client config", () => {
  beforeEach(() => {
    createClient.mockReset();
    process.env = {
      ...originalEnv,
      CONTENTFUL_SPACE_ID: "space-id",
      CONTENTFUL_ACCESS_TOKEN: "delivery-token",
      CONTENTFUL_PREVIEW_TOKEN: "preview-token",
    };
    delete process.env.CONTENTFUL_PREVIEW;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("uses the Delivery API by default", async () => {
    await importContentful();
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith({
      space: "space-id",
      accessToken: "delivery-token",
      host: "cdn.contentful.com",
    });
  });

  it("treats CONTENTFUL_PREVIEW=false as off", async () => {
    process.env.CONTENTFUL_PREVIEW = "false";
    await importContentful();
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: "delivery-token",
        host: "cdn.contentful.com",
      }),
    );
  });

  it("uses the Preview API when CONTENTFUL_PREVIEW=true", async () => {
    process.env.CONTENTFUL_PREVIEW = "true";
    await importContentful();
    expect(createClient).toHaveBeenCalledWith({
      space: "space-id",
      accessToken: "preview-token",
      host: "preview.contentful.com",
    });
  });

  it("warns and skips client creation when preview is on but token is missing", async () => {
    process.env = {
      ...process.env,
      CONTENTFUL_PREVIEW: "true",
      CONTENTFUL_PREVIEW_TOKEN: "",
    };
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const mod = await importContentful();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("CONTENTFUL_PREVIEW=true"),
    );
    expect(createClient).not.toHaveBeenCalled();
    expect(mod.isContentfulConfigured()).toBe(false);
  });
});
