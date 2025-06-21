// Libs
import * as React from "react"

// Components
import Slice from "~/components/slice"
import SliceContent, {
  type SliceContentProps,
} from "~/components/slice-content"

// Utils
import { type HexColor } from "~/utils/layout-utils"

interface SlicesProps {
  /** The React nodes that will be created into slices. */
  children: React.ReactNode
  /** An array of colors that will be cycled through for each slice. */
  colors: HexColor[]
  /** Determines if the first slice should be right aligned or not */
  staticAlignment?: boolean
}

export default function Slices({
  children,
  colors = ["#CCC", "#E0E0E0"],
  staticAlignment = false,
}: SlicesProps) {
  return (
    <>
      {React.Children.map(children, (child, index) => {
        const flipDisplay = index % 2 !== 0
        const isLastChild = index === React.Children.count(children) - 1

        const isSliceContentElement = (
          element: React.ReactNode,
        ): element is React.ReactElement<SliceContentProps> => {
          return React.isValidElement(element) && element.type === SliceContent
        }

        const childElement = isSliceContentElement(child)
          ? React.cloneElement(child, {
            flip:
                // If the child doesn't have a flip prop, then we'll apply one programmatically.
                child.props.flip === undefined
                  ? (!staticAlignment && flipDisplay) ?? false
                  : child.props.flip,
          })
          : child

        return (
          <Slice
            color={colors[index % colors.length]}
            flip={flipDisplay}
            isLastChild={isLastChild}
          >
            {childElement}
          </Slice>
        )
      })}
    </>
  )
}
