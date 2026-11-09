import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import { LandingRenderer } from "@/components/landing/registry"
import { fetchPublishedLanding } from "@/lib/landing/api"

const getLanding = cache(fetchPublishedLanding)

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const page = await getLanding(slug)
  if (!page) return { title: "Clínica no encontrada", robots: { index: false } }

  const title = page.hero.headline ? `${page.clinic.name} · ${page.hero.headline}` : page.clinic.name
  const image = page.hero.image ?? (page.clinic.logoUrl ? { url: page.clinic.logoUrl, alt: page.clinic.name } : null)
  return {
    title,
    description: page.hero.subheadline || undefined,
    alternates: page.urls.landing ? { canonical: page.urls.landing } : undefined,
    openGraph: {
      type: "website",
      title,
      description: page.hero.subheadline || undefined,
      url: page.urls.landing || undefined,
      siteName: page.clinic.name,
      locale: page.locale === "en" ? "en_US" : "es_AR",
      images: image ? [{ url: image.url, alt: image.alt }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description: page.hero.subheadline || undefined },
  }
}

export default async function ClinicLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getLanding(slug)
  if (!page) notFound()
  return <LandingRenderer page={page} />
}
