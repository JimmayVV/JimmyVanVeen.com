import { getStore } from "@netlify/blobs"
import * as contentful from "./contentful"
import type { Entry } from "contentful"
import type { BlogPostSkeleton, ProjectFieldsSkeleton } from "./contentful"

interface CacheEntry<T> {
  data: T
  timestamp: number
  etag?: string
}

interface CacheConfig {
  ttl: number
  store: string
}

const isDevelopment = process.env.NODE_ENV === "development"
const isNetlifyBuild = process.env.NETLIFY === "true"
const hasNetlifyBlobsConfig = !!(
  process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN
)

// Check if we're in Netlify build process
const isBuildTime = isNetlifyBuild

// Control whether to fetch fresh data at runtime
// When true, will only use cached data (no API calls)
const DISABLE_RUNTIME_FETCH = process.env.DISABLE_CONTENTFUL_RUNTIME === "true"

// In-memory cache for development
// Using unknown because this is a generic cache that stores different types
// Type safety is maintained through the generic functions that use it
const memoryCache = new Map<string, CacheEntry<unknown>>()

// Build-time data cache (populated during build, used at runtime if DISABLE_RUNTIME_FETCH is true)
const BUILD_TIME_DATA: {
  blogPosts?: Entry<BlogPostSkeleton, undefined, string>[]
  projects?: Entry<ProjectFieldsSkeleton, undefined, string>[]
  timestamp?: string
} = {}

const CACHE_CONFIG: Record<string, CacheConfig> = {
  projects: {
    ttl: isDevelopment ? 30 * 1000 : 5 * 60 * 1000, // 30s dev, 5min prod
    store: "contentful-projects",
  },
  blogPosts: {
    ttl: isDevelopment ? 30 * 1000 : 5 * 60 * 1000, // 30s dev, 5min prod
    store: "contentful-blog-posts",
  },
  blogPost: {
    ttl: isDevelopment ? 60 * 1000 : 10 * 60 * 1000, // 1min dev, 10min prod
    store: "contentful-blog-post",
  },
}

async function getCachedData<T>(
  key: string,
  config: CacheConfig,
  fetcher: () => Promise<T>,
): Promise<T> {
  // Use in-memory cache for development if Netlify Blobs not configured
  if (isDevelopment && !hasNetlifyBlobsConfig) {
    return getCachedDataMemory(key, config, fetcher)
  }

  // Use Netlify Blobs for production or if configured
  try {
    const store = getStore(config.store)

    // Try to get cached data with metadata
    const cached = await store.getWithMetadata(key, { type: "json" })

    if (cached && cached.data) {
      const entry = cached.data as CacheEntry<T>
      const now = Date.now()
      const age = now - entry.timestamp

      // Return cached data if still fresh
      if (age < config.ttl) {
        console.log(
          `[Cache HIT] ${key} (age: ${Math.round(age / 1000)}s, ttl: ${
            config.ttl / 1000
          }s)`,
        )
        return entry.data
      }

      console.log(
        `[Cache EXPIRED] ${key} (age: ${Math.round(age / 1000)}s, ttl: ${
          config.ttl / 1000
        }s)`,
      )
    }
  } catch (error) {
    console.warn(`[Cache ERROR] Failed to read cache for ${key}:`, error)
  }

  // Fetch fresh data
  console.log(`[Cache MISS] Fetching fresh data for ${key}`)
  const freshData = await fetcher()

  // Store in cache
  try {
    const store = getStore(config.store)
    const cacheEntry: CacheEntry<T> = {
      data: freshData,
      timestamp: Date.now(),
    }

    await store.setJSON(key, cacheEntry, {
      metadata: {
        cachedAt: new Date().toISOString(),
        ttl: config.ttl,
        environment: process.env.NODE_ENV,
      },
    })

    console.log(`[Cache STORED] ${key} with TTL ${config.ttl / 1000}s`)
  } catch (error) {
    console.warn(`[Cache ERROR] Failed to store cache for ${key}:`, error)
  }

  return freshData
}

async function getCachedDataMemory<T>(
  key: string,
  config: CacheConfig,
  fetcher: () => Promise<T>,
): Promise<T> {
  // Check memory cache
  const cached = memoryCache.get(key)

  if (cached) {
    const now = Date.now()
    const age = now - cached.timestamp

    // Return cached data if still fresh
    if (age < config.ttl) {
      console.log(
        `[Memory Cache HIT] ${key} (age: ${Math.round(age / 1000)}s, ttl: ${
          config.ttl / 1000
        }s)`,
      )
      return cached.data as T
    }

    console.log(
      `[Memory Cache EXPIRED] ${key} (age: ${Math.round(age / 1000)}s, ttl: ${
        config.ttl / 1000
      }s)`,
    )
  }

  // Fetch fresh data
  console.log(`[Memory Cache MISS] Fetching fresh data for ${key}`)
  const freshData = await fetcher()

  // Store in memory cache
  const cacheEntry: CacheEntry<T> = {
    data: freshData,
    timestamp: Date.now(),
  }

  memoryCache.set(key, cacheEntry)
  console.log(`[Memory Cache STORED] ${key} with TTL ${config.ttl / 1000}s`)

  return freshData
}

/**
 * Get all projects with caching
 */
export async function getCachedProjects() {
  // During build, always fetch fresh and cache it
  if (isBuildTime) {
    console.log("[Build Time] Fetching projects from Contentful API")
    const projects = await contentful.getProjects()
    BUILD_TIME_DATA.projects = projects
    return projects
  }

  // At runtime, check if we should use build-time data
  if (DISABLE_RUNTIME_FETCH && BUILD_TIME_DATA.projects) {
    console.log(
      "[Runtime] Using build-time cached projects (runtime fetch disabled)",
    )
    return BUILD_TIME_DATA.projects
  }

  // Otherwise use normal caching behavior
  return getCachedData(
    "all-projects",
    CACHE_CONFIG.projects,
    contentful.getProjects,
  )
}

/**
 * Get all blog posts with caching
 */
export async function getCachedBlogPosts() {
  // During build, always fetch fresh and cache it
  if (isBuildTime) {
    console.log("[Build Time] Fetching blog posts from Contentful API")
    const posts = await contentful.getAllBlogPosts()
    BUILD_TIME_DATA.blogPosts = posts
    BUILD_TIME_DATA.timestamp = new Date().toISOString()
    return posts
  }

  // At runtime, check if we should use build-time data
  if (DISABLE_RUNTIME_FETCH && BUILD_TIME_DATA.blogPosts) {
    console.log(
      "[Runtime] Using build-time cached blog posts (runtime fetch disabled)",
    )
    return BUILD_TIME_DATA.blogPosts
  }

  // Otherwise use normal caching behavior
  return getCachedData(
    "all-blog-posts",
    CACHE_CONFIG.blogPosts,
    contentful.getAllBlogPosts,
  )
}

/**
 * Get blog post by slug with caching
 */
export async function getCachedBlogPostBySlug(slug: string) {
  // During build or if runtime fetch is disabled, use cached blog posts
  if (isBuildTime || (DISABLE_RUNTIME_FETCH && BUILD_TIME_DATA.blogPosts)) {
    const posts = isBuildTime
      ? await getCachedBlogPosts() // This will fetch and cache during build
      : BUILD_TIME_DATA.blogPosts

    const post = posts?.find(p => p.fields?.slug === slug)
    if (post) {
      console.log(
        `[${isBuildTime ? "Build Time" : "Runtime"}] Found blog post: ${slug}`,
      )
      return post
    }
    throw new Error(`Blog post not found: ${slug}`)
  }

  // Otherwise use normal caching behavior
  return getCachedData(`blog-post-${slug}`, CACHE_CONFIG.blogPost, () =>
    contentful.getBlogPostBySlug(slug),
  )
}

/**
 * Clear all caches (useful for manual invalidation)
 */
export async function clearAllCaches() {
  // Clear memory cache for development
  if (isDevelopment && !hasNetlifyBlobsConfig) {
    const size = memoryCache.size
    memoryCache.clear()
    console.log(`[Memory Cache CLEARED] ${size} entries cleared`)
    return size
  }

  // Clear Netlify Blobs for production
  const stores = Object.values(CACHE_CONFIG).map(config =>
    getStore(config.store),
  )

  const results = await Promise.allSettled(
    stores.map(async store => {
      const blobs = await store.list()
      return Promise.all(blobs.blobs.map(blob => store.delete(blob.key)))
    }),
  )

  const successCount = results.filter(r => r.status === "fulfilled").length
  console.log(`[Cache CLEARED] ${successCount} stores cleared`)
  return successCount
}

/**
 * Get cache statistics
 */
interface CacheStats {
  type: string
  store: string
  ttl: number
  count?: number
  entries?: unknown[]
  error?: string
}

export async function getCacheStats() {
  const stats: Record<string, CacheStats> = {}

  // Return memory cache stats for development
  if (isDevelopment && !hasNetlifyBlobsConfig) {
    for (const [name, config] of Object.entries(CACHE_CONFIG)) {
      const entries = Array.from(memoryCache.entries())
        .filter(([k]) => k.includes(name.toLowerCase()))
        .map(([key, value]) => ({
          key,
          age: Date.now() - value.timestamp,
          expired: Date.now() - value.timestamp > config.ttl,
        }))

      stats[name] = {
        type: "memory",
        store: config.store,
        ttl: config.ttl,
        count: entries.length,
        entries,
      }
    }
    return stats
  }

  // Return Netlify Blobs stats for production
  for (const [name, config] of Object.entries(CACHE_CONFIG)) {
    try {
      const store = getStore(config.store)
      const blobs = await store.list()

      const entries = await Promise.all(
        blobs.blobs.map(async blob => {
          const metadata = await store.getMetadata(blob.key)
          return {
            key: blob.key,
            metadata: metadata?.metadata,
            etag: metadata?.etag,
          }
        }),
      )

      stats[name] = {
        type: "netlify-blobs",
        store: config.store,
        ttl: config.ttl,
        count: entries.length,
        entries,
      }
    } catch (error) {
      stats[name] = {
        type: "netlify-blobs",
        store: config.store,
        ttl: config.ttl,
        error: String(error),
      }
    }
  }

  return stats
}
