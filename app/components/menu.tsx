import * as React from "react"
import { NavLink, useNavigation } from "react-router"

const baseClassName =
  "block text-center text-white uppercase font-raleway py-2 rounded-sm"
const activeClassName = `${baseClassName} bg-black/10`
const inactiveClassName = `${baseClassName} hover:bg-black/10`

let timeoutRef: NodeJS.Timeout

export function Menu() {
  const [openMenu, setOpenMenu] = React.useState(false)

  const transition = useNavigation()

  const isLoading = transition.state === "loading"

  const closeMenu = () => {
    clearTimeout(timeoutRef)
    timeoutRef = setTimeout(() => setOpenMenu(false), 100)
  }

  return (
    <>
      <div
        onClick={() => setOpenMenu(open => !open)}
        className={`fixed z-20 top-2 right-3 text-white font-raleway uppercase
                    font-bold border-2 px-6 py-2 border-white/20 rounded
                    text-sm tracking-widest hover:cursor-pointer
                    hover:bg-white/10`}
      >
        Menu
      </div>

      <div
        className={`fixed top-0 left-0 bottom-0 right-0 bg-black/50
                    transition-all ${
                      openMenu || isLoading
                        ? "opacity-100 z-10"
                        : "opacity-0 invisible"
                    }`}
      >
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 w-80 
                    bg-primary rounded p-7 text-center transition-all ${
                      openMenu || isLoading
                        ? "-translate-y-1/2 opacity-100"
                        : "-translate-y-8 opacity-0 -z-10"
                    }`}
        >
          <h2
            className={`text-xl uppercase font-raleway pb-4 mb-4 border-b
                        border-white/10 text-white font-bold`}
          >
            {isLoading ? "Loading..." : "Menu"}
          </h2>
          {isLoading ? null : (
            <>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `${isActive ? activeClassName : inactiveClassName}`
                }
                onClick={() => closeMenu()}
                rel="prefetch"
              >
                Home
              </NavLink>
              <NavLink
                to="/blog"
                end
                className={({ isActive }) =>
                  `${isActive ? activeClassName : inactiveClassName}`
                }
                onClick={() => closeMenu()}
                rel="prefetch"
              >
                Blog
              </NavLink>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default Menu
