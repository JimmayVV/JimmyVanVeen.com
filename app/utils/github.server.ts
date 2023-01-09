import { Octokit as createOctokit } from "@octokit/rest"
import { throttling } from "@octokit/plugin-throttling"

const Octokit = createOctokit.plugin(throttling)

type ThrottleOptions = {
  method: string
  url: string
  request: { retryCount: number }
}

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  throttle: {
    onRateLimit: (retryAfter: number, options: ThrottleOptions) => {
      console.warn(
        `Request quota exhausted for request ${options.method} ${options.url}. Retrying after ${retryAfter} seconds.`,
      )

      return true
    },
    onAbuseLimit: (_retryAfter: number, options: ThrottleOptions) => {
      // does not retry, only logs a warning
      octokit.log.warn(
        `Abuse detected for request ${options.method} ${options.url}`,
      )
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

  const data = nodeIds
    .map(nodeId => repos.find(repo => repo.node_id === nodeId))
    .filter(each => each !== undefined)

  return data as typeof repos
}

export const getRepositoryReadme = async (owner: string, repo: string) => {
  const { data } = await octokit.repos.getReadme({
    owner,
    repo,
  })

  return data
}
