import type { PublicLandingPage } from "./types"

function apiBaseUrl() {
  const base = process.env.NEXT_PUBLIC_SMILE_CONNECT_API_URL
  if (!base) throw new Error("NEXT_PUBLIC_SMILE_CONNECT_API_URL is not configured")
  return base
}

/** Returns the published landing page, or null when the slug is unknown or unpublished. */
export async function fetchPublishedLanding(slug: string): Promise<PublicLandingPage | null> {
  const url = new URL(`/api/public/clinics/by-slug/${encodeURIComponent(slug)}/landing`, apiBaseUrl())
  const response = await fetch(url, { next: { revalidate: 60, tags: [`landing:${slug}`] } })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Landing page request failed with ${response.status}`)
  return (await response.json()) as PublicLandingPage
}

export async function fetchPublishedLandingSlugs(): Promise<Array<{ slug: string; publishedAt: string }>> {
  const response = await fetch(new URL("/api/public/landing-pages", apiBaseUrl()), { next: { revalidate: 3600 } })
  if (!response.ok) throw new Error(`Landing sitemap request failed with ${response.status}`)
  const body = (await response.json()) as { pages: Array<{ slug: string; publishedAt: string }> }
  return body.pages
}

/** Origin allowed to drive /clinica/preview (the Smile Connect admin app that also serves the API). */
export function getPreviewParentOrigin(): string | null {
  const base = process.env.NEXT_PUBLIC_SMILE_CONNECT_API_URL
  if (!base) return null
  try {
    return new URL(base).origin
  } catch {
    return null
  }
}
