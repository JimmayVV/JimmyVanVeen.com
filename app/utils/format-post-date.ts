import { format, parseISO } from "date-fns";

export function formatPostDate(iso: string): string {
  try {
    return format(parseISO(iso), "MMMM d, yyyy");
  } catch {
    // Surface the raw string rather than crashing the entire page if
    // Contentful ever returns a malformed/empty publishDate.
    return iso;
  }
}
