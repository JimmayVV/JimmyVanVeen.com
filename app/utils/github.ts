import { throttling } from "@octokit/plugin-throttling";
import { Octokit as createOctokit } from "@octokit/rest";

const Octokit = createOctokit.plugin(throttling);

const isDisabled = process.env["DISABLE_GITHUB_INTEGRATION"] === "true";

const octokit = isDisabled
  ? null
  : new Octokit({
      auth: process.env["GITHUB_TOKEN"],
      throttle: {
        onRateLimit: (retryAfter, options) => {
          console.warn(
            `Request quota exhausted for request ${options.method} ${options.url}. Retrying after ${String(retryAfter)} seconds.`,
          );

          return true;
        },
        onSecondaryRateLimit: (retryAfter, options) => {
          console.warn(
            `SecondaryRateLimit detected for request ${options.method} ${options.url}. Retrying after ${String(retryAfter)} seconds.`,
          );

          return true;
        },
      },
    });

export const getAllRepositories = async () => {
  if (isDisabled || !octokit) {
    console.warn("GitHub integration is disabled");
    return [];
  }

  const { data } = await octokit.repos.listForAuthenticatedUser({
    per_page: 100,
  });

  return data;
};

// GitHub is migrating repositories from the legacy global node ID format
// (base64 of `010:Repository<databaseId>`) to the new format (e.g. `R_kgDO…`).
// The REST API returns whichever format applies to a given repo, so matching
// purely on `node_id` silently drops any project whose stored ID no longer
// matches what the API now returns. We match on the stable numeric database ID
// instead, deriving it from the stored identifier when it's a legacy node ID.
const LEGACY_NODE_ID_PREFIX = "010:Repository";

export function databaseIdFromGhId(ghId: string): number | null {
  // A plain numeric string is already a database ID.
  if (/^\d+$/.test(ghId)) return Number(ghId);

  // Legacy node IDs base64-decode to `010:Repository<databaseId>`. New-format
  // IDs (R_kgD…) don't decode to that shape — return null so the caller falls
  // back to a direct node_id comparison for those.
  const decoded = Buffer.from(ghId, "base64").toString("utf8");
  if (!decoded.startsWith(LEGACY_NODE_ID_PREFIX)) return null;

  const digits = decoded.slice(LEGACY_NODE_ID_PREFIX.length);
  return /^\d+$/.test(digits) ? Number(digits) : null;
}

/**
 * Whether a GitHub repo and a Contentful `ghId` refer to the same repository.
 * Prefers the stable numeric database ID; falls back to a direct node_id
 * comparison for identifiers we can't resolve to a database ID. Shared by both
 * the repo lookup and any caller that needs to re-associate a repo with its
 * Contentful entry, so the two never drift apart.
 */
export function repoMatchesGhId(repo: { id: number; node_id: string }, ghId: string): boolean {
  const databaseId = databaseIdFromGhId(ghId);
  return databaseId !== null ? repo.id === databaseId : repo.node_id === ghId;
}

export const getRepositoriesByGhId = async (ghIds: string[]) => {
  const repos = await getAllRepositories();

  return ghIds
    .map((ghId) => repos.find((repo) => repoMatchesGhId(repo, ghId)))
    .filter((each) => each !== undefined);
};

export const getRepositoryReadme = async (owner: string, repo: string) => {
  if (isDisabled || !octokit) {
    console.warn("GitHub integration is disabled");
    return null;
  }

  const { data } = await octokit.repos.getReadme({
    owner,
    repo,
  });

  return data;
};
