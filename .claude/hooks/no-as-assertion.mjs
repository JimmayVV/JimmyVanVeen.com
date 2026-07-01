#!/usr/bin/env node
/**
 * PreToolUse hook: block TypeScript `as` type assertions in edits.
 *
 * `as` type assertions are banned in this project — they defeat the type
 * checker by asserting a type rather than proving it. Use a type guard,
 * a validated parse, or `satisfies` instead. `as const` (a const
 * assertion, not a type assertion) is allowed.
 *
 * Reads the tool-call JSON on stdin. Exit 2 blocks the call and shows the
 * message to the model.
 */
import { readFileSync } from "node:fs";

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

const raw = readStdin();
let payload;
try {
  payload = JSON.parse(raw);
} catch {
  process.exit(0); // Can't parse — don't block.
}

const input = payload.tool_input ?? {};
const filePath = input.file_path ?? "";

// Only guard TypeScript source.
if (!/\.(ts|tsx|mts|cts)$/.test(filePath)) process.exit(0);

// Collect the text this tool would write.
const chunks = [];
if (typeof input.new_string === "string") chunks.push(input.new_string);
if (typeof input.content === "string") chunks.push(input.content);
if (Array.isArray(input.edits)) {
  for (const e of input.edits) {
    if (e && typeof e.new_string === "string") chunks.push(e.new_string);
  }
}
if (chunks.length === 0) process.exit(0);

// A type assertion is `<expr> as <Type>` (not `as const`). Require an
// expression-ending char before `as` so ordinary prose ("known as X",
// "such as Y") doesn't match, and only scan code — comments and string /
// template contents are stripped first so a comment like `// treat as JSON`
// or a string like "logged in as admin" can't false-positive. This is a
// best-effort early warning; the ESLint rule is the authoritative check.
const ASSERTION = /[\w$)\]]\s+as\s+(?!const\b)[A-Za-z_{([<]/;

function scanForAssertions(chunk) {
  const found = [];
  let inBlockComment = false;
  let inTemplate = false;
  for (const original of chunk.split("\n")) {
    let line = original;
    if (inBlockComment) {
      const end = line.indexOf("*/");
      if (end === -1) continue;
      line = line.slice(end + 2);
      inBlockComment = false;
    }
    if (inTemplate) {
      const end = line.indexOf("`");
      if (end === -1) continue;
      line = line.slice(end + 1);
      inTemplate = false;
    }
    line = line.replace(/\/\*[^]*?\*\//g, " "); // inline block comments
    const openBlock = line.indexOf("/*");
    if (openBlock !== -1) {
      inBlockComment = true;
      line = line.slice(0, openBlock);
    }
    line = line.replace(/\/\/.*$/, ""); // line comment
    line = line
      .replace(/'(?:\\.|[^'\\])*'/g, "''")
      .replace(/"(?:\\.|[^"\\])*"/g, '""')
      .replace(/`(?:\\.|[^`\\])*`/g, "``"); // complete strings/templates
    const openTemplate = line.indexOf("`"); // unterminated template
    if (openTemplate !== -1) {
      inTemplate = true;
      line = line.slice(0, openTemplate);
    }
    if (/^\s*(import|export)\b/.test(line)) continue; // module aliases
    if (ASSERTION.test(line)) found.push(original.trim());
  }
  return found;
}

const offenders = chunks.flatMap(scanForAssertions);

if (offenders.length > 0) {
  const sample = offenders.slice(0, 5).join("\n  ");
  process.stderr.write(
    `Blocked: this edit to ${filePath} uses a banned \`as\` type assertion.\n\n` +
      `  ${sample}\n\n` +
      `\`as\` is constitutionally banned in this project. Instead:\n` +
      `  - narrow with a type guard (e.g. \`function isX(v: unknown): v is X\`)\n` +
      `  - validate/parse the value at the boundary\n` +
      `  - use \`satisfies\` to check a value against a type\n` +
      `(\`as const\` is fine — it is a const assertion, not a type assertion.)\n`,
  );
  process.exit(2);
}

process.exit(0);
