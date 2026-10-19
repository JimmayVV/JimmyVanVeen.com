/**
 * The Three.js side of the Garden Ice exhibit. Browser only: the viewer
 * imports this module dynamically, so `three` never enters the server bundle.
 *
 * Ported from the original Garden / Ice study (v7) with the era artwork, board
 * advertisements and photo lab removed; those live elsewhere on the page or
 * were third-party assets.
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

import {
  GOAL_MOUTH,
  type Rink,
  type RinkId,
  type Unit,
  formatLength,
  netBase,
  perimeter,
} from "./geometry";

import { CENTER_ICE } from "./center-ice";
import { type CameraView, type ViewerMode, framing, visibility } from "./scene-layout";

export type { CameraView, ViewerMode } from "./scene-layout";

export interface SceneState {
  old: Rink;
  modern: Rink;
  mode: ViewerMode;
  boards: boolean;
  dimensions: boolean;
  oldGoals: boolean;
  modernGoals: boolean;
  unit: Unit;
}

/** Gold marks 1995 in every view on the page; today's rink stays neutral. */
const COLORS = {
  old: "#e2ad35",
  modern: "#eef2f2",
  /** Today's rink drawn flat on white ice needs a darker stand-in for its white. */
  modernFlat: "#46596a",
  ice: "#e4ebea",
  red: "#c8102e",
  blue: "#1f4e9a",
  crease: "#a9d6e6",
  board: "#f4f2ea",
  glass: "#b9d7de",
  net: "#c8102e",
  frame: "#f6f6f2",
  background: "#121a1f",
} as const;

function lineMesh(
  group: THREE.Group,
  points: [number, number, number][],
  color: string,
  width = 0.08,
) {
  const material = new THREE.MeshBasicMaterial({ color });
  for (let i = 1; i < points.length; i++) {
    const [ax, ay, az] = points[i - 1] ?? [0, 0, 0];
    const [bx, by, bz] = points[i] ?? [0, 0, 0];
    const a = new THREE.Vector3(ax, ay, az);
    const b = new THREE.Vector3(bx, by, bz);
    const delta = b.clone().sub(a);
    if (delta.length() < 1e-5) continue;
    const segment = new THREE.Mesh(
      new THREE.CylinderGeometry(width, width, delta.length(), 5),
      material,
    );
    segment.position.copy(a).add(b).multiplyScalar(0.5);
    segment.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    group.add(segment);
  }
}

function textSprite(text: string, x: number, z: number, color: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 112;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "rgba(18, 26, 31, 0.86)";
    ctx.beginPath();
    ctx.roundRect(0, 0, 512, 112, 18);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = "500 56px Newsreader, Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 58);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true }),
  );
  sprite.position.set(x, 1.5, z);
  sprite.scale.set(28, 6.1, 1);
  sprite.renderOrder = 10;
  return sprite;
}

/** Flat shape of the ice, lying on the XZ plane, with UVs spanning the rink. */
function iceGeometry(rink: Rink, hole?: Rink): THREE.ShapeGeometry {
  const shape = new THREE.Shape(perimeter(rink).map(([x, z]) => new THREE.Vector2(x, -z)));
  if (hole) {
    shape.holes.push(new THREE.Path(perimeter(hole).map(([x, z]) => new THREE.Vector2(x, -z))));
  }
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes["position"];
  const uv = geometry.attributes["uv"];
  if (position && uv) {
    for (let i = 0; i < position.count; i++) {
      uv.setXY(
        i,
        (position.getX(i) + rink.length / 2) / rink.length,
        (rink.width / 2 - position.getZ(i)) / rink.width,
      );
    }
  }
  return geometry;
}

function markingTexture(rink: Rink): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const q = canvas.getContext("2d");
  if (q) {
    q.scale(canvas.width / rink.length, canvas.height / rink.width);
    q.translate(rink.length / 2, rink.width / 2);
    const stroke = (pts: [number, number][], color: string, width = 1 / 6) => {
      q.strokeStyle = color;
      q.lineWidth = width;
      q.beginPath();
      pts.forEach(([x, y], i) => (i ? q.lineTo(x, y) : q.moveTo(x, y)));
      q.stroke();
    };
    const circle = (x: number, y: number, r: number, color: string, fill = false) => {
      q.beginPath();
      q.arc(x, y, r, 0, Math.PI * 2);
      q.strokeStyle = color;
      q.fillStyle = color;
      q.lineWidth = 1 / 6;
      if (fill) q.fill();
      else q.stroke();
    };
    const half = rink.width / 2;
    for (const s of [-1, 1]) {
      const goal = s * (rink.length / 2 - rink.goal);
      stroke(
        [
          [s * rink.blue, -half],
          [s * rink.blue, half],
        ],
        COLORS.blue,
        1,
      );
      stroke(
        [
          [goal, -half],
          [goal, half],
        ],
        COLORS.red,
      );
      for (const z of [-22, 22]) {
        circle(goal - s * 20, z, 15, COLORS.red);
        circle(goal - s * 20, z, 1, COLORS.red, true);
        circle(s * (rink.blue - 5), z, 1, COLORS.red, true);
      }
      q.save();
      q.translate(goal, 0);
      q.scale(-s, 1);
      q.fillStyle = COLORS.crease;
      q.strokeStyle = COLORS.red;
      q.lineWidth = 1 / 6;
      q.beginPath();
      if (rink.id === "old") {
        q.moveTo(0, -6);
        q.arc(0, 0, 6, -Math.PI / 2, Math.PI / 2);
      } else {
        q.moveTo(0, -4);
        q.lineTo(4.472, -4);
        q.arc(0, 0, 6, -Math.asin(4 / 6), Math.asin(4 / 6));
        q.lineTo(0, 4);
      }
      q.closePath();
      q.fill();
      q.stroke();
      q.restore();
      if (rink.id === "modern") {
        for (const z of [-1, 1])
          stroke(
            [
              [goal, z * 11],
              [s * (rink.length / 2), z * 14],
            ],
            COLORS.red,
          );
      }
    }
    stroke(
      [
        [0, -half],
        [0, half],
      ],
      COLORS.red,
      1,
    );
    circle(0, 0, 15, COLORS.blue);
    circle(0, 0, 0.5, COLORS.blue, true);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Diagonal hatching for the ice TD has and the old Garden didn't, matching the plan. */
function hatchTexture(rink: Rink): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const q = canvas.getContext("2d");
  if (q) {
    q.fillStyle = "rgba(61, 71, 76, 0.12)";
    q.fillRect(0, 0, canvas.width, canvas.height);
    q.strokeStyle = "rgba(61, 71, 76, 0.8)";
    const spacing = (canvas.width / rink.length) * 1.6;
    q.lineWidth = spacing * 0.28;
    for (let x = -canvas.height; x < canvas.width; x += spacing) {
      q.beginPath();
      q.moveTo(x, 0);
      q.lineTo(x + canvas.height, canvas.height);
      q.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Diamond netting, tiled across the net's surfaces. */
function meshTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const q = canvas.getContext("2d");
  if (q) {
    q.strokeStyle = "rgba(255, 255, 255, 0.95)";
    q.lineWidth = 3;
    q.beginPath();
    q.moveTo(0, 0);
    q.lineTo(64, 64);
    q.moveTo(64, 0);
    q.lineTo(0, 64);
    q.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

type Vec3 = [number, number, number];

/** Resample a polyline to `count` points evenly spaced along its length. */
function resample(points: Vec3[], count: number): Vec3[] {
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    const [ax, ay, az] = points[i - 1] ?? [0, 0, 0];
    const [bx, by, bz] = points[i] ?? [0, 0, 0];
    lengths.push((lengths[i - 1] ?? 0) + Math.hypot(bx - ax, by - ay, bz - az));
  }
  const total = lengths.at(-1) ?? 0;
  return Array.from({ length: count }, (_, k) => {
    const target = (total * k) / (count - 1);
    let i = 1;
    while (i < lengths.length - 1 && (lengths[i] ?? 0) < target) i++;
    const l0 = lengths[i - 1] ?? 0;
    const l1 = lengths[i] ?? l0;
    const t = l1 > l0 ? (target - l0) / (l1 - l0) : 0;
    const [ax, ay, az] = points[i - 1] ?? [0, 0, 0];
    const [bx, by, bz] = points[i] ?? [0, 0, 0];
    return [ax + (bx - ax) * t, ay + (by - ay) * t, az + (bz - az) * t];
  });
}

/** A surface stretched between two polylines with the same number of points. */
function loft(a: Vec3[], b: Vec3[], material: THREE.Material, cell: number): THREE.Mesh {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let along = 0;
  for (let i = 0; i < a.length; i++) {
    const [ax, ay, az] = a[i] ?? [0, 0, 0];
    const [bx, by, bz] = b[i] ?? [0, 0, 0];
    if (i > 0) {
      const [px, py, pz] = a[i - 1] ?? [0, 0, 0];
      along += Math.hypot(ax - px, ay - py, az - pz);
    }
    const span = Math.hypot(bx - ax, by - ay, bz - az);
    positions.push(ax, ay, az, bx, by, bz);
    uvs.push(along / cell, 0, along / cell, span / cell);
    if (i > 0) {
      const k = i * 2;
      indices.push(k - 2, k - 1, k, k - 1, k + 1, k);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return new THREE.Mesh(geometry, material);
}

/**
 * A regulation net: red posts and crossbar, a white base that bows out behind
 * the posts, a short top shelf, and netting from the frame down to the base.
 * Built behind the goal line on +X, then mirrored for the near end.
 */
function goalFrame(rink: Rink, s: number, posts: string = COLORS.net): THREE.Group {
  const group = new THREE.Group();
  group.name = "Goal";
  const { width, height } = GOAL_MOUTH;
  const post = width / 2;
  const shelf = rink.netDepth * 0.5;
  const shelfHalf = post - 0.15;

  // The mouth: posts and crossbar.
  lineMesh(
    group,
    [
      [0, 0, -post],
      [0, height, -post],
      [0, height, post],
      [0, 0, post],
    ],
    posts,
    0.1,
  );

  // Base on the ice.
  const base: Vec3[] = netBase(rink).map(([x, z]) => [x, 0.06, z]);
  lineMesh(group, base, COLORS.frame, 0.07);

  // Top shelf: back from the crossbar, then across.
  const top: Vec3[] = [
    [0, height, -post],
    [shelf, height, -shelfHalf],
    [shelf, height, shelfHalf],
    [0, height, post],
  ];
  lineMesh(group, top, COLORS.frame, 0.05);

  // Rear frame: from the back of the shelf down to the base, near its widest-back point.
  const rows = 40;
  const sides = loft(resample(top, rows), resample(base, rows), netMaterial(), 0.45);
  const shelfCorner = Math.round(
    ((rows - 1) * Math.hypot(shelf, post - shelfHalf)) /
      (2 * Math.hypot(shelf, post - shelfHalf) + 2 * shelfHalf),
  );
  for (const i of [shelfCorner, rows - 1 - shelfCorner]) {
    const from = resample(top, rows)[i];
    const to = resample(base, rows)[i];
    if (from && to) lineMesh(group, [from, to], COLORS.frame, 0.05);
  }
  group.add(sides);

  // The top netting, crossbar to shelf.
  group.add(
    loft(
      [
        [0, height, -post],
        [0, height, post],
      ],
      [
        [shelf, height, -shelfHalf],
        [shelf, height, shelfHalf],
      ],
      netMaterial(),
      0.45,
    ),
  );

  group.position.x = s * (rink.length / 2 - rink.goal);
  group.scale.x = s;
  return group;
}

function netMaterial(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    map: meshTexture(),
    color: "#ffffff",
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

/**
 * A rink's own lines drawn flat on the ice in one color: goal lines, blue lines and the
 * end-zone circles, which sit 20 ft out from its goal line and so move with it.
 */
function flatLines(rink: Rink, color: string): THREE.Group {
  const lines = new THREE.Group();
  lines.name = `${rink.name} ${rink.season} lines and circles`;
  for (const s of [-1, 1]) {
    for (const x of [s * (rink.length / 2 - rink.goal), s * rink.blue]) {
      const reach =
        Math.abs(x) > rink.length / 2 - rink.corner ? rink.width / 2 - 4 : rink.width / 2;
      lineMesh(
        lines,
        [
          [x, 0.06, -reach],
          [x, 0.06, reach],
        ],
        color,
        0.14,
      );
    }
    const dotX = s * (rink.length / 2 - rink.goal - 20);
    for (const z of [-22, 22]) {
      const ring: Vec3[] = Array.from({ length: 65 }, (_, i) => {
        const a = (i / 64) * Math.PI * 2;
        return [dotX + 15 * Math.cos(a), 0.06, z + 15 * Math.sin(a)];
      });
      lineMesh(lines, ring, color, 0.12);
      const dot = new THREE.Mesh(
        new THREE.CircleGeometry(1, 24),
        new THREE.MeshBasicMaterial({ color }),
      );
      dot.rotation.x = -Math.PI / 2;
      dot.position.set(dotX, 0.07, z);
      lines.add(dot);
    }
  }
  return lines;
}

/**
 * The rink a side-by-side view is compared against, laid flat under the 3D one: its boards
 * line and its own lines, so the extra or missing ice shows where it is.
 */
function flatRink(rink: Rink, color: string): THREE.Group {
  const group = new THREE.Group();
  group.name = `${rink.name} ${rink.season}, drawn flat`;
  const points = perimeter(rink);
  lineMesh(
    group,
    [...points, points[0] ?? [0, 0]].map(([x, z]): Vec3 => [x, 0.09, z]),
    color,
    0.22,
  );
  group.add(flatLines(rink, color));
  return group;
}

const centerIceImages = new Map<RinkId, HTMLImageElement>();

/** Loads both designs once; the scene rebuilds with them when they arrive. */
function loadCenterIce(): Promise<void> {
  const ids: RinkId[] = ["old", "modern"];
  return Promise.all(
    ids.map(async (id) => {
      if (centerIceImages.has(id)) return;
      const image = new Image();
      image.src = CENTER_ICE[id].src;
      await image.decode();
      centerIceImages.set(id, image);
    }),
  ).then(() => undefined);
}

function centerIce(rink: Rink): THREE.Mesh | null {
  const image = centerIceImages.get(rink.id);
  if (!image) return null;
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 2048;
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const { size } = CENTER_ICE[rink.id];
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
  );
  mesh.name = "Center ice";
  // Flat on the ice, reading upright from the stands on the +z side.
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.015;
  // Painted under the lines: the red line and center circle cross it.
  mesh.renderOrder = 2;
  return mesh;
}

interface RinkModel {
  group: THREE.Group;
  boards: THREE.Group;
  goals: THREE.Group;
  dimensions: THREE.Group;
}

function buildRink(rink: Rink, state: SceneState, options: { ghost: boolean }): RinkModel {
  const group = new THREE.Group();
  group.name = `${rink.name} ${rink.season}`;
  const accent = rink.id === "old" ? COLORS.old : COLORS.modern;
  const points = perimeter(rink);
  const loop = (y: number): [number, number, number][] =>
    [...points, points[0] ?? [0, 0]].map(([x, z]) => [x, y, z]);

  if (!options.ghost) {
    const geometry = iceGeometry(rink);
    const ice = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: COLORS.ice,
        roughness: 0.3,
        metalness: 0.04,
        side: THREE.DoubleSide,
      }),
    );
    ice.name = "Ice";
    group.add(ice);
    const markings = new THREE.Mesh(
      geometry.clone(),
      new THREE.MeshBasicMaterial({
        map: markingTexture(rink),
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        side: THREE.DoubleSide,
      }),
    );
    markings.name = "Markings";
    markings.renderOrder = 3;
    group.add(markings);
    const logo = centerIce(rink);
    if (logo) group.add(logo);
  } else {
    // The old Garden laid over today's ice: its goal lines, blue lines and end-zone circles in gold.
    group.add(flatLines(rink, COLORS.old));
  }

  const outline = new THREE.Group();
  lineMesh(outline, loop(0.08), accent, options.ghost ? 0.26 : 0.17);
  group.add(outline);

  const boards = new THREE.Group();
  boards.name = "Boards and glass";
  const boardMaterial = new THREE.MeshStandardMaterial({
    color: options.ghost ? COLORS.old : COLORS.board,
    roughness: 0.65,
    side: THREE.DoubleSide,
    transparent: options.ghost,
    opacity: options.ghost ? 0.28 : 1,
    depthWrite: !options.ghost,
  });
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: COLORS.glass,
    transparent: true,
    opacity: options.ghost ? 0.06 : 0.14,
    roughness: 0.12,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  for (let i = 0; i < points.length; i++) {
    const [ax, az] = points[i] ?? [0, 0];
    const [bx, bz] = points[(i + 1) % points.length] ?? [0, 0];
    const length = Math.hypot(bx - ax, bz - az);
    if (length < 0.001) continue;
    const mx = (ax + bx) / 2;
    const mz = (az + bz) / 2;
    const angle = -Math.atan2(bz - az, bx - ax);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(length, rink.board, 0.24), boardMaterial);
    wall.position.set(mx, rink.board / 2, mz);
    wall.rotation.y = angle;
    boards.add(wall);
    const glassHeight = Math.abs(mx) > rink.length / 2 - rink.corner ? 8 : 6;
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(length, glassHeight), glassMaterial);
    glass.position.set(mx, rink.board + glassHeight / 2, mz);
    glass.rotation.y = angle;
    boards.add(glass);
  }
  lineMesh(boards, loop(rink.board), accent, 0.12);
  if (!options.ghost) lineMesh(boards, loop(0.5), "#e9b13f", 0.16);
  group.add(boards);

  // Laid over today's ice, the 1995 goals take the page's gold so the two pairs read apart.
  const goals = new THREE.Group();
  goals.name = "Goal frames";
  const posts = options.ghost ? COLORS.old : COLORS.net;
  goals.add(goalFrame(rink, -1, posts), goalFrame(rink, 1, posts));
  group.add(goals);

  const dimensions = new THREE.Group();
  dimensions.name = "Dimensions";
  const side = rink.id === "old" ? -1 : 1;
  const z = side * (rink.width / 2 + 12);
  const x = -side * (rink.length / 2 + 20);
  lineMesh(
    dimensions,
    [
      [-rink.length / 2, 0.2, z],
      [rink.length / 2, 0.2, z],
    ],
    accent,
    0.08,
  );
  for (const end of [-rink.length / 2, rink.length / 2])
    lineMesh(
      dimensions,
      [
        [end, 0.2, z - 2],
        [end, 0.2, z + 2],
      ],
      accent,
      0.08,
    );
  dimensions.add(textSprite(formatLength(rink.length, state.unit), 0, z, accent));
  lineMesh(
    dimensions,
    [
      [x, 0.2, -rink.width / 2],
      [x, 0.2, rink.width / 2],
    ],
    accent,
    0.08,
  );
  dimensions.add(textSprite(formatLength(rink.width, state.unit), x, 0, accent));
  group.add(dimensions);

  return { group, boards, goals, dimensions };
}

function disposeGroup(root: THREE.Object3D) {
  root.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Sprite) {
      object.geometry.dispose();
      const materials: THREE.Material[] = Array.isArray(object.material)
        ? object.material
        : [object.material];
      for (const material of materials) {
        if ("map" in material && material.map instanceof THREE.Texture) material.map.dispose();
        material.dispose();
      }
    }
  });
}

function extraIce(old: Rink, modern: Rink): THREE.Mesh {
  const mesh = new THREE.Mesh(
    iceGeometry(modern, old),
    new THREE.MeshBasicMaterial({
      map: hatchTexture(modern),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      side: THREE.DoubleSide,
    }),
  );
  mesh.name = "Ice TD has that the old Garden did not";
  mesh.renderOrder = 4;
  mesh.position.y = 0.02;
  return mesh;
}

export interface SceneController {
  update(state: SceneState): void;
  setView(view: CameraView): void;
  exportModel(id: RinkId): Promise<Blob>;
  exportImage(): Promise<Blob | null>;
  dispose(): void;
}

export function createScene(container: HTMLElement, initial: SceneState): SceneController {
  let state = initial;
  let view: CameraView = "stands";

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(COLORS.background, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight("#d6edff", "#283a49", 2.1));
  const sun = new THREE.DirectionalLight("#ffffff", 2.4);
  sun.position.set(-60, 170, 60);
  scene.add(sun);

  const perspective = new THREE.PerspectiveCamera(42, 1, 0.1, 1400);
  const ortho = new THREE.OrthographicCamera(-130, 130, 80, -80, 0.1, 1000);
  const controls = new OrbitControls<THREE.PerspectiveCamera | THREE.OrthographicCamera>(
    perspective,
    renderer.domElement,
  );
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.maxDistance = 600;
  // OrbitControls claims every touch. Hand vertical swipes back to the page so a phone
  // can scroll past the viewer; sideways swipes and pinches still reach the rinks.
  renderer.domElement.style.touchAction = "pan-y";

  let world = new THREE.Group();
  let parts: {
    old: RinkModel;
    modern: RinkModel;
    oldGhost: RinkModel;
    oldFlat: THREE.Group;
    modernFlat: THREE.Group;
  } | null = null;
  scene.add(world);

  const activeCamera = () => (view === "overhead" ? ortho : perspective);

  function rebuild() {
    scene.remove(world);
    disposeGroup(world);
    world = new THREE.Group();
    const old = buildRink(state.old, state, { ghost: false });
    const modern = buildRink(state.modern, state, { ghost: false });
    const oldGhost = buildRink(state.old, state, { ghost: true });
    const extra = extraIce(state.old, state.modern);
    const oldFlat = flatRink(state.old, COLORS.old);
    const modernFlat = flatRink(state.modern, COLORS.modernFlat);
    oldFlat.visible = false;
    modernFlat.visible = false;
    world.add(old.group, modern.group, oldGhost.group, extra, oldFlat, modernFlat);
    parts = { old, modern, oldGhost, oldFlat, modernFlat };
    world.userData["extra"] = extra;
    scene.add(world);
    applyVisibility();
  }

  function applyVisibility() {
    if (!parts) return;
    const show = visibility(state.mode, view, state);
    parts.old.group.visible = show.old;
    parts.modern.group.visible = show.modern;
    parts.oldGhost.group.visible = show.oldGhost;
    const extra = world.userData["extra"];
    if (extra instanceof THREE.Object3D) extra.visible = show.extraIce;
    for (const model of [parts.old, parts.modern, parts.oldGhost]) {
      model.boards.visible = show.boards;
      model.dimensions.visible = show.dimensions;
    }
    parts.old.goals.visible = show.oldGoals;
    parts.oldGhost.goals.visible = show.oldGoals;
    parts.modern.goals.visible = show.modernGoals;
    resize();
  }

  function setView(next: CameraView) {
    view = next;
    controls.object = activeCamera();
    if (next === "overhead") {
      ortho.position.set(0, 250, 0.001);
      ortho.up.set(0, 0, -1);
      ortho.zoom = 1;
      ortho.updateProjectionMatrix();
    } else {
      perspective.up.set(0, 1, 0);
      // At ice level, stand inside the blue line facing the net, where the end boards differ.
      if (next === "ice") perspective.position.set(52, 5.5, 26);
      else perspective.position.set(110, 120, 175);
    }
    if (next === "ice") controls.target.set(92, 2, 0);
    else controls.target.set(0, 0, 0);
    controls.enableRotate = next !== "overhead";
    controls.minDistance = next === "ice" ? 8 : 60;
    controls.update();
    applyVisibility();
  }

  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    const { aspect, fov, overheadHalfHeight: half } = framing(width, height, state.mode);
    perspective.aspect = aspect;
    perspective.fov = fov;
    perspective.updateProjectionMatrix();
    ortho.left = -half * aspect;
    ortho.right = half * aspect;
    ortho.top = half;
    ortho.bottom = -half;
    ortho.updateProjectionMatrix();
  }

  function render() {
    controls.update();
    const camera = activeCamera();
    const width = renderer.domElement.clientWidth;
    const height = renderer.domElement.clientHeight;
    if (state.mode === "split" && parts) {
      renderer.setScissorTest(true);
      // Each half shows one rink in 3D with the other drawn flat beneath it.
      const halves: [RinkModel, RinkModel, THREE.Group, THREE.Group][] = [
        [parts.old, parts.modern, parts.modernFlat, parts.oldFlat],
        [parts.modern, parts.old, parts.oldFlat, parts.modernFlat],
      ];
      halves.forEach(([show, hide, under, other], i) => {
        show.group.visible = true;
        hide.group.visible = false;
        under.visible = true;
        other.visible = false;
        renderer.setViewport((i * width) / 2, 0, width / 2, height);
        renderer.setScissor((i * width) / 2, 0, width / 2, height);
        renderer.render(scene, camera);
      });
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, width, height);
      parts.old.group.visible = true;
      parts.modern.group.visible = true;
      parts.oldFlat.visible = false;
      parts.modernFlat.visible = false;
    } else {
      renderer.setViewport(0, 0, width, height);
      renderer.render(scene, camera);
    }
  }

  const observer = new ResizeObserver(resize);
  observer.observe(container);
  rebuild();
  setView("stands");
  renderer.setAnimationLoop(render);
  let disposed = false;
  // The rinks draw at once; the center-ice art joins them when it has loaded.
  loadCenterIce()
    .then(() => {
      if (!disposed) rebuild();
    })
    .catch(() => {
      // Without it the rinks are still complete; nothing to tell the visitor.
    });

  return {
    update(next) {
      const geometryChanged =
        next.old !== state.old || next.modern !== state.modern || next.unit !== state.unit;
      state = next;
      if (geometryChanged) rebuild();
      else applyVisibility();
    },
    setView,
    async exportModel(id) {
      const rink = id === "old" ? state.old : state.modern;
      const model = buildRink(rink, { ...state, dimensions: false }, { ghost: false });
      model.dimensions.visible = false;
      model.group.scale.setScalar(0.3048);
      model.group.userData = { units: "meters", rink: { ...rink } };
      model.group.updateMatrixWorld(true);
      try {
        const result = await new GLTFExporter().parseAsync(model.group, {
          binary: true,
          onlyVisible: true,
        });
        if (!(result instanceof ArrayBuffer))
          throw new Error("Exporter did not return binary glTF");
        return new Blob([result], { type: "model/gltf-binary" });
      } finally {
        disposeGroup(model.group);
      }
    },
    exportImage() {
      render();
      return new Promise((resolve) => renderer.domElement.toBlob(resolve, "image/png"));
    },
    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      observer.disconnect();
      controls.dispose();
      disposeGroup(world);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
