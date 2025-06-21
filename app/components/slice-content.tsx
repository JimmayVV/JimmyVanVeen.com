import * as React from "react"

export interface SliceContentProps {
  /**
   * An image to display with the content. Will fallback to a default value
   * if not provided.
   */
  image?: string
  /**
   * The title of the content block.
   */
  title?: string | React.ReactNode
  /**
   * The content of the content block.
   */
  children: React.ReactNode | React.ReactNode[]
  /**
   * The footer of the content block (ideally a link)
   */
  footer?: React.ReactNode
  /**
   * Determines if the content should be to the right of the image instead of the left.
   */
  flip?: boolean
}

export default function SliceContent({
  children,
  image,
  footer,
  title,
  flip,
}: SliceContentProps) {
  return (
    <div
      className={`flex flex-col md:flex-row text-white font-raleway lg:w-[55em] my-0 mx-auto relative ${
        flip ? "flipped-slice" : "md:flex-row-reverse"
      }`}
    >
      <div className="flex-1">
        {title ? (
          <h2
            className={`text-2xl font-bold uppercase pb-4 border-b-2 border-white/30 tracking-widest ${
              flip ? "text-right" : ""
            }`}
          >
            {title}
          </h2>
        ) : null}
        <div
          className={`mt-4 font-sans font-light leading-7 ${
            flip ? "text-right" : ""
          }`}
        >
          {children}
        </div>
        {footer ?? null}
      </div>
      {image ? (
        <div
          className={`overflow-hidden relative w-52 h-52 border-white border-2 rounded-full ${
            flip ? "ml-8" : "mr-8"
          }`}
        >
          <img
            src={image}
            className="w-52 top-1/2 absolute -translate-y-1/2"
            alt={
              typeof title === "string"
                ? `${title} illustration`
                : "Content illustration"
            }
          />
        </div>
      ) : null}
    </div>
  )
}
