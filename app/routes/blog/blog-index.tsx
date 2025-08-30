// Libs
import { Link, useLoaderData } from "react-router"

// Components
import GradientBanner from "~/components/gradient-banner"
import ContentCards, { ContentCard } from "~/components/content-cards"

// Utils
import { getCachedBlogPosts } from "~/utils/contentful-cache"
import { isContentfulConfigured } from "~/utils/contentful"

export async function loader() {
  const posts = await getCachedBlogPosts()
  return {
    posts,
    isConfigured: isContentfulConfigured(),
  }
}

export default function BlogIndex() {
  const { posts, isConfigured } = useLoaderData<typeof loader>()

  return (
    <div className="min-h-screen bg-black">
      <GradientBanner>
        <h2 className="border-b-2 border-b-zinc-500/50 text-4xl mb-6 pb-4 leading-[60px] font-bold tracking-widest">
          Blog Posts from Jimmy
        </h2>
        <p className="leading-8 tracking-widest">
          These blog posts more or less will be occupied by various topic and
          resources I&apos;ve struggled to find concrete information about in a
          timely manner. These blog posts are not meant to be unique, nor are
          they trying to be entirely original. They will attempt to log
          information that was less than easy for me to find on my own, and to
          reference back on it as I please.
        </p>
      </GradientBanner>

      <ContentCards spacing="space-y-8 -mt-40 relative z-10">
        {posts?.length > 0 ? (
          posts.map(blog => {
            const title = `${blog.fields.title} (${new Date(
              blog.fields.publishDate,
            ).toLocaleDateString("en-us", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })})`

            return (
              <ContentCard
                title={
                  <Link
                    to={`./${blog.fields.slug}`}
                    prefetch="intent"
                    className="hover:text-blue-400 transition-colors"
                  >
                    {title}
                  </Link>
                }
                key={blog.sys.id}
              >
                {blog.fields.description}
              </ContentCard>
            )
          })
        ) : (
          <ContentCard title="Blog Posts">
            {!isConfigured ? (
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-6 rounded-lg">
                <div className="flex items-start gap-4">
                  <svg
                    className="w-8 h-8 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                      Contentful API Configuration Required
                    </h3>
                    <p className="text-base font-medium text-yellow-800 dark:text-yellow-200">
                      Blog posts cannot be loaded without Contentful CMS access.
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-3">
                      Please configure CONTENTFUL_SPACE_ID and
                      CONTENTFUL_ACCESS_TOKEN environment variables to enable
                      blog functionality.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-6 rounded-lg">
                <div className="flex items-start gap-4">
                  <svg
                    className="w-8 h-8 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">
                      No Blog Posts Yet
                    </h3>
                    <p className="text-base font-medium text-blue-800 dark:text-blue-200">
                      There are no blog posts published at this time.
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-3">
                      Check back later for new content!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </ContentCard>
        )}
      </ContentCards>
    </div>
  )
}
