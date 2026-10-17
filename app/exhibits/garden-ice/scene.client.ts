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

import { type Rink, type RinkId, type Unit, formatLength, perimeter } from "./geometry";

export type ViewerMode = "both" | "split" | "old" | "modern";
export type CameraView = "stands" | "overhead" | "ice";

export interface SceneState {
  old: Rink;
  modern: Rink;
  mode: ViewerMode;
  boards: boolean;
  dimensions: boolean;
  unit: Unit;
}

/** Gold marks 1995 in every view on the page; today's rink stays neutral. */
const COLORS = {
  old: "#e2ad35",
  modern: "#eef2f2",
  ice: "#e4ebea",
  red: "#c8102e",
  blue: "#1f4e9a",
  crease: "#a9d6e6",
  board: "#f4f2ea",
  glass: "#b9d7de",
  net: "#c8102e",
  mesh: "#b9c3c6",
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

function goalFrame(rink: Rink, s: number): THREE.Group {
  const group = new THREE.Group();
  const x = s * (rink.length / 2 - rink.goal);
  const d = rink.netDepth;
  const at = (dx: number, y: number, z: number): [number, number, number] => [x + s * dx, y, z];
  lineMesh(group, [at(0, 0, -3), at(0, 4, -3), at(0, 4, 3), at(0, 0, 3)], COLORS.net, 0.11);
  lineMesh(group, [at(0, 0, -3), at(d, 0, -2.4), at(d, 0, 2.4), at(0, 0, 3)], COLORS.net, 0.09);
  lineMesh(
    group,
    [at(0, 4, -3), at(d - 0.8, 2.8, -2.4), at(d - 0.8, 2.8, 2.4), at(0, 4, 3)],
    COLORS.net,
    0.07,
  );
  for (let z = -2.4; z <= 2.41; z += 0.6)
    lineMesh(group, [at(d, 0, z), at(d - 0.8, 2.8, z)], COLORS.mesh, 0.02);
  return group;
}

interface RinkModel {
  group: THREE.Group;
  boards: THREE.Group;
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
  } else {
    // The old Garden laid over today's ice: its goal and blue lines in gold.
    const lines = new THREE.Group();
    lines.name = "1995 goal and blue lines";
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
          COLORS.old,
          0.14,
        );
      }
    }
    group.add(lines);
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

  if (!options.ghost) {
    const goals = new THREE.Group();
    goals.name = "Goal frames";
    goals.add(goalFrame(rink, -1), goalFrame(rink, 1));
    group.add(goals);
  }

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

  return { group, boards, dimensions };
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

  let world = new THREE.Group();
  let parts: { old: RinkModel; modern: RinkModel; oldGhost: RinkModel } | null = null;
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
    world.add(old.group, modern.group, oldGhost.group, extra);
    parts = { old, modern, oldGhost };
    world.userData["extra"] = extra;
    scene.add(world);
    applyVisibility();
  }

  function applyVisibility() {
    if (!parts) return;
    const { mode } = state;
    parts.old.group.visible = mode === "old" || mode === "split";
    parts.modern.group.visible = mode === "modern" || mode === "both" || mode === "split";
    parts.oldGhost.group.visible = mode === "both";
    const extra = world.userData["extra"];
    if (extra instanceof THREE.Object3D) extra.visible = mode === "both";
    for (const model of [parts.old, parts.modern, parts.oldGhost]) {
      model.boards.visible = state.boards;
      // At ice level the labels float in front of the boards they describe.
      model.dimensions.visible = state.dimensions && view !== "ice";
    }
    // In side by side, each half gets its own rink, so its dimensions sit on the near side.
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
    const aspect = (state.mode === "split" ? width / 2 : width) / height;
    perspective.aspect = aspect;
    perspective.fov =
      (2 * Math.atan(Math.tan((42 * Math.PI) / 360) * Math.max(1, 1.3 / aspect)) * 180) / Math.PI;
    perspective.updateProjectionMatrix();
    const half = Math.max(70, 120 / aspect);
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
      const halves: [RinkModel, RinkModel][] = [
        [parts.old, parts.modern],
        [parts.modern, parts.old],
      ];
      halves.forEach(([show, hide], i) => {
        show.group.visible = true;
        hide.group.visible = false;
        renderer.setViewport((i * width) / 2, 0, width / 2, height);
        renderer.setScissor((i * width) / 2, 0, width / 2, height);
        renderer.render(scene, camera);
      });
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, width, height);
      parts.old.group.visible = true;
      parts.modern.group.visible = true;
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
      renderer.setAnimationLoop(null);
      observer.disconnect();
      controls.dispose();
      disposeGroup(world);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
