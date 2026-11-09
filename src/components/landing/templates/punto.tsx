import { Clock, MapPin, Phone } from "lucide-react"
import { getLandingCopy } from "@/lib/landing/copy"
import {
  ActionLink, BookingNotes, ClinicLogo, ContactDetails, FaqList, LandingFooter, LandingPhoto,
  StickyMobileCta, servicePrice, type LandingTemplateProps,
} from "../shared"

const primaryClass = "rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] focus-visible:ring-[#1D4ED8]"
const secondaryClass = "rounded-lg bg-[#E8EEFC] text-[#1E3A8A] hover:bg-[#DCE5FB] focus-visible:ring-[#1D4ED8]"

/** Compact, practical layout: booking bar, quick facts, service price table first. */
export function PuntoTemplate({ page }: LandingTemplateProps) {
  const t = getLandingCopy(page.locale)
  const bookingAction = page.primaryAction?.kind === "booking" ? page.primaryAction : null
  return (
    <div className="min-h-screen bg-[#F6F7FB] text-[#0F172A]">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <ClinicLogo page={page} className="h-8 w-8" />
            <span className="font-bold">{page.clinic.name}</span>
          </div>
          {page.primaryAction && <ActionLink action={page.primaryAction} t={t} className={`hidden min-h-10 px-4 text-sm sm:inline-flex ${primaryClass}`} />}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        <section className="grid gap-6 py-8 md:grid-cols-[1.4fr_1fr] md:py-12">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
            <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">{page.hero.headline}</h1>
            <p className="mt-3 text-slate-600">{page.hero.subheadline}</p>
            {page.highlights.length > 0 && (
              <ul aria-label={t.whyUs} className="mt-5 flex flex-wrap gap-2">
                {page.highlights.map((highlight) => (
                  <li key={highlight} className="rounded-full bg-[#E8EEFC] px-3 py-1 text-sm font-medium text-[#1E3A8A]">{highlight}</li>
                ))}
              </ul>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              {page.primaryAction && <ActionLink action={page.primaryAction} t={t} className={primaryClass} />}
              {page.secondaryAction && <ActionLink action={page.secondaryAction} t={t} className={secondaryClass} />}
            </div>
            <BookingNotes page={page} className="mt-4 text-slate-500" />
          </div>
          <div className="flex flex-col gap-4">
            {page.hero.image && <LandingPhoto image={page.hero.image} priority sizes="(min-width: 768px) 40vw, 100vw" className="aspect-video rounded-2xl" />}
            <dl className="grid gap-3 rounded-2xl bg-white p-5 text-sm shadow-sm ring-1 ring-slate-200">
              {page.location && (
                <div className="flex gap-3"><dt className="sr-only">{t.location}</dt><MapPin className="h-5 w-5 shrink-0 text-[#1D4ED8]" aria-hidden /><dd>{page.location.address}</dd></div>
              )}
              {page.contact.phone && (
                <div className="flex gap-3"><dt className="sr-only">{t.contact}</dt><Phone className="h-5 w-5 shrink-0 text-[#1D4ED8]" aria-hidden /><dd><a href={page.contact.phone.href} className="font-semibold hover:underline">{page.contact.phone.display}</a></dd></div>
              )}
            </dl>
          </div>
        </section>

        {page.services.length > 0 && (
          <section className="pb-10" aria-labelledby="punto-services">
            <div className="flex items-end justify-between">
              <h2 id="punto-services" className="text-2xl font-extrabold">{t.services}</h2>
              <p className="text-sm text-slate-500">{t.servicesIntro}</p>
            </div>
            <ul className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              {page.services.map((service) => {
                const price = servicePrice(page, service)
                return (
                  <li key={service.productId} className="flex items-center gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{service.name}</h3>
                      <p className="flex items-center gap-1.5 text-sm text-slate-500"><Clock className="h-3.5 w-3.5" aria-hidden />{service.durationMinutes} {t.minutes} · {service.procedureName}</p>
                    </div>
                    {price && <span className="font-bold tabular-nums">{price}</span>}
                    {bookingAction && (
                      <a href={bookingAction.href} className="hidden min-h-10 items-center rounded-lg border border-[#1D4ED8] px-3 text-sm font-semibold text-[#1D4ED8] hover:bg-[#E8EEFC] sm:inline-flex" aria-label={`${t.bookThis}: ${service.name}`}>
                        {t.bookThis}
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <section className="grid gap-6 pb-12 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-extrabold">{t.contact}</h2>
            <div className="mt-4"><ContactDetails page={page} linkClassName="text-[#1D4ED8]" /></div>
          </div>
          {page.professionals.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-extrabold">{t.team}</h2>
              <ul className="mt-4 space-y-4">
                {page.professionals.map((professional) => (
                  <li key={professional.name} className="flex gap-3">
                    {professional.photo && <LandingPhoto image={professional.photo} sizes="56px" className="h-14 w-14 shrink-0 rounded-xl" />}
                    <div>
                      <h3 className="font-semibold">{professional.name}</h3>
                      {professional.role && <p className="text-sm text-[#1D4ED8]">{professional.role}</p>}
                      {professional.bio && <p className="mt-1 text-sm text-slate-600">{professional.bio}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {page.faqs.length > 0 && (
            <div className="md:col-span-2">
              <h2 className="text-xl font-extrabold">{t.faq}</h2>
              <div className="mt-4"><FaqList page={page} itemClassName="bg-white shadow-sm ring-1 ring-slate-200" /></div>
            </div>
          )}
        </section>
      </main>

      <LandingFooter page={page} className="border-t border-slate-200 bg-white text-slate-500" />
      <StickyMobileCta page={page} className={primaryClass} />
    </div>
  )
}
