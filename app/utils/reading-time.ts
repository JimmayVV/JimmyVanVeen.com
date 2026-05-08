const WORDS_PER_MINUTE = 220;

function wordCount(markdown: string | undefined | null): number {
  if (!markdown) return 0;
  const stripped = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, " $1 ")
    // Strip ATX heading markers at start of line ('# Title', '## Sub')
    // before the bullet pass so '##' doesn't survive as a word token.
    .replace(/^#{1,6}\s+/gm, "")
    // Strip list markers at the start of lines: '- ', '* ', '> ', and
    // numbered '1. ' / '12. ' (any digit run followed by '. ').
    .replace(/^(?:[-*>]|\d+\.)\s/gm, " ")
    // Strip the rest of the markdown punctuation. '_' is omitted on
    // purpose so identifiers like `super_fast` stay one word; same for
    // '#' so 'C#' stays intact.
    .replace(/[*~]/g, " ");
  return stripped.split(/\s+/).filter(Boolean).length;
}

export function readingStats(markdown: string | undefined | null): {
  words: number;
  minutes: number;
  long: boolean;
} {
  const words = wordCount(markdown);
  return {
    words,
    minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    long: words >= 400,
  };
}
