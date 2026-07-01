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

// A type assertion is ` as <Type>` where <Type> is not `const`. Allow
// import/export aliases (`import x as y`) which live on import/export lines.
const ASSERTION = /\bas\s+(?!const\b)[A-Za-z_{([<]/;

const offenders = [];
for (const chunk of chunks) {
  for (const line of chunk.split("\n")) {
    if (/^\s*(import|export)\b/.test(line)) continue; // skip module aliases
    if (ASSERTION.test(line)) offenders.push(line.trim());
  }
}

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
