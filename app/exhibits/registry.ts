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
}

export const EXHIBITS = [
  {
    slug: "garden-ice",
    title: "Garden ice",
    summary:
      "The old Boston Garden rink and the TD Garden rink at true scale, centered on the same red line: in plan, in 3D, and drawn over photographs of both buildings.",
    published: "2026-10-17",
  },
] as const satisfies readonly Exhibit[];

export type ExhibitSlug = (typeof EXHIBITS)[number]["slug"];

export function findExhibit(slug: string): Exhibit {
  const exhibit = EXHIBITS.find((e) => e.slug === slug);
  if (!exhibit) throw new Error(`No exhibit registered for "${slug}"`);
  return exhibit;
}
