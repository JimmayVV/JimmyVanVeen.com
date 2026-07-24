import { describe, expect, it } from "vitest";

import { databaseIdFromGhId, repoMatchesGhId } from "./github";

// A legacy GitHub global node ID base64-decodes to `010:Repository<databaseId>`.
// `MDEwOlJlcG9zaXRvcnkxMjYzNTEzNDcw` -> `010:Repository1263513470`.
const LEGACY_YNAB_MCP = "MDEwOlJlcG9zaXRvcnkxMjYzNTEzNDcw";
const LEGACY_YNAB_MCP_DB_ID = 1263513470;

// The new-format node ID GitHub now returns for that same repository.
const NEW_YNAB_MCP = "R_kgDOS0-vfg";

describe("databaseIdFromGhId", () => {
  it("decodes a legacy node ID to its numeric database ID", () => {
    expect(databaseIdFromGhId(LEGACY_YNAB_MCP)).toBe(LEGACY_YNAB_MCP_DB_ID);
  });

  it("passes a plain numeric string through as a database ID", () => {
    expect(databaseIdFromGhId("1263513470")).toBe(1263513470);
  });

  it("returns null for a new-format node ID (not decodable to a database ID)", () => {
    expect(databaseIdFromGhId(NEW_YNAB_MCP)).toBeNull();
  });

  it("returns null for values that don't decode to the legacy shape", () => {
    expect(databaseIdFromGhId("not-base64!")).toBeNull();
    expect(databaseIdFromGhId("")).toBeNull();
  });
});

describe("repoMatchesGhId", () => {
  it("matches a new-format repo to its legacy ghId via the database ID", () => {
    // The regression this guards: the API now returns the new-format node_id,
    // but Contentful still stores the legacy ghId. They must still match.
    const repo = { id: LEGACY_YNAB_MCP_DB_ID, node_id: NEW_YNAB_MCP };
    expect(repoMatchesGhId(repo, LEGACY_YNAB_MCP)).toBe(true);
  });

  it("matches when the legacy formats agree on both sides", () => {
    const repo = { id: LEGACY_YNAB_MCP_DB_ID, node_id: LEGACY_YNAB_MCP };
    expect(repoMatchesGhId(repo, LEGACY_YNAB_MCP)).toBe(true);
  });

  it("falls back to node_id when the ghId can't resolve to a database ID", () => {
    const repo = { id: 1, node_id: NEW_YNAB_MCP };
    expect(repoMatchesGhId(repo, NEW_YNAB_MCP)).toBe(true);
  });

  it("does not match unrelated repositories", () => {
    const repo = { id: 999, node_id: "R_kgDOsomethingelse" };
    expect(repoMatchesGhId(repo, LEGACY_YNAB_MCP)).toBe(false);
  });
});
