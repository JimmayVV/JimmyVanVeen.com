import * as React from "react";

interface CardLayoutProps {
  children: React.ReactNode;
  /** Optional background gradient or color */
  backgroundStyle?: React.CSSProperties;
}

export default function CardLayout({
  children,
  backgroundStyle = {
    background: "radial-gradient(ellipse at center, #1a1a1a 0%, #000000 100%)",
  },
}: CardLayoutProps) {
  return (
    <div
      className="min-h-[calc(100vh-var(--header-height))] py-12 px-4"
      style={backgroundStyle}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {React.Children.map(children, (child, index) => (
          <div
            className="bg-zinc-900/50 backdrop-blur-sm rounded-lg p-8 border border-zinc-800 shadow-2xl hover:bg-zinc-900/70 transition-colors"
            key={index}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSection({
  title,
  children,
  footer,
  image,
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  image?: string;
}) {
  return (
    <div className="text-white">
      {image && (
        <div className="mb-6 -m-8 mb-8">
          <img
            src={image}
            alt=""
            className="w-full h-48 md:h-64 object-cover rounded-t-lg"
          />
        </div>
      )}
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
  );
}
