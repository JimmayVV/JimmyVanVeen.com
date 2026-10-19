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
  /** A 480 px copy for the picker. */
  thumb: string;
  width: number;
  height: number;
  alt: string;
  /** One sentence on what to look at in this view. */
  lookFor: string;
  credit: {
    author: string;
    year: string;
    /** Where the photo is published, named in the credit line. */
    site: "Wikimedia Commons" | "Flickr" | "SmugMug";
    source: string;
    /** An open licence's name, or "Used with permission" for a photographer's own grant. */
    license: string;
    /** The licence text; absent when the photographer gave permission directly. */
    licenseUrl?: string;
  };
  anchors: [Anchor, Anchor, Anchor, Anchor];
}

export const REFERENCE_PHOTOS: readonly ReferencePhoto[] = [
  {
    id: "td-end-2008",
    label: "TD Garden from behind a net",
    arena: "modern",
    src: "/exhibits/garden-ice/td-garden-from-end-2008.jpg",
    thumb: "/exhibits/garden-ice/td-garden-from-end-2008-thumb.jpg",
    width: 2400,
    height: 1600,
    alt: "An empty TD Garden before a game in 2008, seen from high above one end, the whole rink laid out below.",
    lookFor:
      "From behind a net the whole difference is in view: the Garden’s end boards stand four and a half feet inside today’s at both ends, and its end-zone circles sit that much closer to center ice.",
    credit: {
      author: "AEJ",
      year: "2008",
      site: "Wikimedia Commons",
      source: "https://commons.wikimedia.org/wiki/File:TDBanknorthGardenBeforeGame.jpg",
      license: "Public domain",
      licenseUrl: "https://commons.wikimedia.org/wiki/File:TDBanknorthGardenBeforeGame.jpg",
    },
    // Least-squares fit to seven landmarks (all four end-zone dots, two
    // neutral-zone dots, the far net); worst residual under 5 px at 3840 px wide.
    anchors: [
      { landmark: "dot-left-far", at: [1031.8, 1195.7] },
      { landmark: "dot-left-near", at: [1727.3, 1133.6] },
      { landmark: "dot-right-far", at: [909.6, 663.4] },
      { landmark: "dot-right-near", at: [1257.6, 648.9] },
    ],
  },
  {
    id: "td-corner-2014",
    label: "TD Garden from a corner",
    arena: "modern",
    src: "/exhibits/garden-ice/td-garden-corner-2014.jpg",
    thumb: "/exhibits/garden-ice/td-garden-corner-2014-thumb.jpg",
    width: 1920,
    height: 1434,
    alt: "A Bruins game at TD Garden in January 2014, seen from the lower bowl near one corner.",
    lookFor:
      "Watch the ends. At the far end and the near one, today’s boards stand four and a half feet behind the Garden’s, and its end-zone circles sit that much deeper.",
    credit: {
      author: "Bduboff",
      year: "2014",
      site: "Wikimedia Commons",
      source:
        "https://commons.wikimedia.org/wiki/File:Bruins_2014-01-14_19.22.40_(14177423467).jpg",
      license: "CC BY 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    },
    // Least-squares fit to seven landmarks (far net, near end-zone dots, center,
    // both blue lines at the far boards, a neutral-zone dot); worst residual 9 px.
    anchors: [
      { landmark: "net-right", at: [1245.8, 634.2] },
      { landmark: "dot-left-far", at: [389.4, 878.1] },
      { landmark: "dot-left-near", at: [1000.1, 969.1] },
      { landmark: "blue-right-far", at: [782, 673.7] },
    ],
  },
  {
    id: "td-side-2011",
    label: "TD Garden from the side",
    arena: "modern",
    src: "/exhibits/garden-ice/td-garden-side-2011.jpg",
    thumb: "/exhibits/garden-ice/td-garden-side-2011-thumb.jpg",
    width: 2000,
    height: 1124,
    alt: "A Bruins game against Ottawa at TD Garden in January 2011, seen from the upper seats at center ice, the whole rink laid out below.",
    lookFor:
      "From center ice both ends are in view at once: at each one the Garden’s boards stop four and a half feet short of today’s, while along the sides the two rinks are a foot apart.",
    credit: {
      author: "Alvaro Galve",
      year: "2011",
      site: "Flickr",
      source: "https://www.flickr.com/photos/61955637@N00/5347685497/",
      license: "CC BY-SA 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
    },
    // Least-squares fit to ten landmarks (all four end-zone dots, all four
    // neutral-zone dots, both nets); worst residual 4 px at 2000 px wide.
    anchors: [
      { landmark: "dot-left-far", at: [437.6, 506.3] },
      { landmark: "dot-left-near", at: [183, 661.8] },
      { landmark: "dot-right-far", at: [1607, 611.4] },
      { landmark: "dot-right-near", at: [1606, 847.8] },
    ],
  },
  {
    id: "garden-side-1995",
    label: "Boston Garden from the side",
    arena: "old",
    src: "/exhibits/garden-ice/boston-garden-1995.jpg",
    thumb: "/exhibits/garden-ice/boston-garden-1995-thumb.jpg",
    width: 1231,
    height: 848,
    alt: "The Boston Garden rink during a Rangers practice, around 1995, seen from the upper seats.",
    lookFor:
      "Seen along the side, the two rinks nearly coincide: a foot of extra width on each side is a few pixels from up here.",
    credit: {
      author: "Troy Parla",
      year: "c. 1995",
      site: "Wikimedia Commons",
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
  {
    id: "garden-end-1995",
    label: "Boston Garden from behind a net",
    arena: "old",
    src: "/exhibits/garden-ice/boston-garden-end-1995.jpg",
    thumb: "/exhibits/garden-ice/boston-garden-end-1995-thumb.jpg",
    width: 1740,
    height: 1205,
    alt: "A Bruins practice at the Boston Garden in 1995, seen from high above one end, the whole rink below.",
    lookFor:
      "Watch the far end. Today’s rink runs four and a half feet past the Garden’s end boards, and its end zone reaches four feet deeper toward center.",
    credit: {
      author: "Bob Busser",
      year: "1995",
      site: "SmugMug",
      source:
        "https://ballparks.smugmug.com/Boston-Garden-Pt2-razed-Boston-Massachusetts/i-CVMPwnD",
      license: "Used with permission",
    },
    // Least-squares fit to nine landmarks (all eight faceoff dots in view, the far
    // net); worst residual 3 px at 1740 px wide. The fit also lands both blue lines.
    anchors: [
      { landmark: "dot-right-far", at: [604.6, 591.7] },
      { landmark: "dot-right-near", at: [892.4, 588.3] },
      { landmark: "dot-left-far", at: [462.9, 1036.5] },
      { landmark: "dot-left-near", at: [1032.5, 1025.6] },
    ],
  },
  {
    id: "garden-corner-1995",
    label: "Boston Garden from a corner",
    arena: "old",
    src: "/exhibits/garden-ice/boston-garden-corner-1995.jpg",
    thumb: "/exhibits/garden-ice/boston-garden-corner-1995-thumb.jpg",
    width: 1740,
    height: 1193,
    alt: "A Bruins practice at the Boston Garden in 1995, seen from high in one corner, the whole rink on the diagonal.",
    lookFor:
      "From the corner, both ends are in reach: today’s boards stand four and a half feet behind the Garden’s at each one, and a foot behind them along the sides.",
    credit: {
      author: "Bob Busser",
      year: "1995",
      site: "SmugMug",
      source:
        "https://ballparks.smugmug.com/Boston-Garden-Pt2-razed-Boston-Massachusetts/i-rtCFZzD",
      license: "Used with permission",
    },
    // Least-squares fit to eight faceoff dots; worst residual 4 px at 1740 px wide.
    anchors: [
      { landmark: "dot-right-far", at: [670.7, 515.8] },
      { landmark: "dot-right-near", at: [369.7, 561.2] },
      { landmark: "dot-left-far", at: [1332.2, 897.6] },
      { landmark: "dot-left-near", at: [865.8, 1062.3] },
    ],
  },
  {
    id: "garden-game-1995",
    label: "Boston Garden on a game night",
    arena: "old",
    src: "/exhibits/garden-ice/boston-garden-game-1995.jpg",
    thumb: "/exhibits/garden-ice/boston-garden-game-1995-thumb.jpg",
    width: 1740,
    height: 1140,
    alt: "A full Boston Garden during a Bruins game in 1995, its championship banners hanging over the ice.",
    lookFor:
      "A full house in the building’s last season. Today’s rink, drawn over it, pushes the far end boards back four and a half feet.",
    credit: {
      author: "Bob Busser",
      year: "1995",
      site: "SmugMug",
      source:
        "https://ballparks.smugmug.com/Boston-Garden-Pt2-razed-Boston-Massachusetts/i-WpMd7sG",
      license: "Used with permission",
    },
    // Least-squares fit to seven faceoff dots; worst residual 3 px at 1740 px wide.
    anchors: [
      { landmark: "dot-right-far", at: [1177.2, 696] },
      { landmark: "dot-right-near", at: [868.7, 670.5] },
      { landmark: "neutral-left-far", at: [1018.6, 921] },
      { landmark: "dot-left-near", at: [275.8, 1057] },
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
