/**
 * Every exhibit, newest first. The index page, the sitemap and each exhibit's
 * own meta read from here, so adding an entry is one edit plus its route.
 */
export interface Exhibit {
  slug: string;
  title: string;
  /** One sentence for the index and the meta description. */
  summary: string;
  /** ISO date the exhibit went up. */
  published: string;
  /**
   * The link-preview card, 1200 × 630. X shows only the image under a shared
   * link, so the card carries the headline itself.
   */
  card: { src: string; alt: string; width: number; height: number };
}

export const EXHIBITS = [
  {
    slug: "garden-ice",
    title: "Garden ice",
    summary:
      "The old Boston Garden rink and the TD Garden rink at true scale, centered on the same red line: in plan, in 3D, and drawn over photographs of both buildings.",
    published: "2026-10-17",
    card: {
      src: "/exhibits/garden-ice/share-card.png",
      alt: "Overhead plan of the 1995 Boston Garden rink drawn in gold inside today's TD Garden rink, with the ice the Garden didn't have hatched at both ends, under the headline: The old Boston Garden ice was nine feet shorter.",
      width: 1200,
      height: 630,
    },
  },
] as const satisfies readonly Exhibit[];

export type ExhibitSlug = (typeof EXHIBITS)[number]["slug"];

export function findExhibit(slug: string): Exhibit {
  const exhibit = EXHIBITS.find((e) => e.slug === slug);
  if (!exhibit) throw new Error(`No exhibit registered for "${slug}"`);
  return exhibit;
}
