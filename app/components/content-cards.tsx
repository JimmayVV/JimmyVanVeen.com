import * as React from "react"

interface ContentCardsProps {
  children: React.ReactNode
  /** Optional custom spacing between cards */
  spacing?: string
}

export default function ContentCards({
  children,
  spacing = "space-y-8",
}: ContentCardsProps) {
  return (
    <div className={`py-12 px-8 lg:px-0`}>
      <div className={`lg:w-[55em] lg:mx-auto ${spacing}`}>{children}</div>
    </div>
  )
}

export function ContentCard({
  title,
  children,
  footer,
  image,
  flip = false,
}: {
  title?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  image?: string
  flip?: boolean
}) {
  return (
    <div className="bg-zinc-900/80 backdrop-blur-sm rounded-lg overflow-hidden border border-zinc-800 shadow-2xl hover:bg-zinc-900/90 transition-colors">
      {image && !flip && (
        <img src={image} alt="" className="w-full h-48 md:h-64 object-cover" />
      )}

      <div className="p-8 text-white">
        <div
          className={`${flip ? "md:flex md:flex-row-reverse md:gap-8 md:items-center" : ""}`}
        >
          {image && flip && (
            <div className="md:w-1/3 mb-6 md:mb-0">
              <img
                src={image}
                alt=""
                className="w-full h-48 md:h-auto rounded-lg"
              />
            </div>
          )}

          <div className={`${flip && image ? "md:w-2/3" : ""}`}>
            {title && (
              <h2 className="text-3xl font-bold mb-6 text-zinc-100 border-b border-zinc-700 pb-4">
                {title}
              </h2>
            )}
            <div className="text-zinc-300 space-y-4">{children}</div>
            {footer && (
              <div className="mt-6 pt-4 border-t border-zinc-700">{footer}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
