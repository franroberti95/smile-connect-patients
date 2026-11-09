/** Mirrors `PublicLandingPage` from smile-connect `src/lib/landing-page/model.ts`. */
export interface LandingImage {
  url: string
  alt: string
}

export type LandingActionKind = "booking" | "external" | "whatsapp" | "phone"

export interface LandingAction {
  kind: LandingActionKind
  href: string
  label: string | null
}

export interface LandingService {
  productId: number
  name: string
  procedureName: string
  amount: number
  currencyCode: string
  durationMinutes: number
}

export interface PublicLandingPage {
  schemaVersion: number
  templateKey: string
  locale: "es" | "en"
  clinic: { name: string; slug: string; logoUrl: string | null }
  hero: { headline: string; subheadline: string; image: LandingImage | null }
  services: LandingService[]
  highlights: string[]
  faqs: Array<{ question: string; answer: string }>
  professionals: Array<{ name: string; role: string; bio: string; photo: LandingImage | null }>
  social: { instagram: string; facebook: string; website: string }
  privacyPolicyUrl: string
  location: { address: string; mapUrl: string | null; accessNote: string } | null
  contact: {
    phone: { display: string; href: string } | null
    whatsappHref: string | null
    email: string | null
  }
  primaryAction: LandingAction | null
  secondaryAction: LandingAction | null
  booking: {
    url: string
    availableForNewPatients: boolean
    existingPatientsOnly: boolean
    requiresSignIn: true
    requiresPhoneAndId: true
    paymentMode: "full" | "deposit"
    depositPercentage: number | null
  } | null
  urls: { landing: string; booking: string | null }
  publishedAt: string | null
}

export const LANDING_PREVIEW_MESSAGE = "smileconnect:landing-preview"

export function isPublicLandingPage(value: unknown): value is PublicLandingPage {
  if (!value || typeof value !== "object") return false
  const page = value as Partial<PublicLandingPage>
  return (
    typeof page.templateKey === "string" &&
    typeof page.clinic?.name === "string" &&
    typeof page.hero?.headline === "string" &&
    Array.isArray(page.services) &&
    Array.isArray(page.faqs) &&
    Array.isArray(page.professionals) &&
    Array.isArray(page.highlights) &&
    typeof page.contact === "object"
  )
}
