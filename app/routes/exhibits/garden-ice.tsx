import * as React from "react";
import { Link } from "react-router";

import exhibitStyles from "~/exhibits/exhibits.css?url";
import {
  ASSUMPTION_RANGES,
  OLD_GARDEN,
  TD_GARDEN,
  type Unit,
  formatArea,
  formatLength,
  iceArea,
  zoneDepth,
} from "~/exhibits/garden-ice/geometry";
import { PhotoLab } from "~/exhibits/garden-ice/photo-lab";
import { type Era, RinkPlan } from "~/exhibits/garden-ice/rink-plan";
import { RinkViewer } from "~/exhibits/garden-ice/rink-viewer";
import { findExhibit } from "~/exhibits/registry";
import { trackPageView } from "~/utils/analytics-loader";
import { buildMeta } from "~/utils/seo";

import type { Route } from "./+types/garden-ice";

const EXHIBIT = findExhibit("garden-ice");

export const links: Route.LinksFunction = () => [{ rel: "stylesheet", href: exhibitStyles }];

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: "How the old Boston Garden ice compares with TD Garden",
    description: EXHIBIT.summary,
    pathname: `/exhibits/${EXHIBIT.slug}`,
  });

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

const ERAS: { era: Era; label: string }[] = [
  { era: "old", label: "1995" },
  { era: "both", label: "Both" },
  { era: "modern", label: "Today" },
];

const OTHER_PHOTOS = [
  {
    label: "Bob Busser’s 1995 Boston Garden albums",
    note: "practice and game views from the corner and under the balcony",
    href: "https://ballparks.smugmug.com/Boston-Garden-Pt2-razed-Boston-Massachusetts",
  },
  {
    label: "Nick DeWolf’s photos of a 1974 Bruins game",
    note: "the old Garden rink from high above, from the Nick DeWolf Foundation’s archive",
    href: "https://www.flickr.com/photos/dboo/5094268185/",
  },
  {
    label: "The Hockey News, October 2025",
    note: "a Bruins practice at TD Garden with the current markings",
    href: "https://thehockeynews.com/nhl/boston-bruins/latest-news/boston-bruins-lines-on-eve-of-regular-season-opener",
  },
  {
    label: "RateYourSeats, section 313",
    note: "TD Garden from an upper corner",
    href: "https://www.rateyourseats.com/td-garden/seating/sections/313",
  },
  {
    label: "A View From My Seat, section 325",
    note: "TD Garden from the end balcony",
    href: "https://aviewfrommyseat.com/venue/TD%2BGarden/325/",
  },
] as const;

const SOURCES = [
  {
    label: "Boston Garden information sheet, 1987",
    note: "gives the 191 × 83 ft rink (Harvard Graduate School of Education, page 33)",
    href: "https://files.eric.ed.gov/fulltext/ED286720.pdf#page=43",
  },
  {
    label: "Hockey Hall of Fame, Teammates, spring 2013",
    note: "independently confirms 191 × 83 ft",
    href: "https://www.hhof.com/pdf/TeammatesSpring13.pdf",
  },
  {
    label: "NHL Official Rules, 2026–27",
    note: "rules 1.2 to 1.9: today’s dimensions, lines, creases and goals",
    href: "https://media.d3.nhle.com/image/private/t_document/prd/i9yumvyaojps5kixzaxz.pdf",
  },
  {
    label: "NHL historical rule changes",
    note: "where the goal lines and creases sat in the early 1990s",
    href: "https://records.nhl.com/history/historical-rule-changes",
  },
  {
    label: "Gilbert Perreault on the Garden’s corners",
    note: "a 2010 account describing compound, three-radius corners",
    href: "https://blogs.southcoasttoday.com/bruins/2010/01/17/in-the-words-of-the-great-gilbert-perreault/",
  },
] as const;

export default function GardenIce() {
  const [era, setEra] = React.useState<Era>("both");
  const [unit, setUnit] = React.useState<Unit>("ft");
  const [corner, setCorner] = React.useState(OLD_GARDEN.corner);
  const [goal, setGoal] = React.useState(OLD_GARDEN.goal);
  const [blue, setBlue] = React.useState(OLD_GARDEN.blue);

  const old = React.useMemo(() => ({ ...OLD_GARDEN, corner, goal, blue }), [corner, goal, blue]);
  const modern = TD_GARDEN;
  const extraArea = iceArea(modern) - iceArea(old);
  const extraPercent = (extraArea / iceArea(old)) * 100;
  const adjusted =
    corner !== OLD_GARDEN.corner || goal !== OLD_GARDEN.goal || blue !== OLD_GARDEN.blue;

  const sliders = [
    {
      key: "corner",
      label: "Corner radius",
      value: corner,
      set: setCorner,
      range: ASSUMPTION_RANGES.corner,
    },
    {
      key: "goal",
      label: "Goal line from the end boards",
      value: goal,
      set: setGoal,
      range: ASSUMPTION_RANGES.goal,
    },
    {
      key: "blue",
      label: "Blue line from the red line",
      value: blue,
      set: setBlue,
      range: ASSUMPTION_RANGES.blue,
    },
  ] as const;

  return (
    <main className="exhibit-page">
      <header className="exhibit-hero">
        <p className="exhibit-trail">
          <Link to="/exhibits" prefetch="intent">
            Exhibits
          </Link>
        </p>
        <h1>How the old Boston Garden ice compares with TD Garden</h1>
      </header>

      <section className="exhibit-plan" aria-label="Plan view of both rinks">
        <div className="plan-lead">
          <p className="exhibit-dek">
            Until 1995 the Bruins played on a rink nine feet shorter and two feet narrower than the
            one that replaced it. Here are both at true scale, sharing one red line.
          </p>
          <div className="exhibit-controls">
            <fieldset className="segmented">
              <legend className="sr-only">Which rink to draw</legend>
              {ERAS.map((item) => (
                <button
                  key={item.era}
                  type="button"
                  aria-pressed={era === item.era}
                  onClick={() => setEra(item.era)}
                >
                  {item.label}
                </button>
              ))}
            </fieldset>
            <fieldset className="segmented segmented-quiet">
              <legend className="sr-only">Units</legend>
              {(["ft", "m"] as const).map((u) => (
                <button key={u} type="button" aria-pressed={unit === u} onClick={() => setUnit(u)}>
                  {u === "ft" ? "Feet" : "Meters"}
                </button>
              ))}
            </fieldset>
          </div>
        </div>
        <RinkPlan old={old} modern={modern} era={era} unit={unit} />
        <ul className="plan-key">
          <li className="key-old">
            Gold: the Boston Garden boards, dashed where the corner shape is a guess
          </li>
          <li className="key-extra">Hatched: ice TD Garden has that the old Garden didn’t</li>
        </ul>
      </section>

      <article className="exhibit-prose prose-editorial">
        <h2>Where the extra ice went</h2>
        <p>
          The rinks share a red line, and the neutral zone barely changed: the old blue lines sat
          about {formatLength(old.blue, unit)} from center, today’s sit{" "}
          {formatLength(modern.blue, unit)}. The goal lines are {formatLength(modern.goal, unit)}{" "}
          from the end boards in both buildings. So nearly all of the extra length landed in the
          attacking zones, which are {formatLength(zoneDepth(modern), unit)} deep today against
          about {formatLength(zoneDepth(old), unit)} at the Garden. That holds if the old lines
          followed the rules of the day; I couldn’t find a survey of where they were actually
          painted.
        </p>
        <p>
          The extra width is a foot on each side. Add it up and TD Garden has about{" "}
          {formatArea(extraArea, unit)} more ice, {extraPercent.toFixed(1)}% more than the Garden’s{" "}
          {formatArea(iceArea(old), unit)}. The corners decide part of that number, and they’re the
          one thing nobody seems to have measured.
        </p>
      </article>

      <section className="exhibit-section" aria-labelledby="walk-around">
        <div className="exhibit-prose prose-editorial">
          <h2 id="walk-around">Walk around both rinks</h2>
          <p>
            Both rinks are built in 3D from the same numbers. Stand where the balcony was, look
            straight down, or drop to ice level and see how close the Garden’s end boards sat to the
            net.
          </p>
        </div>
        <RinkViewer old={old} modern={modern} unit={unit} />
      </section>

      <section className="exhibit-section" aria-labelledby="photo">
        <div className="exhibit-prose prose-editorial">
          <h2 id="photo">Lay both rinks over a photograph</h2>
          <p>
            Pick a photo and both rinks are drawn onto its ice in the photo’s own perspective: the
            Garden’s in gold, today’s in white, with the ice TD Garden added hatched. Fade either
            one in or out to compare. The ends are where the difference shows, so the view from
            behind a net makes it plainest.
          </p>
          <p>
            Have a better photo, from a seat you sat in? Use your own. It stays in your browser, and
            four handles let you pin the rinks to it.
          </p>
        </div>
        <PhotoLab old={old} modern={modern} />
      </section>

      <section className="exhibit-section" aria-labelledby="known">
        <div className="exhibit-prose prose-editorial">
          <h2 id="known">What’s measured and what’s a guess</h2>
          <p>
            TD Garden follows the current NHL rulebook, so every number on it is a specification
            rather than a survey of the building. The Garden’s overall size is documented twice
            over. Its corners, and exactly where its lines were painted, are not: one account
            describes the corners as three blended curves, and no measurements of them turned up.
          </p>
          <table className="exhibit-table">
            <caption className="sr-only">Certainty of each dimension</caption>
            <thead>
              <tr>
                <th scope="col">Dimension</th>
                <th scope="col">Boston Garden</th>
                <th scope="col">TD Garden</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Length and width</th>
                <td>191 × 83 ft, documented</td>
                <td>200 × 85 ft, rulebook</td>
              </tr>
              <tr>
                <th scope="row">Corner radius</th>
                <td>Unknown; 28 ft stands in</td>
                <td>28 ft, rulebook</td>
              </tr>
              <tr>
                <th scope="row">Goal line from the end</th>
                <td>11 ft, from the rules of the day</td>
                <td>11 ft, rulebook</td>
              </tr>
              <tr>
                <th scope="row">Blue line from center</th>
                <td>About 24.5 ft, inferred</td>
                <td>25 ft, rulebook</td>
              </tr>
            </tbody>
          </table>
          <p>
            Change the guesses below and the plan, the 3D models, the photograph and the numbers
            above all follow. The Garden’s overall size stays fixed.
          </p>
        </div>
        <div className="exhibit-assumptions">
          {sliders.map((slider) => (
            <label key={slider.key} className="assumption">
              <span>{slider.label}</span>
              <input
                type="range"
                min={slider.range.min}
                max={slider.range.max}
                step={slider.range.step}
                value={slider.value}
                onChange={(e) => slider.set(Number(e.target.value))}
              />
              <output>{formatLength(slider.value, unit)}</output>
            </label>
          ))}
          <button
            type="button"
            className="assumptions-reset"
            disabled={!adjusted}
            onClick={() => {
              setCorner(OLD_GARDEN.corner);
              setGoal(OLD_GARDEN.goal);
              setBlue(OLD_GARDEN.blue);
            }}
          >
            Reset the guesses
          </button>
        </div>
      </section>

      <footer className="exhibit-prose prose-editorial exhibit-sources">
        <h2>Sources</h2>
        <ul>
          {SOURCES.map((source) => (
            <li key={source.href}>
              <a href={source.href} target="_blank" rel="noreferrer">
                {source.label}
              </a>
              : {source.note}
            </li>
          ))}
        </ul>
        <h3>More photographs</h3>
        <p>
          These show the rinks well but aren’t mine to republish, so they stay with their owners.
          Open one, save it, and load it as your own photo above to line the rinks up against it.
        </p>
        <ul>
          {OTHER_PHOTOS.map((photo) => (
            <li key={photo.href}>
              <a href={photo.href} target="_blank" rel="noreferrer">
                {photo.label}
              </a>
              : {photo.note}
            </li>
          ))}
        </ul>
      </footer>
    </main>
  );
}
