import * as React from "react"
import { clsx } from "clsx"

export default function Banner({
  children,
  noBg = false,
}: {
  children: React.ReactNode
  noBg?: boolean
}) {
  return (
    <section
      id="banner"
      className={clsx(`pt-28 pb-32 -mb-24 text-white uppercase font-raleway`, {
        "bg-hero-pattern bg-[auto,cover]": !noBg,
      })}
    >
      <div className="mx-8 lg:mx-auto my-0 lg:w-[55em]">{children}</div>
    </section>
  )
}
