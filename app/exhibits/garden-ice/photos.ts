/**
 * Reference photographs for the photo lab. Every one is openly licensed and
 * shown unmodified; the rinks are drawn on a separate layer above it.
 *
 * `anchors` place four landmarks in the photo, in its own pixels. They define
 * the perspective every overlay is drawn in, and a visitor can drag them.
 */
import { type Point, type RinkId } from "./geometry";
import { type Landmark } from "./homography";

export interface Anchor {
  landmark: Landmark;
  at: Point;
}

export interface ReferencePhoto {
  id: string;
  /** Short label for the picker. */
  label: string;
  arena: RinkId;
  src: string;
  width: number;
  height: number;
  alt: string;
  /** One sentence on what to look at in this view. */
  lookFor: string;
  credit: { author: string; year: string; source: string; license: string; licenseUrl: string };
  anchors: [Anchor, Anchor, Anchor, Anchor];
}

export const REFERENCE_PHOTOS: readonly ReferencePhoto[] = [
  {
    id: "td-corner-2014",
    label: "TD Garden from a corner",
    arena: "modern",
    src: "/exhibits/garden-ice/td-garden-corner-2014.jpg",
    width: 1920,
    height: 1434,
    alt: "A Bruins game at TD Garden in January 2014, seen from the lower bowl near one corner.",
    lookFor:
      "Watch the ends. At the far end and the near one, today’s boards stand four and a half feet behind the Garden’s, and its end-zone circles sit that much deeper.",
    credit: {
      author: "Bduboff",
      year: "2014",
      source:
        "https://commons.wikimedia.org/wiki/File:Bruins_2014-01-14_19.22.40_(14177423467).jpg",
      license: "CC BY 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    },
    anchors: [
      { landmark: "net-left", at: [510, 990] },
      { landmark: "net-right", at: [1248, 636] },
      { landmark: "blue-right-far", at: [782, 671] },
      { landmark: "blue-left-far", at: [539, 746] },
    ],
  },
  {
    id: "td-end-2008",
    label: "TD Garden from the end",
    arena: "modern",
    src: "/exhibits/garden-ice/td-garden-end-2008.jpg",
    width: 1920,
    height: 1440,
    alt: "TD Garden before a Bruins game in 2008, seen from high above one end, with team logos projected on the ice.",
    lookFor:
      "Looking down the length, the near end-zone circles show it: the Garden’s sit closer to center ice, because its end zones were four feet shallower.",
    credit: {
      author: "Danger Dad",
      year: "2008",
      source: "https://commons.wikimedia.org/wiki/File:Bruins_Home_Turf_-_panoramio.jpg",
      license: "CC BY 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    },
    anchors: [
      { landmark: "dot-left-far", at: [496, 1288] },
      { landmark: "dot-left-near", at: [1338, 1322] },
      { landmark: "blue-right-far", at: [557, 830] },
      { landmark: "blue-right-near", at: [1534, 830] },
    ],
  },
  {
    id: "garden-side-1995",
    label: "Boston Garden from the side",
    arena: "old",
    src: "/exhibits/garden-ice/boston-garden-1995.jpg",
    width: 1231,
    height: 848,
    alt: "The Boston Garden rink during a Rangers practice, around 1995, seen from the upper seats.",
    lookFor:
      "Seen along the side, the two rinks nearly coincide: a foot of extra width on each side is a few pixels from up here.",
    credit: {
      author: "Troy Parla",
      year: "c. 1995",
      source: "https://commons.wikimedia.org/wiki/File:BostonGardenNHL.jpg",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    },
    // From the original study's planar fit (see PARLA_PHOTO_FIT), which used
    // these same four points.
    anchors: [
      { landmark: "blue-left-far", at: [259, 630.3] },
      { landmark: "blue-right-far", at: [443.9, 544] },
      { landmark: "blue-left-near", at: [930.1, 724.6] },
      { landmark: "blue-right-near", at: [942.5, 601.6] },
    ],
  },
];

/** Starting handles for a visitor's own photo: a plausible view from the side. */
export function defaultAnchors(width: number, height: number): [Anchor, Anchor, Anchor, Anchor] {
  return [
    { landmark: "blue-left-far", at: [width * 0.42, height * 0.45] },
    { landmark: "blue-right-far", at: [width * 0.58, height * 0.45] },
    { landmark: "blue-left-near", at: [width * 0.35, height * 0.8] },
    { landmark: "blue-right-near", at: [width * 0.65, height * 0.8] },
  ];
}
