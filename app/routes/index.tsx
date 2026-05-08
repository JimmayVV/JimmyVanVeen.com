import * as React from "react";
import { Await, Link, useRouteLoaderData } from "react-router";

import { Plate } from "~/components/site/plate";
import { ProjectRow } from "~/components/site/project-row";
import type { loader as rootLoader } from "~/root";
import { trackPageView } from "~/utils/analytics-loader";
import { getCachedProjects } from "~/utils/contentful-cache";
import { formatPostDate } from "~/utils/format-post-date";
import { getRepositoriesByNodeId } from "~/utils/github";

import type { Route } from "./+types/index";

interface Repository {
  name: string;
  id: number;
  homepageUrl: string | null;
  description: string | null;
  url: string;
  screenshotUrl: string | null;
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
      const screenshot =
        project?.fields.screenshot && "fields" in project.fields.screenshot
          ? project.fields.screenshot.fields.file?.url
          : undefined;
      return {
        name: repo.name,
        id: repo.id,
        homepageUrl: repo.homepage,
        description: repo.description,
        url: repo.html_url,
        screenshotUrl: screenshot ? normalizeAssetUrl(screenshot) : null,
      };
    });
    return repositories;
  }

  return getData();
}

function normalizeAssetUrl(url: string): string {
  return url.startsWith("//") ? `https:${url}` : url;
}

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  const result = await serverLoader();
  trackPageView().catch((error) => {
    console.warn("Analytics tracking failed:", error);
  });
  return result;
}
clientLoader.hydrate = true;

export default function Index({ loaderData: repos }: Route.ComponentProps) {
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const recentPosts = (rootData ?? []).slice(0, 3);

  return (
    <main className="home-cover">
      <div className="home-text">
        <div className="home-dateline">
          Jimmy Van Veen · Web engineer · Greater Boston
        </div>
        <h1 className="home-title">
          I build software, write down what I learn, and race cars on the
          internet.
        </h1>
        <p className="home-dek">
          A working portfolio &mdash; projects I&rsquo;ve shipped, notes from
          the workshop, and the occasional lap at Talladega. The interesting
          stuff is in the writing.
        </p>
      </div>

      <Plate
        className="home-hero-plate"
        src="/images/talladega_glory.jpg"
        alt="A pack of stock cars running three-wide down the front stretch at Talladega Superspeedway in iRacing."
        caption="iRacing — the day job, and the way I spend most evenings"
        width={1920}
        height={1080}
        priority
      />

      <div className="home-sections">
        {recentPosts.length > 0 ? (
          <section className="home-section">
            <div className="head">
              <h2>Recent writing</h2>
              <Link to="/blog" prefetch="intent" className="see-all">
                All posts →
              </Link>
            </div>
            <ul className="blog-index-list">
              {recentPosts.map((post) => (
                <li className="blog-index-row" key={post.slug}>
                  <Link to={`/blog/${post.slug}`} prefetch="intent">
                    <div className="meta">
                      {formatPostDate(post.publishDate)}
                    </div>
                    <h3 className="title">{post.title}</h3>
                    {post.description ? (
                      <p className="dek">{post.description}</p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="home-section">
          <div className="head">
            <h2>Selected work</h2>
            <a
              href="https://github.com/JimmayVV"
              target="_blank"
              rel="noreferrer"
              className="see-all"
            >
              GitHub →
            </a>
          </div>
          <React.Suspense fallback={<ProjectsFallback />}>
            <Await resolve={repos} errorElement={<ProjectsError />}>
              {(resolvedRepos) => (
                <div>
                  {resolvedRepos.slice(0, 4).map((repo: Repository) => (
                    <ProjectRow
                      key={repo.id}
                      title={repo.name}
                      description={repo.description}
                      liveUrl={repo.homepageUrl}
                      repoUrl={repo.url}
                      screenshotUrl={repo.screenshotUrl}
                    />
                  ))}
                </div>
              )}
            </Await>
          </React.Suspense>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}

function ProjectsFallback() {
  return <p className="projects-status">Loading projects&hellip;</p>;
}

function ProjectsError() {
  return (
    <p className="projects-status">
      Couldn&rsquo;t reach GitHub right now. Try again later, or browse{" "}
      <a href="https://github.com/JimmayVV">the source on GitHub</a>.
    </p>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>© Jimmy Van Veen</span>
      <div className="footer-links">
        <a href="https://github.com/JimmayVV" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a
          href="https://bsky.app/profile/jimmyvanveen.com"
          target="_blank"
          rel="noreferrer"
        >
          Bluesky
        </a>
        <Link to="/privacy" prefetch="intent">
          Privacy
        </Link>
      </div>
    </footer>
  );
}

export function ErrorBoundary() {
  return (
    <main className="home-cover">
      <h1 className="home-title">Something went wrong</h1>
      <p className="home-dek">
        An unexpected error occurred while loading the home page. Try
        refreshing.
      </p>
    </main>
  );
}
