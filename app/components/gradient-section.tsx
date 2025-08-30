import * as React from "react"

interface GradientSectionProps {
  children: React.ReactNode
  /** Optional banner image URL */
  bannerImage?: string
  /** Optional custom gradient colors */
  gradientFrom?: string
  gradientTo?: string
  /** Optional custom height for the banner */
  bannerHeight?: string
}

export default function GradientSection({
  children,
  bannerImage = "/images/talladega_glory.jpg",
  gradientFrom = "rgba(0, 0, 0, 0.4)",
  gradientTo = "rgba(0, 0, 0, 1)",
  bannerHeight = "h-64 md:h-80 lg:h-96",
}: GradientSectionProps) {
  return (
    <div className="relative">
      {/* Banner with gradient overlay */}
      <div
        className={`${bannerHeight} relative overflow-hidden`}
        style={{
          backgroundImage: `url(${bannerImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Gradient overlay that fades to black at the bottom */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, ${gradientFrom} 0%, ${gradientFrom} 50%, ${gradientTo} 100%)`,
          }}
        />

        {/* Content overlay on the banner */}
        <div className="relative z-10 flex items-center justify-center h-full text-white">
          {children}
        </div>
      </div>

      {/* Smooth transition area below the banner */}
      <div
        className="h-32"
        style={{
          background: `linear-gradient(to bottom, ${gradientTo} 0%, transparent 100%)`,
        }}
      />
    </div>
  )
}
