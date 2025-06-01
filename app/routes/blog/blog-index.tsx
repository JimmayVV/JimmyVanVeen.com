// Libs
import { Link, useLoaderData } from "react-router"

// Components
import Banner from "~/components/banner"
import Slices from "~/components/slices"
import SliceContent from "~/components/slice-content"

// Utils
import { getAllBlogPosts } from "~/utils/contentful"

export async function loader() {
  return await getAllBlogPosts()
}

export default function BlogIndex() {
  const data = useLoaderData<typeof loader>()

  return (
    <div>
      <Banner>
        <h2 className="border-b-2 border-b-zinc-500/50 text-4xl mb-6 pb-4 leading-[60px] font-bold tracking-widest">
          Blog Posts from Jimmy
        </h2>
        <p className="leading-8 tracking-widest">
          These blog posts more or less will be occupied by various topic and
          resources I've struggled to find concrete information about in a
          timely manner. These blog posts are not meant to be unique, nor are
          they trying to be entirely original. They will attempt to log
          information that was less than easy for me to find on my own, and to
          reference back on it as I please.
        </p>
      </Banner>
      <Slices colors={["#333", "#222"]} staticAlignment>
        {data?.length > 0 ? (
          data.map(blog => {
            const title = `${blog.fields.title} (${new Date(
              blog.fields.publishDate,
            ).toLocaleDateString("en-us", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })})`

            return (
              <SliceContent
                title={
                  <Link to={`./${blog.fields.slug}`} prefetch="intent">
                    {title}
                  </Link>
                }
                key={blog.sys.id}
              >
                {blog.fields.description}
              </SliceContent>
            )
          })
        ) : (
          <SliceContent title="No Blog Posts">
            There are currently no blog posts
          </SliceContent>
        )}
      </Slices>
    </div>
  )
}
