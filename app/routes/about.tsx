import { Link } from "react-router";

import { trackPageView } from "~/utils/analytics-loader";
import { SITE_NAME, buildMeta, canonicalUrl } from "~/utils/seo";

import type { Route } from "./+types/about";

/**
 * The page that exists to answer "which Jimmy Van Veen is this one".
 *
 * A search for the name returns a Dutch actor, a darts player, a notary, and
 * several other people. The site ranked first for the name without ever saying
 * who its subject was, so there was nothing for Google to attach the name to.
 * This page is that statement, and it carries the `ProfilePage` markup below —
 * the supported way to assert a person entity, since there is no standalone
 * `Person` rich-result type.
 *
 * Every `sameAs` URL must be a profile that is verifiably his. Adding a
 * plausible-looking one would assert a false identity and make the
 * disambiguation problem worse, not better.
 */

/** Profiles confirmed as his — both already linked from the site footer. */
const PROFILES = [
  { label: "GitHub", href: "https://github.com/JimmayVV" },
  { label: "Bluesky", href: "https://bsky.app/profile/jimmyvanveen.com" },
] as const;

const DESCRIPTION =
  "Jimmy Van Veen is a senior web developer at iRacing in Greater Boston, " +
  "working in React, TypeScript, and React Router.";

export const meta: Route.MetaFunction = () => [
  ...buildMeta({
    title: "About",
    description: DESCRIPTION,
    pathname: "/about",
  }),
  {
    // Every property here is rendered below. Structured data may only describe
    // what a visitor can actually see on the page.
    "script:ld+json": {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      mainEntity: {
        "@type": "Person",
        name: SITE_NAME,
        jobTitle: "Senior Web Developer",
        description: DESCRIPTION,
        worksFor: { "@type": "Organization", name: "iRacing" },
        url: canonicalUrl("/about"),
        sameAs: PROFILES.map((p) => p.href),
      },
    },
  },
];

/**
 * A server loader that returns nothing still matters. Without one, a
 * `clientLoader` marked `hydrate = true` makes React Router render the
 * HydrateFallback during SSR instead of this component, so the response
 * carries a correct <title> over an empty body — invisible in a browser,
 * fatal to a crawler. /privacy shipped that way unnoticed.
 */
export function loader() {
  return null;
}

export async function clientLoader() {
  trackPageView().catch((error) => {
    console.warn("Analytics tracking failed:", error);
  });
  return null;
}
clientLoader.hydrate = true;

export default function About() {
  return (
    <main className="blog-page">
      <header className="blog-post-hero">
        <div className="dateline">Jimmy Van Veen · Greater Boston</div>
        <h1>About</h1>
        <p className="dek">{DESCRIPTION}</p>
        <div className="rule" />
      </header>

      <article className="prose-editorial">
        <p>
          I&rsquo;m a senior web developer at <strong>iRacing</strong>, where I work on the front
          end of a racing simulator that a lot of people take very seriously. I live and work in the
          Greater Boston area.
        </p>

        <p>
          Day to day that means React, TypeScript, and React Router, and a long-standing habit of
          reaching for whichever version of those shipped most recently. This site runs on React
          Router v7 with server-side rendering, Tailwind v4, and Contentful, and it exists partly so
          I have somewhere to try things before I suggest them at work.
        </p>

        <h2>What I build</h2>

        <p>
          Mostly tools I wanted and could not find. <strong>Atrium</strong> is a single window that
          holds every project I have running &mdash; an organizer, deliberately not an orchestrator.
          I maintain a handful of MCP servers, including one for YNAB and one wrapped around the
          Bitbucket REST API. The rest, including the source of this site, is on GitHub.
        </p>

        <h2>What I write about</h2>

        <p>
          Things I learned the slow way: a git worktrees workflow that survives constant
          context-switching, what four weeks of running an agentic memory system by hand actually
          proved, why I built the tool I built. First-hand accounts with the mistakes left in, not
          tutorials.{" "}
          <Link to="/blog" prefetch="intent">
            The blog
          </Link>{" "}
          has all of it, and there is <a href="/rss.xml">an RSS feed</a> if you would rather not
          come looking.
        </p>

        <h2>Elsewhere</h2>

        <ul>
          {PROFILES.map((profile) => (
            <li key={profile.href}>
              <a href={profile.href} target="_blank" rel="noreferrer">
                {profile.label}
              </a>
            </li>
          ))}
        </ul>

        <p>
          And yes &mdash; I race cars on the internet. That is the day job and most of the evenings
          too.
        </p>
      </article>
    </main>
  );
}
