import * as React from "react";

interface GradientBannerProps {
  children: React.ReactNode;
}

export default function GradientBanner({ children }: GradientBannerProps) {
  return (
    <div className="relative">
      {/* Background with gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="w-full h-full bg-hero-pattern bg-[auto,cover]" />
        {/* Gradient overlay on the background only */}
        <div
          className="absolute bottom-0 left-0 right-0 h-96 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.3) 20%, rgba(0, 0, 0, 0.7) 60%, rgba(0, 0, 0, 0.95) 90%, rgba(0, 0, 0, 1) 100%)",
          }}
        />
      </div>

      {/* Content section - above the gradient */}
      <section
        id="banner"
        className="relative z-10 pt-32 pb-48 text-white uppercase font-raleway"
      >
        <div className="mx-8 lg:mx-auto my-0 lg:w-[55em]">{children}</div>
      </section>
    </div>
  );
}
