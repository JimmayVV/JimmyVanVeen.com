import { Octokit as createOctokit } from "@octokit/rest"
import { throttling } from "@octokit/plugin-throttling"

const Octokit = createOctokit.plugin(throttling)

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  throttle: {
    onRateLimit: (retryAfter, options) => {
      console.warn(
        `Request quota exhausted for request ${options.method} ${options.url}. Retrying after ${String(retryAfter)} seconds.`,
      )

      return true
    },
    onSecondaryRateLimit: (retryAfter, options) => {
      console.warn(
        `SecondaryRateLimit detected for request ${options.method} ${options.url}. Retrying after ${String(retryAfter)} seconds.`,
      )

      return true
    },
  },
})

export const getAllRepositories = async () => {
  const { data } = await octokit.repos.listForAuthenticatedUser({
    per_page: 100,
  })

  return data
}

export const getRepositoriesByNodeId = async (nodeIds: string[]) => {
  const repos = await getAllRepositories()

  return nodeIds
    .map(nodeId => repos.find(repo => repo.node_id === nodeId))
    .filter(each => each !== undefined)
}

export const getRepositoryReadme = async (owner: string, repo: string) => {
  const { data } = await octokit.repos.getReadme({
    owner,
    repo,
  })

  return data
}
