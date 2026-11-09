import type { MetadataRoute } from "next"
import { fetchPublishedLandingSlugs } from "@/lib/landing/api"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_PATIENT_PORTAL_URL?.replace(/\/+$/, "")
  if (!base) return []
  try {
    const pages = await fetchPublishedLandingSlugs()
    return pages.map(({ slug, publishedAt }) => ({
      url: `${base}/clinica/${encodeURIComponent(slug)}`,
      lastModified: new Date(publishedAt),
      changeFrequency: "weekly",
      priority: 0.8,
    }))
  } catch {
    return []
  }
}
