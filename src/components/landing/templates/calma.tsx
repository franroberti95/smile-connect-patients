import { Check, Clock } from "lucide-react"
import { getLandingCopy } from "@/lib/landing/copy"
import {
  ActionLink, BookingNotes, ClinicLogo, ContactDetails, FaqList, LandingFooter, LandingPhoto,
  StickyMobileCta, heroCtaProps, servicePrice, serviceSubtitle, type LandingTemplateProps,
} from "../shared"

const primaryClass = "bg-[#2F6F6A] text-white hover:bg-[#255955] focus-visible:ring-[#2F6F6A]"
const secondaryClass = "border-2 border-[#2F6F6A] text-[#2F6F6A] hover:bg-[#2F6F6A]/10 focus-visible:ring-[#2F6F6A]"

/** Warm, reassuring layout: split hero with a large rounded photo, soft cards. */
export function CalmaTemplate({ page }: LandingTemplateProps) {
  const t = getLandingCopy(page.locale)
  return (
    <div className="min-h-screen bg-[#FBF7F2] font-sans text-[#2B2A28]">
      <header className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-5">
        <ClinicLogo page={page} />
        <span className="text-lg font-semibold">{page.clinic.name}</span>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-6 pb-16 pt-2 md:grid-cols-2 md:gap-10 md:pt-12">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#1F3B39] md:text-5xl">{page.hero.headline}</h1>
            <p className="text-lg leading-relaxed text-[#4A4744]">{page.hero.subheadline}</p>
            <div className="flex flex-wrap gap-3" {...heroCtaProps}>
              {page.primaryAction && <ActionLink action={page.primaryAction} t={t} className={primaryClass} />}
              {page.secondaryAction && <ActionLink action={page.secondaryAction} t={t} className={secondaryClass} />}
            </div>
            <BookingNotes page={page} className="text-[#5C5853]" />
          </div>
          {page.hero.image ? (
            <LandingPhoto image={page.hero.image} priority sizes="(min-width: 768px) 50vw, 100vw" className="order-first aspect-[16/9] rounded-[1.5rem] shadow-xl shadow-[#2F6F6A]/10 md:order-none md:aspect-[4/3] md:rounded-[2rem]" />
          ) : (
            <div aria-hidden className="hidden aspect-[4/3] rounded-[2rem] bg-gradient-to-br from-[#DCEBE7] to-[#F3E6D8] md:block" />
          )}
        </section>

        {page.highlights.length > 0 && (
          <section aria-label={t.whyUs} className="bg-white/70">
            <ul className="mx-auto grid max-w-6xl gap-4 px-6 py-8 sm:grid-cols-3">
              {page.highlights.map((highlight) => (
                <li key={highlight} className="flex items-center gap-3 rounded-2xl bg-[#EAF3F1] px-4 py-3 font-medium text-[#1F3B39]">
                  <Check className="h-5 w-5 shrink-0 text-[#2F6F6A]" aria-hidden /> {highlight}
                </li>
              ))}
            </ul>
          </section>
        )}

        {page.services.length > 0 && (
          <section className="mx-auto max-w-6xl px-6 py-16" aria-labelledby="calma-services">
            <h2 id="calma-services" className="text-3xl font-bold text-[#1F3B39]">{t.services}</h2>
            <p className="mt-2 text-[#5C5853]">{t.servicesIntro}</p>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {page.services.map((service) => {
                const price = servicePrice(page, service)
                const subtitle = serviceSubtitle(service)
                return (
                  <li key={service.productId} className="flex flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                    <h3 className="text-lg font-semibold">{service.name}</h3>
                    {subtitle && <p className="text-sm text-[#5C5853]">{subtitle}</p>}
                    <div className="mt-auto flex items-center justify-between pt-6">
                      <span className="inline-flex items-center gap-1.5 text-sm text-[#5C5853]"><Clock className="h-4 w-4" aria-hidden />{service.durationMinutes} {t.minutes}</span>
                      {price && <span className="text-lg font-semibold text-[#1F3B39]">{price}</span>}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {page.professionals.length > 0 && (
          <section className="bg-[#EAF3F1]" aria-labelledby="calma-team">
            <div className="mx-auto max-w-6xl px-6 py-16">
              <h2 id="calma-team" className="text-3xl font-bold text-[#1F3B39]">{t.team}</h2>
              <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {page.professionals.map((professional) => (
                  <li key={professional.name} className="rounded-3xl bg-white p-6 text-center">
                    {professional.photo && <LandingPhoto image={professional.photo} sizes="128px" className="mx-auto h-28 w-28 rounded-full" />}
                    <h3 className="mt-4 text-lg font-semibold">{professional.name}</h3>
                    {professional.role && <p className="text-sm font-medium text-[#2F6F6A]">{professional.role}</p>}
                    {professional.bio && <p className="mt-3 text-sm leading-relaxed text-[#5C5853]">{professional.bio}</p>}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2">
          {page.faqs.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold text-[#1F3B39]">{t.faq}</h2>
              <div className="mt-6"><FaqList page={page} itemClassName="bg-white ring-1 ring-black/5" /></div>
            </div>
          )}
          <div className="rounded-3xl bg-white p-8 ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-[#1F3B39]">{page.location ? t.location : t.contact}</h2>
            <div className="mt-6"><ContactDetails page={page} linkClassName="text-[#2F6F6A]" /></div>
            {page.primaryAction && <ActionLink action={page.primaryAction} t={t} className={`mt-8 w-full ${primaryClass}`} />}
          </div>
        </section>
      </main>

      <LandingFooter page={page} className="border-t border-black/5 text-[#5C5853]" />
      <StickyMobileCta page={page} className={primaryClass} />
    </div>
  )
}
