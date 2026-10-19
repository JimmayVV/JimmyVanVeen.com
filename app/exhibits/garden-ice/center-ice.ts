import { type RinkId } from "./geometry";

/**
 * Center-ice art for each rink, as painted. The Bruins' spoked-B artwork is from Wikimedia
 * Commons (public domain as a simple text logo; the mark itself is the team's trademark). The
 * 1995 "Thanks for the memories" design is redrawn from a photo of the Garden's last season.
 * `size` is the side of the square image in feet, measured against the fitted photographs:
 * the 1995 ring painted 14.4 ft across, today's B filling the 30 ft center circle.
 */
export const CENTER_ICE: Record<RinkId, { src: string; size: number }> = {
  old: { src: "/exhibits/garden-ice/center-ice-1995.svg", size: 21.15 },
  modern: { src: "/exhibits/garden-ice/center-ice-today.svg", size: 31.3 },
};
