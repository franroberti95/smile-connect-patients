import Image from "next/image"
import { Mail, MapPin, MessageCircle, Phone, CalendarCheck, ExternalLink } from "lucide-react"
import { actionLabel, bookingNotes, formatPrice, getLandingCopy, isExternalAction, type LandingCopy } from "@/lib/landing/copy"
import type { LandingAction, PublicLandingPage } from "@/lib/landing/types"
import { cn } from "@/lib/utils"
import { HERO_CTA_ATTRIBUTE } from "@/lib/landing/hero-cta"
import { WhenHeroCtaHidden } from "./sticky-visibility"

export interface LandingTemplateProps {
  page: PublicLandingPage
}

const actionIcons = {
  booking: CalendarCheck,
  external: ExternalLink,
  whatsapp: MessageCircle,
  phone: Phone,
} as const

export function ActionLink({ action, t, className }: { action: LandingAction; t: LandingCopy; className?: string }) {
  const Icon = actionIcons[action.kind]
  const external = isExternalAction(action)
  return (
    <a
      href={action.href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        className
      )}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      {actionLabel(action, t)}
    </a>
  )
}

export function BookingNotes({ page, className }: { page: PublicLandingPage; className?: string }) {
  const t = getLandingCopy(page.locale)
  const notes = bookingNotes(page, t)
  const showExistingOnly = page.booking?.existingPatientsOnly && page.primaryAction?.kind !== "booking"
  if (notes.length === 0 && !showExistingOnly) return null
  return (
    <ul className={cn("space-y-1 text-sm", className)}>
      {notes.map((note) => <li key={note}>{note}</li>)}
      {showExistingOnly && <li>{t.existingOnly}</li>}
    </ul>
  )
}

export function StickyMobileCta({ page, className }: { page: PublicLandingPage; className: string }) {
  const t = getLandingCopy(page.locale)
  if (!page.primaryAction) return null
  return (
    <WhenHeroCtaHidden>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 p-3 backdrop-blur md:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <ActionLink action={page.primaryAction} t={t} className={cn("w-full", className)} />
      </div>
    </WhenHeroCtaHidden>
  )
}

export function LandingPhoto({ image, className, priority, sizes }: { image: PublicLandingPage["hero"]["image"]; className?: string; priority?: boolean; sizes: string }) {
  if (!image) return null
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image src={image.url} alt={image.alt} fill priority={priority} sizes={sizes} className="object-cover" />
    </div>
  )
}

export function ClinicLogo({ page, className }: { page: PublicLandingPage; className?: string }) {
  if (!page.clinic.logoUrl) return null
  return (
    <span className={cn("relative block h-10 w-10 overflow-hidden rounded-full bg-white", className)}>
      <Image src={page.clinic.logoUrl} alt="" fill sizes="40px" className="object-contain" />
    </span>
  )
}

/** Marks the hero button group; the sticky mobile CTA stays hidden while it is on screen. */
export const heroCtaProps = { [HERO_CTA_ATTRIBUTE]: "true" } as const

const normalizeLabel = (value: string) => value.trim().toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

/** The procedure name, unless it just repeats the service name. */
export function serviceSubtitle(service: PublicLandingPage["services"][number]): string | null {
  const procedure = service.procedureName?.trim()
  return procedure && normalizeLabel(procedure) !== normalizeLabel(service.name) ? procedure : null
}

export function servicePrice(page: PublicLandingPage, service: PublicLandingPage["services"][number]) {
  return formatPrice(service, page.locale)
}

export function FaqList({ page, itemClassName }: { page: PublicLandingPage; itemClassName?: string }) {
  return (
    <div className="space-y-3">
      {page.faqs.map((faq) => (
        <details key={faq.question} className={cn("group rounded-xl p-4", itemClassName)}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current [&::-webkit-details-marker]:hidden">
            {faq.question}
            <span aria-hidden className="text-xl leading-none transition group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 whitespace-pre-line text-[0.95rem] leading-relaxed opacity-90">{faq.answer}</p>
        </details>
      ))}
    </div>
  )
}

export function ContactDetails({ page, linkClassName }: { page: PublicLandingPage; linkClassName?: string }) {
  const t = getLandingCopy(page.locale)
  const { location, contact } = page
  return (
    <ul className="space-y-4 text-[0.95rem]">
      {location && (
        <li className="flex gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p>{location.address}</p>
            {location.accessNote && <p className="mt-1 opacity-80">{location.accessNote}</p>}
            {location.mapUrl && (
              <a href={location.mapUrl} target="_blank" rel="noopener noreferrer" className={cn("mt-1 inline-block font-semibold underline underline-offset-4", linkClassName)}>
                {t.openMap}
              </a>
            )}
          </div>
        </li>
      )}
      {contact.phone && (
        <li className="flex items-center gap-3">
          <Phone className="h-5 w-5 shrink-0" aria-hidden />
          <a href={contact.phone.href} className={cn("underline-offset-4 hover:underline", linkClassName)}>{contact.phone.display}</a>
        </li>
      )}
      {contact.whatsappHref && (
        <li className="flex items-center gap-3">
          <MessageCircle className="h-5 w-5 shrink-0" aria-hidden />
          <a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer" className={cn("underline-offset-4 hover:underline", linkClassName)}>WhatsApp</a>
        </li>
      )}
      {contact.email && (
        <li className="flex items-center gap-3">
          <Mail className="h-5 w-5 shrink-0" aria-hidden />
          <a href={`mailto:${contact.email}`} className={cn("break-all underline-offset-4 hover:underline", linkClassName)}>{contact.email}</a>
        </li>
      )}
    </ul>
  )
}

export function LandingFooter({ page, className }: { page: PublicLandingPage; className?: string }) {
  const t = getLandingCopy(page.locale)
  const socials = [
    ["Instagram", page.social.instagram],
    ["Facebook", page.social.facebook],
    [page.locale === "en" ? "Website" : "Sitio web", page.social.website],
  ].filter(([, href]) => href)
  return (
    <footer className={cn("px-6 pb-28 pt-10 text-sm md:pb-10", className)}>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} {page.clinic.name}</p>
        <nav aria-label={t.contact} className="flex flex-wrap gap-x-5 gap-y-2">
          {socials.map(([label, href]) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">{label}</a>
          ))}
          {page.privacyPolicyUrl && (
            <a href={page.privacyPolicyUrl} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">{t.privacy}</a>
          )}
          <span className="opacity-70">{t.poweredBy}</span>
        </nav>
      </div>
    </footer>
  )
}
