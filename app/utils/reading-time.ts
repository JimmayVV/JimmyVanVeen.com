const WORDS_PER_MINUTE = 220;

function wordCount(markdown: string | undefined | null): number {
  if (!markdown) return 0;
  const stripped = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, " $1 ")
    .replace(/[#>*_~-]/g, " ");
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
