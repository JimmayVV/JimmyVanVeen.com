export type HexColor = `#${string}`;

export const getSlice = (color: HexColor) => {
  return `data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpolygon points='0,100 100,0 100,100' style='fill:${encodeURIComponent(
    color,
  )}' /%3E%3Cpath d='M0,100 L100,0' style='fill:none;stroke:${encodeURIComponent(
    "#ccc",
  )};stroke-width:2' /%3E%3C/svg%3E`;
};
