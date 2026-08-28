/**
 * Escapes the five XML special characters so untrusted text (post titles,
 * descriptions, URLs) can be interpolated into an XML document safely.
 */
export function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
