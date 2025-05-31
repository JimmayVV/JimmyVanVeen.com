import * as React from "react"

import { type HexColor } from "~/utils/layout-utils"

export default function Slice({
  children,
  color = "#21d",
  flip = false,
  isLastChild = false,
}: {
  children: React.ReactNode
  color?: HexColor
  flip?: boolean
  /**
   * Only render the bottom slice effect if this is the last child.
   */
  isLastChild?: boolean
}) {
  return (
    <div className="relative -mt-8 md:-mt-16 lg:-mt-[7.1rem]">
      <div
        className={`h-8 md:h-16 lg:h-28 w-full bg-no-repeat left-0 ${
          flip ? "clip-triangle-flip" : "clip-triangle"
        }`}
        style={{
          backgroundColor: color,
          boxShadow: `inset 0 -1px 0 0 ${color}, 0 1px 0 0 ${color}`,
        }}
      />
      <div
        className={`px-12 ${isLastChild ? "pt-4 pb-20" : "py-4"}`}
        style={{ backgroundColor: color }}
      >
        {children}
      </div>
      {isLastChild ? null : (
        <div
          className={`h-8 md:h-16 lg:h-28 w-full left-0`}
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  )
}
