import type { ReactNode } from "react";
import { Link } from "react-router";

import exhibitStyles from "~/exhibits/exhibits.css?url";
import { OLD_GARDEN, TD_GARDEN } from "~/exhibits/garden-ice/geometry";
import { RinkPlan } from "~/exhibits/garden-ice/rink-plan";
import { EXHIBITS, type ExhibitSlug } from "~/exhibits/registry";
import { formatPostDate } from "~/utils/format-post-date";
import { trackPageView } from "~/utils/analytics-loader";
import { buildMeta } from "~/utils/seo";

import type { Route } from "./+types/index";

const DESCRIPTION =
  "Small things I built that don’t need a repository or a site of their own: interactive models, visual studies, experiments.";

export const links: Route.LinksFunction = () => [{ rel: "stylesheet", href: exhibitStyles }];

export const meta: Route.MetaFunction = () =>
  buildMeta({ title: "Exhibits", description: DESCRIPTION, pathname: "/exhibits" });

/** See app/routes/about.tsx: the empty server loader keeps SSR rendering the page. */
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

/** Each exhibit's thumbnail. Keyed by slug, so a new exhibit without one fails to compile. */
const THUMBNAILS: Record<ExhibitSlug, ReactNode> = {
  "garden-ice": (
    <RinkPlan old={OLD_GARDEN} modern={TD_GARDEN} era="both" unit="ft" labels={false} />
  ),
};

export default function ExhibitsIndex() {
  return (
    <main className="exhibit-page">
      <header className="exhibit-hero">
        <h1>Exhibits</h1>
        <p className="exhibit-dek">{DESCRIPTION}</p>
      </header>
      <ol className="exhibit-list" reversed>
        {EXHIBITS.map((exhibit) => (
          <li key={exhibit.slug}>
            <Link to={`/exhibits/${exhibit.slug}`} prefetch="intent" className="exhibit-entry">
              <div className="exhibit-thumb" aria-hidden="true">
                {THUMBNAILS[exhibit.slug]}
              </div>
              <div>
                <h2>{exhibit.title}</h2>
                <p>{exhibit.summary}</p>
                <time dateTime={exhibit.published}>{formatPostDate(exhibit.published)}</time>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
