import * as React from "react";
import { Await, Link, useRouteLoaderData, useSearchParams } from "react-router";

// PROTOTYPE (issue #471) — remove with the prototype branch.
import { PrototypeSwitcher } from "~/components/prototype/prototype-switcher";
import {
  LongLapOverlay,
  RuleRunnerCar,
  TRACK_VARIANTS,
  WhisperTrack,
  parseTrackVariant,
} from "~/components/prototype/track-variants";
import { Plate } from "~/components/site/plate";
import { ProjectRow } from "~/components/site/project-row";
import type { loader as rootLoader } from "~/root";
import { trackPageView } from "~/utils/analytics-loader";
import { getCachedProjects } from "~/utils/contentful-cache";
import { formatPostDate } from "~/utils/format-post-date";
import { getRepositoriesByGhId, repoMatchesGhId } from "~/utils/github";

import protoStyles from "~/prototype-track.css?url";

import type { Route } from "./+types/index";

// PROTOTYPE stylesheet; route-level links merge with root's.
export const links: Route.LinksFunction = () => [{ rel: "stylesheet", href: protoStyles }];

// PROTOTYPE stand-ins so the rules exist when Contentful/GitHub are stubbed
// off locally. Only used while `?variant=` is set.
const PROTOTYPE_POSTS = [
  {
    title: "Placeholder: what the pit wall taught me about on-call",
    description: "Stand-in dek so the Recent writing rule exists in the prototype.",
    slug: "prototype-one",
    publishDate: "2026-08-20",
  },
  {
    title: "Placeholder: a second post so the list has height",
    description: undefined,
    slug: "prototype-two",
    publishDate: "2026-07-02",
  },
] as const;
const PROTOTYPE_REPOS: Repository[] = [
  {
    name: "placeholder-project",
    id: -1,
    homepageUrl: null,
    description: "Stand-in project row so the Selected work rule has something under it.",
    url: "https://github.com/JimmayVV",
    screenshotUrl: null,
  },
  {
    name: "another-placeholder",
    id: -2,
    homepageUrl: null,
    description: "Second stand-in row.",
    url: "https://github.com/JimmayVV",
    screenshotUrl: null,
  },
];

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
    const repos = await getRepositoriesByGhId(
      projects
        .toSorted((a, b) => Number(a.fields.priority) - Number(b.fields.priority))
        .map((p) => p.fields.ghId),
    );
    const repositories: Repository[] = repos.map((repo) => {
      const project = projects.find((p) => repoMatchesGhId(repo, p.fields.ghId));
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
  // Couples this page to the shape returned by app/root.tsx's loader
  // ({ title, description, slug, publishDate }). If that loader's
  // shape changes, update the "Recent writing" rendering below.
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const [searchParams] = useSearchParams();
  const variant = parseTrackVariant(searchParams.get("variant"));
  const sectionsRef = React.useRef<HTMLDivElement>(null);
  const realPosts = (rootData ?? []).slice(0, 3);
  const recentPosts = variant && realPosts.length === 0 ? PROTOTYPE_POSTS : realPosts;

  return (
    <main className={`home-cover${variant ? " proto-host" : ""}`}>
      <div className="home-text">
        <div className="home-dateline">Jimmy Van Veen · Web engineer · Greater Boston</div>
        <h1 className="home-title">
          I build software, write down what I learn, and race cars on the internet.
        </h1>
        <p className="home-dek">
          A working portfolio &mdash; projects I&rsquo;ve shipped, notes from the workshop, and the
          occasional lap at Talladega. The interesting stuff is in the writing.
        </p>
        {variant === "C" ? <WhisperTrack /> : null}
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

      <div className="home-sections" ref={sectionsRef}>
        {variant === "B" ? <LongLapOverlay host={sectionsRef} /> : null}
        {recentPosts.length > 0 ? (
          <section className="home-section">
            <div className="head">
              <h2>Recent writing</h2>
              <Link to="/blog" prefetch="intent" className="see-all">
                All posts →
              </Link>
              {variant === "A" ? <RuleRunnerCar /> : null}
            </div>
            <ul className="blog-index-list">
              {recentPosts.map((post) => (
                <li className="blog-index-row" key={post.slug}>
                  <Link to={`/blog/${post.slug}`} prefetch="intent">
                    <div className="meta">{formatPostDate(post.publishDate)}</div>
                    <h3 className="title">{post.title}</h3>
                    {post.description ? <p className="dek">{post.description}</p> : null}
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
            {variant === "A" ? <RuleRunnerCar /> : null}
          </div>
          <React.Suspense fallback={<ProjectsFallback />}>
            <Await resolve={repos} errorElement={<ProjectsError />}>
              {(resolvedRepos) => (
                <div>
                  {(variant && resolvedRepos.length === 0 ? PROTOTYPE_REPOS : resolvedRepos).map(
                    (repo: Repository) => (
                      <ProjectRow
                        key={repo.id}
                        title={repo.name}
                        description={repo.description}
                        liveUrl={repo.homepageUrl}
                        repoUrl={repo.url}
                        screenshotUrl={repo.screenshotUrl}
                      />
                    ),
                  )}
                </div>
              )}
            </Await>
          </React.Suspense>
        </section>
        <SiteFooter />
      </div>

      {variant ? <PrototypeSwitcher variants={TRACK_VARIANTS} current={variant} /> : null}
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
        <a href="https://bsky.app/profile/jimmyvanveen.com" target="_blank" rel="noreferrer">
          Bluesky
        </a>
        <Link to="/privacy" prefetch="intent">
          Privacy
        </Link>
        <a href="/rss.xml">RSS</a>
      </div>
    </footer>
  );
}

export function ErrorBoundary() {
  return (
    <main className="home-cover">
      <h1 className="home-title">Something went wrong</h1>
      <p className="home-dek">
        An unexpected error occurred while loading the home page. Try refreshing.
      </p>
    </main>
  );
}
