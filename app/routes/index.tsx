// Libs
import * as React from "react";
import { Await } from "react-router";

import ContentCards, { ContentCard } from "~/components/content-cards";
// Components
import GradientBanner from "~/components/gradient-banner";
import Project from "~/components/project";
import { trackPageView } from "~/utils/analytics-loader";
import { getCachedProjects } from "~/utils/contentful-cache";
// Utils
import { getRepositoriesByNodeId } from "~/utils/github";

import type { Route } from "./+types/index";

interface Repository {
  /** The name of the repository */
  name: string;
  /** The ID of the repository */
  id: number;
  /** The URL for the repository on GitHub */
  homepageUrl: string | null;
  /** The description of the repository */
  description: string | null;
  /** The URL for the repository on GitHub */
  url: string;
  /** The URL for the screenshot */
  screenshotUrl?: string;
}

export async function loader() {
  async function getData() {
    const projects = await getCachedProjects();
    const repos = await getRepositoriesByNodeId(
      projects
        .sort((a, b) => Number(a.fields.priority) - Number(b.fields.priority))
        .map((p) => p.fields.ghId),
    );
    const repositories: Repository[] = repos.map((repo) => {
      const project = projects.find((p) => p.fields.ghId === repo.node_id);
      return {
        name: repo.name,
        id: repo.id,
        homepageUrl: repo.homepage,
        description: repo.description,
        url: repo.html_url,
        screenshotUrl:
          project?.fields.screenshot && "fields" in project.fields.screenshot
            ? project.fields.screenshot.fields.file?.url
            : undefined,
      } satisfies Repository;
    });
    return repositories;
  }

  return getData();
}

// Add analytics tracking to this route
export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  const data = await serverLoader();
  await trackPageView();
  return data;
}

export default function Index({ loaderData: repos }: Route.ComponentProps) {
  return (
    <div className="min-h-screen bg-black">
      <GradientBanner>
        <h2 className="text-2xl font-mono mb-4 text-white">
          Mission Statement
        </h2>
        <p className="text-[#B0B0B0] text-lg leading-relaxed pb-20">
          My mission is to create innovative and user-centric digital
          experiences that seamlessly blend aesthetics with functionality. I
          strive to push the boundaries of web design and game development,
          always aiming to deliver solutions that not only meet but exceed user
          expectations.
        </p>
      </GradientBanner>

      <ContentCards spacing="space-y-8 -mt-40 relative z-10">
        <ContentCard title="Projects">
          <React.Suspense fallback={"Loading projects..."}>
            <Await resolve={repos} errorElement={"Could not load projects"}>
              {(resolvedRepos) => {
                return (
                  <section className="md:grid md:gap-8 pb-10 md:grid-cols-2">
                    {resolvedRepos.map((repo) => {
                      return (
                        <Project
                          key={repo.id}
                          title={repo.name}
                          description={repo.description}
                          repoUrl={repo.url}
                          url={repo.homepageUrl}
                          screenshotUrl={repo.screenshotUrl}
                        />
                      );
                    })}
                  </section>
                );
              }}
            </Await>
          </React.Suspense>
        </ContentCard>
      </ContentCards>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  // Check if this is a GitHub API authentication error
  // These errors typically have "Requires authentication" in the message
  // and come with a 401 status
  const isGitHubAuthError =
    error?.message?.includes("Requires authentication") ||
    error?.message?.includes("401") ||
    error?.message?.includes("Bad credentials") ||
    error?.message?.includes("Unauthorized");

  // For GitHub auth errors, render the normal page layout with an error message
  if (isGitHubAuthError) {
    return (
      <div className="min-h-screen bg-black">
        <GradientBanner>
          <h2 className="text-2xl font-mono mb-4 text-white">
            Mission Statement
          </h2>
          <p className="text-[#B0B0B0] text-lg leading-relaxed pb-20">
            My mission is to create innovative and user-centric digital
            experiences that seamlessly blend aesthetics with functionality. I
            strive to push the boundaries of web design and game development,
            always aiming to deliver solutions that not only meet but exceed
            user expectations.
          </p>
        </GradientBanner>

        <ContentCards spacing="space-y-8 -mt-40 relative z-10">
          <ContentCard title="Projects">
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-6 rounded-lg mb-6">
              <div className="flex items-start gap-4">
                <svg
                  className="w-8 h-8 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                    GitHub API Configuration Required
                  </h3>
                  <p className="text-base font-medium text-yellow-800 dark:text-yellow-200 mb-4">
                    Projects cannot be loaded without GitHub API access. The
                    portfolio data is temporarily unavailable.
                  </p>
                  <a
                    href="https://github.com/JimmayVV?tab=repositories"
                    className="inline-flex items-center text-base font-semibold text-yellow-700 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View projects on GitHub
                  </a>
                </div>
              </div>
            </div>
          </ContentCard>
        </ContentCards>
      </div>
    );
  }

  // For other errors, show a more generic error boundary
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
        <p className="text-gray-400 mb-6">
          An unexpected error occurred. Please try refreshing the page.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-white text-black font-medium rounded hover:bg-gray-200 transition"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
