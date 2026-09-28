import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

import { Resvg, initWasm } from "@resvg/resvg-wasm";
import satori from "satori";

import { formatPostDate } from "~/utils/format-post-date";

import jetbrainsMono from "./fonts/jetbrains-mono-500.ttf?inline";
import newsreader from "./fonts/newsreader-600.ttf?inline";
import sourceSerif from "./fonts/source-serif-4-400.ttf?inline";

/**
 * Share cards for blog posts: the post's own title and description, set on the
 * paper theme, so a link on X or Bluesky previews the post instead of the
 * site-wide Talladega plate, which says nothing about any particular post.
 *
 * Fonts are static TTF instances inlined into the server bundle. Satori can't
 * read WOFF2 or variable fonts, and inlining avoids reaching for the
 * filesystem from a Netlify Function, where bundled paths aren't guaranteed.
 *
 * Rasterising uses resvg's WebAssembly build. The native @resvg/resvg-js picks
 * a platform binary at runtime that Netlify's function bundler didn't ship, and
 * the failed import took every SSR route down with it. Vite won't inline a
 * .wasm file, so it's read from node_modules on first use; netlify.toml's
 * included_files ships it with the function.
 */

export const SHARE_CARD_WIDTH = 1200;
export const SHARE_CARD_HEIGHT = 630;

// Paper theme tokens from app/app.css. Duplicated because Satori can't read
// CSS custom properties; keep them in step if the palette moves.
const PAPER_BG = "#f7f4ec";
const PAPER_INK = "#1c1a17";
const PAPER_MUTED = "#6e665b";
const PAPER_RULE = "#d9d2c3";
const PAPER_ACCENT = "#7a2e1f";

export interface ShareCardPost {
  title: string;
  description?: string | undefined;
  publishDate?: string | undefined;
}

function inlineData(dataUri: string): Buffer {
  return Buffer.from(dataUri.slice(dataUri.indexOf(",") + 1), "base64");
}

const fonts = [
  { name: "Newsreader", data: inlineData(newsreader), weight: 600, style: "normal" },
  { name: "Source Serif 4", data: inlineData(sourceSerif), weight: 400, style: "normal" },
  { name: "JetBrains Mono", data: inlineData(jetbrainsMono), weight: 500, style: "normal" },
] as const;

// initWasm throws if called twice, so every render shares one promise.
let resvgReady: Promise<void> | undefined;
function ensureResvg(): Promise<void> {
  resvgReady ??= readFile(
    createRequire(import.meta.url).resolve("@resvg/resvg-wasm/index_bg.wasm"),
  ).then((wasm) => initWasm(wasm));
  return resvgReady;
}

/** Longer titles step down so a two-line title never runs into the description. */
export function titleSize(title: string): number {
  if (title.length <= 32) return 84;
  if (title.length <= 56) return 68;
  return 56;
}

/** Cut at a word boundary so a long description ends on "…", not mid-word. */
export function clampText(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:]+$/, "")}…`;
}

function ShareCard({ title, description, publishDate }: ShareCardPost) {
  // Satori calls this as a plain function, outside React's renderer, so the
  // React Compiler's memo-cache hook would throw "Invalid hook call" here.
  // Vitest doesn't run the compiler, so only the production build shows it.
  "use no memo";

  const byline = publishDate ? `Jimmy Van Veen · ${formatPostDate(publishDate)}` : "Jimmy Van Veen";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: PAPER_BG,
        color: PAPER_INK,
      }}
    >
      <div style={{ width: 18, height: "100%", backgroundColor: PAPER_ACCENT }} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "64px 80px 56px 72px",
        }}
      >
        <div
          style={{
            fontFamily: "JetBrains Mono",
            fontSize: 22,
            letterSpacing: 3,
            color: PAPER_ACCENT,
          }}
        >
          JIMMYVANVEEN.COM / BLOG
        </div>
        <div
          style={{
            marginTop: 36,
            fontFamily: "Newsreader",
            fontSize: titleSize(title),
            lineHeight: 1.08,
            textWrap: "balance",
            letterSpacing: -1,
          }}
        >
          {clampText(title, 90)}
        </div>
        {description ? (
          <div
            style={{
              marginTop: 28,
              paddingTop: 28,
              borderTop: `2px solid ${PAPER_RULE}`,
              fontFamily: "Source Serif 4",
              fontSize: 30,
              lineHeight: 1.4,
              color: PAPER_MUTED,
            }}
          >
            {clampText(description, 190)}
          </div>
        ) : null}
        <div
          style={{
            marginTop: "auto",
            fontFamily: "JetBrains Mono",
            fontSize: 22,
            color: PAPER_MUTED,
          }}
        >
          {byline}
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the card to PNG bytes. Copied into a fresh ArrayBuffer-backed array
 * because Response bodies won't take resvg's Node Buffer type directly.
 */
export async function renderShareCard(post: ShareCardPost): Promise<Uint8Array<ArrayBuffer>> {
  await ensureResvg();
  const svg = await satori(<ShareCard {...post} />, {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    fonts: [...fonts],
  });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: SHARE_CARD_WIDTH } })
    .render()
    .asPng();
  return new Uint8Array(png);
}
