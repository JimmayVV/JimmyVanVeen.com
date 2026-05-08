const WORDS_PER_MINUTE = 220;

export function wordCount(markdown: string | undefined | null): number {
  if (!markdown) return 0;
  const stripped = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " $1 ")
    .replace(/[#>*_~-]/g, " ");
  return stripped.split(/\s+/).filter(Boolean).length;
}

export function readingMinutes(markdown: string | undefined | null): number {
  const words = wordCount(markdown);
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function isLongPost(markdown: string | undefined | null): boolean {
  return wordCount(markdown) >= 400;
}
