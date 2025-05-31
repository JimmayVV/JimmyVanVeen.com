// Libs
import * as React from "react"
import { Await } from "react-router"

// Components
import Banner from "~/components/banner"
import Slices from "~/components/slices"
import SliceContent from "~/components/slice-content"
import MainLink from "~/components/main-link"
import Project from "~/components/project"

// Utils
import { getRepositoriesByNodeId } from "~/utils/github"
import { getProjects } from "~/utils/contentful"

import type { Route } from "./+types/index"

type Repository = {
  /** The name of the repository */
  name: string
  /** The ID of the repository */
  id: number
  /** The URL for the repository on GitHub */
  homepageUrl: string | null
  /** The description of the repository */
  description: string | null
  /** The URL for the repository on GitHub */
  url: string
  /** The URL for the screenshot */
  screenshotUrl?: string
}

export async function loader() {
  async function getData() {
    const projects = await getProjects()
    const repos = await getRepositoriesByNodeId(
      projects
        .sort((a, b) => Number(a.fields.priority) - Number(b.fields.priority))
        .map(p => p.fields.ghId),
    )
    const repositories: Repository[] = repos.map(repo => {
      const project = projects.find(p => p.fields.ghId === repo.node_id)
      return {
        name: repo.name,
        id: repo.id,
        homepageUrl: repo.homepage,
        description: repo.description,
        url: repo.html_url,
        screenshotUrl: project?.fields.screenshot?.fields?.file?.url,
      } satisfies Repository
    })
    return repositories
  }

  return getData()
}

export default function Index({ loaderData: repos }: Route.ComponentProps) {
  return (
    <>
      <Banner noBg>
        <h2 className="text-2xl font-mono mb-4 text-white">
          Mission Statement
        </h2>
        <p className="text-[#B0B0B0] text-lg leading-relaxed pb-20">
          My mission is to create innovative and user-centric digital
          experiences that seamlessly blend aesthetics with functionality. I
          strive to push the boundaries of web design and game development,
          always aiming to deliver solutions that not only meet but exceed user
          expectations.
        </p>
      </Banner>

      <Slices colors={["#333"]}>
        <SliceContent title="Projects">
          <React.Suspense fallback={"Loading projects..."}>
            <Await
              resolve={repos}
              errorElement={"Could not load projects"}
              children={resolvedRepos => {
                return (
                  <section className="md:grid md:gap-8 pb-10 md:grid-cols-2">
                    {resolvedRepos.map(repo => {
                      return (
                        <Project
                          key={repo.id}
                          title={repo.name}
                          description={repo.description}
                          repoUrl={repo.url}
                          url={repo.homepageUrl}
                          screenshotUrl={repo.screenshotUrl}
                        />
                      )
                    })}
                  </section>
                )
              }}
            ></Await>
          </React.Suspense>
        </SliceContent>
      </Slices>
      {/* <Slices colors={["#21d", "#1e0ed0", "#1b0cc4", "#333"]}>
        <SliceContent
          title="Watch out for me in Sim!"
          image="/images/jimmy_car.png"
          footer={
            <MainLink
              to="https://members.iracing.com/membersite/member/CareerStats.do?custid=106684"
              external
            >
              Visit my member profile (Membership Required)
            </MainLink>
          }
        >
          You can find me in the sim racing a Beta UI (BUI) paint scheme, or if
          you're lucky, you'll find me as one of your AI opponents if you happen
          to let the BUI create a roster for you. Be gentle with me when you
          find me, and be sure to let me win!
        </SliceContent>
        <SliceContent
          title="My Blog"
          footer={<MainLink to="/blog">Learn More</MainLink>}
          image="/images/blog_vscode.jpg"
        >
          My blog, documenting basically whatever I feel like. I am intending on
          using this space to document some tricky, non-proprietary patterns I
          needed to discover/develop for my work at iRacing. Some of these
          patterns are very time sensitive, meaning the value may very well be
          outdated in some not so distant future. Even knowing that this I will
          endeavor to keep the most pertinent blog posts up to date if any minor
          changes occur that would otherwise prevent the topic from keeping
          fresh.
        </SliceContent>
        <SliceContent
          title="Our Tech Stack"
          footer={
            <MainLink
              to="https://www.iracing.com/category/all-news/blog/"
              external
            >
              Learn More
            </MainLink>
          }
          image="/images/pic03.jpg"
        >
          Our current tech stack consists of consuming dozens of microservice
          API's across a persistent and secure socket.io websocket tunnel. The
          core BetaUI application is a complex React & Redux architecture,
          running inside a custom Electron application container in constant
          communication with a locally installed microservice application
          serving as the portal between the iRacing simulation executable, and
          this web application.
        </SliceContent>
        <SliceContent title="My Projects" flip={false}>
          <p className="mb-4">
            Here is a small collection of personal projects I have worked on.
            While many of these projects are quite old at this point, some may
            be more recent. Feel free to take any inspiration you wish from
            these codebases.
          </p>
          <section className="md:grid md:gap-8 pb-10 md:grid-cols-2">
            {repos.map(repo => {
              return (
                <Project
                  key={repo.id}
                  title={repo.name}
                  description={repo.description}
                  repoUrl={repo.url}
                  url={repo.homepageUrl}
                  screenshotUrl={repo.screenshotUrl}
                />
              )
            })}
          </section>
          <a
            href="https://github.com/JimmayVV?tab=repositories"
            className="uppercase font-raleway font-bold text-sm tracking-widest rounded-sm border-2 border-white/30 px-10 py-4 hover:bg-white/10"
            target="_blank"
          >
            Browse All
          </a>
        </SliceContent>
      </Slices> */}
    </>
  )
}

export function ErrorBoundary() {
  return "Whoops"
}
