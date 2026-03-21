import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://flowstateit.co.uk'

  let blogUrls: MetadataRoute.Sitemap = []

  try {
    const payload = await getPayload({ config })
    const posts = await payload.find({
      collection: 'blog-posts',
      where: { status: { equals: 'published' } },
      limit: 100,
      select: { slug: true, updatedAt: true },
    })

    blogUrls = posts.docs.map((post) => ({
      url: `${baseUrl}/blog/${String(post.slug)}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt as string) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch {
    // Sitemap must not fail if DB is unavailable (e.g., build time without DB)
    blogUrls = []
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...blogUrls,
  ]
}
