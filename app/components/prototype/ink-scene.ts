// PROTOTYPE — throwaway. The ink-dot scene (issue #482).
//
// Client-only. This module is reached exclusively through a dynamic
// `import()` from ink-scene-mount.tsx after hydration, so three.js never
// enters the SSR bundle. It loads a small meshopt GLB, samples points from
// its surface, and renders them as ink dots that assemble beside the
// headline, turn between poses as the visitor scrolls, and dissolve at the
// footer. Performance posture follows remix-website PR #501: DPR cap 1.5,
// device tiering, 30 fps after 5 s idle, pause when hidden.
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Euler,
  Mesh,
  Object3D,
  PerspectiveCamera,
  Points,
  Quaternion,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
} from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { INK_CONFIG, type Easing, type InkVariant } from "./ink-variants";

export interface InkStats {
  importedAt: number;
  modelLoadedAt: number | null;
  firstFrameAt: number | null;
  points: number;
  tier: "full" | "low";
  /** Rolling frame durations in ms, most recent last, capped at 240. */
  frames: number[];
}

declare global {
  interface Window {
    __inkStats?: InkStats;
  }
}

export interface MountOptions {
  variant: InkVariant;
  /** Render one still frame of the assembled car and stop. */
  reducedMotion: boolean;
}

/** Where a pose sits horizontally.
 *  hero: beside the headline column. column: in the gutter to the right of
 *  the reading column. centre: viewport centre. fraction: `x` is a fraction
 *  of the visible half-width and `scale` is absolute (mobile). */
type Anchor = "hero" | "column" | "centre" | "fraction";

interface Pose {
  anchor: Anchor;
  x: number;
  y: number;
  yaw: number;
  pitch: number;
  /** For anchored poses, a multiplier on the measured size; else absolute. */
  scale: number;
  scatter: number;
}

interface Placement {
  x: number;
  scale: number;
}

interface Resolved {
  x: number;
  y: number;
  yaw: number;
  pitch: number;
  scale: number;
  scatter: number;
}

const MODEL_URL = "/models/prototype-race.glb";
const CAMERA_DISTANCE = 3.6;
const FOV = 35;
const DESKTOP_MIN = 1100;
const IDLE_AFTER_MS = 5000;

// Kenney's cars face +z, so yaw 0 is the front toward the camera.
const SIDE = Math.PI / 2;

const DESKTOP_POSES: readonly Pose[] = [
  { anchor: "hero", x: 0, y: -0.1, yaw: SIDE, pitch: 0.02, scale: 1, scatter: 0 },
  { anchor: "column", x: 0, y: 0.02, yaw: 0.6, pitch: 0.12, scale: 1, scatter: 0 },
  { anchor: "column", x: 0, y: -0.04, yaw: Math.PI + 0.15, pitch: 0.1, scale: 1.05, scatter: 0 },
  { anchor: "centre", x: 0, y: 0, yaw: Math.PI + 0.9, pitch: 0.2, scale: 1.1, scatter: 1 },
];
const MOBILE_POSES: readonly Pose[] = [
  { anchor: "fraction", x: 0.05, y: 0.15, yaw: SIDE, pitch: 0.02, scale: 1.25, scatter: 0 },
  { anchor: "fraction", x: 0.2, y: 0.1, yaw: 0.6, pitch: 0.12, scale: 0.85, scatter: 0 },
  {
    anchor: "fraction",
    x: -0.15,
    y: 0.05,
    yaw: Math.PI + 0.15,
    pitch: 0.1,
    scale: 0.9,
    scatter: 0,
  },
  { anchor: "fraction", x: 0, y: 0, yaw: Math.PI + 0.9, pitch: 0.2, scale: 1.0, scatter: 1 },
];

const VERTEX = /* glsl */ `
  attribute vec3 aScatter;
  attribute float aSeed;
  uniform float uScatter;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uOpacity;
  uniform float uScale;
  uniform vec3 uPointer; // x, y in world units at z = 0; z = radius
  uniform float uPointerStrength;
  varying float vAlpha;

  void main() {
    vec3 p = mix(position, aScatter, uScatter);
    // idle shimmer: each dot breathes on its own phase
    float ph = aSeed * 6.2831853;
    p += vec3(
      sin(uTime * 1.1 + ph) * 0.006,
      cos(uTime * 0.8 + ph * 1.7) * 0.006,
      sin(uTime * 0.6 + ph * 2.3) * 0.004
    );
    vec4 world = modelMatrix * vec4(p, 1.0);
    vec2 d = world.xy - uPointer.xy;
    float dist = length(d);
    float push = (1.0 - smoothstep(0.0, uPointer.z, dist)) * uPointerStrength;
    world.xy += (d / max(dist, 1e-4)) * push;
    vec4 mv = viewMatrix * world;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * uScale;
    vAlpha = uOpacity * (0.7 + 0.3 * fract(aSeed * 7.31));
  }
`;

const FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = dot(c, c);
    if (r > 0.25) discard;
    float a = smoothstep(0.25, 0.12, r);
    gl_FragColor = vec4(uColor, a * vAlpha);
  }
`;

function ease(kind: Easing, t: number): number {
  const c = Math.min(1, Math.max(0, t));
  switch (kind) {
    case "linear":
      return c;
    case "eased":
      return c * c * (3 - 2 * c);
    case "overshoot": {
      const k = 1.70158;
      const u = c - 1;
      return 1 + (k + 1) * u * u * u + k * u * u;
    }
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function isLowTier(): boolean {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency <= 4;
  let memoryLow = false;
  if ("deviceMemory" in navigator && typeof navigator.deviceMemory === "number") {
    memoryLow = navigator.deviceMemory <= 4;
  }
  return coarse || cores || memoryLow;
}

function readInkColor(): Color {
  const theme = document.querySelector(".editorial-theme");
  const value = theme ? getComputedStyle(theme).getPropertyValue("--blog-ink").trim() : "";
  return new Color(value || "#1c1a17");
}

/** Merge every mesh in the glTF scene into one position-only geometry,
 *  centred at the origin with its longest axis scaled to 1. */
function buildSourceGeometry(root: Object3D): BufferGeometry {
  root.updateMatrixWorld(true);
  const parts: BufferGeometry[] = [];
  root.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    const src = node.geometry;
    if (!(src instanceof BufferGeometry)) return;
    // Meshopt/quantized GLBs arrive as interleaved or normalized int
    // attributes; copy through the accessor API so every case becomes a
    // plain float position buffer.
    const pos = src.getAttribute("position");
    const copy = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      copy[i * 3] = pos.getX(i);
      copy[i * 3 + 1] = pos.getY(i);
      copy[i * 3 + 2] = pos.getZ(i);
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(copy, 3));
    if (src.index) g.setIndex(src.index.clone());
    const flat = g.toNonIndexed();
    flat.applyMatrix4(node.matrixWorld);
    parts.push(flat);
  });
  const merged = parts.length === 1 && parts[0] ? parts[0] : mergeGeometries(parts, false);
  merged.computeBoundingBox();
  const box = merged.boundingBox;
  if (box) {
    const size = new Vector3();
    box.getSize(size);
    const centre = new Vector3();
    box.getCenter(centre);
    merged.translate(-centre.x, -centre.y, -centre.z);
    const longest = Math.max(size.x, size.y, size.z) || 1;
    merged.scale(1 / longest, 1 / longest, 1 / longest);
  }
  return merged;
}

function samplePoints(source: BufferGeometry, count: number): BufferGeometry {
  const mesh = new Mesh(source);
  const sampler = new MeshSurfaceSampler(mesh).build();
  const positions = new Float32Array(count * 3);
  const scatter = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const p = new Vector3();
  for (let i = 0; i < count; i++) {
    sampler.sample(p);
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
    // scatter target: a point inside a sphere of radius 2.4, volume-uniform
    const r = 2.4 * Math.cbrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const z = Math.random() * 2 - 1;
    const s = Math.sqrt(1 - z * z);
    scatter[i * 3] = r * s * Math.cos(theta);
    scatter[i * 3 + 1] = r * s * Math.sin(theta);
    scatter[i * 3 + 2] = r * z;
    seeds[i] = Math.random();
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(positions, 3));
  g.setAttribute("aScatter", new BufferAttribute(scatter, 3));
  g.setAttribute("aSeed", new BufferAttribute(seeds, 1));
  return g;
}

/** Document-space scroll offsets at which each beat becomes current. */
function measureBeats(): number[] {
  const vh = window.innerHeight;
  const anchors = [
    document.querySelector(".home-text"),
    ...Array.from(document.querySelectorAll(".home-section")),
    document.querySelector(".site-footer"),
  ].filter((el): el is Element => el !== null);
  const offsets = anchors.map((el, i) => {
    if (i === 0) return 0;
    const top = el.getBoundingClientRect().top + window.scrollY;
    return Math.max(0, top - vh * 0.55);
  });
  // Every beat must be reachable: the last one lands exactly at the page's
  // maximum scroll so the dissolve completes at the bottom, and earlier
  // beats are pulled back if they would fall beyond it.
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
  const n = offsets.length;
  for (let i = n - 1; i >= 1; i--) {
    const ceiling =
      i === n - 1 ? maxScroll : Math.min(offsets[i + 1] ?? maxScroll, maxScroll) - 120;
    offsets[i] = Math.min(offsets[i] ?? 0, ceiling);
  }
  if (n > 1) offsets[n - 1] = maxScroll;
  for (let i = 1; i < n; i++) {
    const prev = offsets[i - 1] ?? 0;
    if ((offsets[i] ?? 0) <= prev) offsets[i] = prev + 1;
  }
  return offsets;
}

function rightEdge(selector: string): number {
  const el = document.querySelector(selector);
  return el ? el.getBoundingClientRect().right : 0;
}

export function mountInkScene(canvas: HTMLCanvasElement, options: MountOptions): () => void {
  const config = INK_CONFIG[options.variant];
  const lowTier = isLowTier();
  const pointCount = lowTier ? Math.floor(config.points / 2) : config.points;
  const finePointer =
    window.matchMedia("(pointer: fine)").matches && !lowTier && !options.reducedMotion;

  const stats: InkStats = {
    importedAt: performance.now(),
    modelLoadedAt: null,
    firstFrameAt: null,
    points: pointCount,
    tier: lowTier ? "low" : "full",
    frames: [],
  };
  window.__inkStats = stats;

  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 50);
  camera.position.set(0, 0, CAMERA_DISTANCE);
  camera.lookAt(0, 0, 0);

  const material = new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uScatter: { value: config.loadIn === "scatter" ? 1 : 0 },
      uTime: { value: 0 },
      uSize: { value: config.pointSize },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) },
      uOpacity: { value: 0 },
      uScale: { value: 1 },
      uPointer: { value: new Vector3(99, 99, 0.45) },
      uPointerStrength: { value: finePointer ? 0.22 : 0 },
      uColor: { value: readInkColor() },
    },
  });

  let points: Points | null = null;
  let disposed = false;

  // ── layout state ──
  let halfW = 1;
  let halfH = 1;
  let desktop = window.innerWidth >= DESKTOP_MIN;
  let beats = measureBeats();
  const placements: Record<Anchor, Placement> = {
    hero: { x: 0, scale: 1 },
    column: { x: 0, scale: 1 },
    centre: { x: 0, scale: 1 },
    fraction: { x: 0, scale: 1 },
  };

  /** Pixel centre / length → world x / scale at the z = 0 plane. */
  function place(centrePx: number, lengthPx: number): Placement {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      x: ((centrePx / w) * 2 - 1) * halfW,
      scale: (lengthPx / h) * 2 * halfH,
    };
  }

  function measureLayout() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Beside the headline: the car pairs with the text rather than drifting
    // to the far edge of a wide screen.
    const textRight = rightEdge(".home-text");
    const heroRoom = Math.max(0, w - textRight);
    const heroLen = clamp(0.5 * heroRoom, 280, 0.66 * h);
    placements.hero = place(textRight + Math.min(heroRoom / 2, heroLen * 0.9), heroLen);
    // In the gutter to the right of the reading column.
    const colRight = rightEdge(".home-sections");
    const colRoom = Math.max(0, w - colRight);
    const colLen = clamp(0.5 * colRoom, 200, 0.4 * h);
    // Hug the column: on ultrawide screens the gutter is huge, and the car
    // should stay near the text rather than at the far edge.
    placements.column = place(colRight + Math.min(colRoom / 2, colLen * 0.75 + 24), colLen);
    placements.centre = place(w / 2, clamp(0.35 * w, 260, 0.6 * h));
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    halfH = CAMERA_DISTANCE * Math.tan((FOV * Math.PI) / 360);
    halfW = halfH * camera.aspect;
    desktop = w >= DESKTOP_MIN;
    beats = measureBeats();
    measureLayout();
  }
  resize();

  // ── input state ──
  let scrollTarget = window.scrollY;
  let lastInputAt = performance.now();
  const onScroll = () => {
    scrollTarget = window.scrollY;
    lastInputAt = performance.now();
  };
  const onPointer = (e: PointerEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -((e.clientY / window.innerHeight) * 2 - 1);
    const u = material.uniforms["uPointer"];
    if (u && u.value instanceof Vector3) u.value.set(x * halfW, y * halfH, 0.45);
    lastInputAt = performance.now();
  };
  let resizeTimer: number | null = null;
  const onResize = () => {
    if (resizeTimer !== null) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resize();
      if (options.reducedMotion) renderStill();
    }, 120);
  };
  window.addEventListener("resize", onResize);
  if (!options.reducedMotion) {
    window.addEventListener("scroll", onScroll, { passive: true });
    if (finePointer) window.addEventListener("pointermove", onPointer, { passive: true });
  }

  const themeObserver = new MutationObserver(() => {
    const u = material.uniforms["uColor"];
    if (u) u.value = readInkColor();
    if (options.reducedMotion) renderStill();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  // ── pose interpolation ──
  const qa = new Quaternion();
  const qb = new Quaternion();
  const qOut = new Quaternion();
  const euler = new Euler();
  let scrollSmoothed = scrollTarget;
  let loadStart: number | null = null;

  function resolve(p: Pose): Resolved {
    if (p.anchor === "fraction") {
      return {
        x: p.x * halfW,
        y: p.y * halfH,
        yaw: p.yaw,
        pitch: p.pitch,
        scale: p.scale,
        scatter: p.scatter,
      };
    }
    const pl = placements[p.anchor];
    return {
      x: pl.x,
      y: p.y * halfH,
      yaw: p.yaw,
      pitch: p.pitch,
      scale: pl.scale * p.scale,
      scatter: p.scatter,
    };
  }

  function firstPose(): Pose {
    const table = desktop ? DESKTOP_POSES : MOBILE_POSES;
    return table[0] ?? DESKTOP_POSES[0]!;
  }

  function poseAt(scroll: number): Resolved {
    const table = desktop ? DESKTOP_POSES : MOBILE_POSES;
    const first = firstPose();
    const segments = Math.min(beats.length, table.length) - 1;
    if (segments < 1) return resolve(first);
    let i = 0;
    while (i < segments - 1 && scroll >= (beats[i + 1] ?? Infinity)) i++;
    const start = beats[i] ?? 0;
    const end = beats[i + 1] ?? start + 1;
    const raw = (scroll - start) / (end - start);
    const a = resolve(table[i] ?? first);
    const b = resolve(table[i + 1] ?? table[i] ?? first);
    const t = ease(config.easing, raw);
    const tc = clamp(raw, 0, 1);
    return {
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t),
      yaw: lerp(a.yaw, b.yaw, t),
      pitch: lerp(a.pitch, b.pitch, t),
      scale: lerp(a.scale, b.scale, t),
      scatter: lerp(a.scatter, b.scatter, ease("eased", tc)),
    };
  }

  function applyPose(p: Resolved, now: number, snap: boolean) {
    if (!points) return;
    points.position.set(p.x, p.y, 0);
    qa.setFromEuler(euler.set(p.pitch, p.yaw, 0, "YXZ"));
    if (snap) {
      points.quaternion.copy(qa);
    } else {
      qb.copy(points.quaternion);
      qOut.slerpQuaternions(qb, qa, 0.18);
      points.quaternion.copy(qOut);
    }
    points.scale.setScalar(p.scale);

    // load-in
    let loadScatter = 0;
    let loadOpacity = 1;
    if (loadStart !== null) {
      const el = (now - loadStart) / 1200;
      if (config.loadIn === "scatter") {
        loadScatter = 1 - ease("eased", el);
        loadOpacity = ease("eased", Math.min(1, el * 3));
      } else {
        loadOpacity = ease("eased", el);
      }
      if (el >= 1) loadStart = null;
    }
    const baseOpacity = desktop ? 0.9 : 0.38;
    const uScatter = material.uniforms["uScatter"];
    const uOpacity = material.uniforms["uOpacity"];
    const uScale = material.uniforms["uScale"];
    if (uScatter) uScatter.value = Math.max(loadScatter, p.scatter);
    if (uOpacity) uOpacity.value = baseOpacity * loadOpacity * (1 - p.scatter * 0.85);
    if (uScale) uScale.value = 0.6 + Math.min(1.6, p.scale) * 0.4;
  }

  /** Reduced motion: one frame of the assembled car at the first pose. */
  function renderStill() {
    if (!points) return;
    loadStart = null;
    applyPose(resolve(firstPose()), 0, true);
    renderer.render(scene, camera);
    if (stats.firstFrameAt === null) stats.firstFrameAt = performance.now();
  }

  // ── frame loop with idle governor ──
  let raf = 0;
  let frameIndex = 0;
  let lastFrameAt = 0;

  function frame(now: number) {
    if (disposed) return;
    raf = window.requestAnimationFrame(frame);
    if (document.hidden) return;
    const idle = now - lastInputAt > IDLE_AFTER_MS && loadStart === null;
    frameIndex++;
    if (idle && frameIndex % 2 === 1) return; // ~30 fps when idle

    const t0 = performance.now();
    scrollSmoothed = lerp(scrollSmoothed, scrollTarget, 0.16);
    const uTime = material.uniforms["uTime"];
    if (uTime) uTime.value = now / 1000;
    applyPose(poseAt(scrollSmoothed), now, false);
    renderer.render(scene, camera);
    const dt = performance.now() - t0;
    if (lastFrameAt !== 0) {
      stats.frames.push(dt);
      if (stats.frames.length > 240) stats.frames.shift();
    }
    lastFrameAt = now;
    if (stats.firstFrameAt === null && points) stats.firstFrameAt = performance.now();
  }

  // ── load the model ──
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load(
    MODEL_URL,
    (gltf) => {
      if (disposed) return;
      stats.modelLoadedAt = performance.now();
      const source = buildSourceGeometry(gltf.scene);
      const geometry = samplePoints(source, pointCount);
      source.dispose();
      points = new Points(geometry, material);
      points.frustumCulled = false;
      scene.add(points);
      if (options.reducedMotion) {
        renderStill();
        return;
      }
      const first = poseAt(window.scrollY);
      points.quaternion.setFromEuler(euler.set(first.pitch, first.yaw, 0, "YXZ"));
      loadStart = performance.now();
      lastInputAt = loadStart;
      raf = window.requestAnimationFrame(frame);
    },
    undefined,
    (error) => {
      console.warn("ink scene: model failed to load", error);
    },
  );

  return () => {
    disposed = true;
    window.cancelAnimationFrame(raf);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onPointer);
    themeObserver.disconnect();
    if (points) {
      scene.remove(points);
      points.geometry.dispose();
    }
    material.dispose();
    renderer.dispose();
    if (window.__inkStats === stats) delete window.__inkStats;
  };
}
