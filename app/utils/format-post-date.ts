import { format, parseISO } from "date-fns";

export function formatPostDate(iso: string): string {
  return format(parseISO(iso), "MMMM d, yyyy");
}
