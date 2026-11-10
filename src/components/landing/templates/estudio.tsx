import { getLandingCopy } from "@/lib/landing/copy"
import {
  ActionLink, BookingNotes, ContactDetails, FaqList, LandingFooter, LandingPhoto,
  StickyMobileCta, heroCtaProps, servicePrice, serviceSubtitle, type LandingTemplateProps,
} from "../shared"

const primaryClass = "bg-[#1A1A1A] text-[#F4F1EA] hover:bg-black focus-visible:ring-[#1A1A1A]"
const secondaryClass = "border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F4F1EA] focus-visible:ring-[#1A1A1A]"

/** Editorial, premium layout: serif typography, full-width image band, numbered service list. */
export function EstudioTemplate({ page }: LandingTemplateProps) {
  const t = getLandingCopy(page.locale)
  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#1A1A1A]">
      <header className="border-b border-[#1A1A1A]/15">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <span className="font-serif text-xl tracking-wide">{page.clinic.name}</span>
          {page.primaryAction && <ActionLink action={page.primaryAction} t={t} className={`hidden min-h-10 px-5 text-sm md:inline-flex ${secondaryClass}`} />}
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-12 pt-16 md:pt-24">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7A5C2E]">{page.clinic.name}</p>
          <h1 className="mt-6 max-w-4xl font-serif text-5xl leading-[1.05] md:text-7xl">{page.hero.headline}</h1>
          <div className="mt-10 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <p className="max-w-2xl text-lg leading-relaxed text-[#3D3A35]">{page.hero.subheadline}</p>
            <div className="flex flex-wrap gap-3" {...heroCtaProps}>
              {page.primaryAction && <ActionLink action={page.primaryAction} t={t} className={`rounded-none ${primaryClass}`} />}
              {page.secondaryAction && <ActionLink action={page.secondaryAction} t={t} className={`rounded-none ${secondaryClass}`} />}
            </div>
          </div>
          <BookingNotes page={page} className="mt-4 text-[#5A554D] md:text-right" />
        </section>

        {page.hero.image && (
          <LandingPhoto image={page.hero.image} priority sizes="100vw" className="mx-auto aspect-[21/9] max-w-[1400px] md:mx-6 xl:mx-auto" />
        )}

        {page.highlights.length > 0 && (
          <section aria-label={t.whyUs} className="mx-auto max-w-6xl px-6 py-16">
            <ol className="grid gap-10 md:grid-cols-3">
              {page.highlights.map((highlight, index) => (
                <li key={highlight} className="border-t border-[#1A1A1A] pt-5">
                  <span className="font-serif text-3xl text-[#7A5C2E]">0{index + 1}</span>
                  <p className="mt-3 text-lg">{highlight}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {page.services.length > 0 && (
          <section className="bg-[#1A1A1A] text-[#F4F1EA]" aria-labelledby="estudio-services">
            <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1fr_2fr]">
              <div>
                <h2 id="estudio-services" className="font-serif text-4xl">{t.services}</h2>
                <p className="mt-3 text-[#CFC8BA]">{t.servicesIntro}</p>
              </div>
              <ul className="divide-y divide-[#F4F1EA]/20 border-y border-[#F4F1EA]/20">
                {page.services.map((service) => {
                  const price = servicePrice(page, service)
                  return (
                    <li key={service.productId} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-6">
                      <div>
                        <h3 className="font-serif text-2xl">{service.name}</h3>
                        <p className="text-sm text-[#CFC8BA]">{[serviceSubtitle(service), `${service.durationMinutes} ${t.minutes}`].filter(Boolean).join(" · ")}</p>
                      </div>
                      {price && <span className="text-lg tabular-nums">{price}</span>}
                    </li>
                  )
                })}
              </ul>
            </div>
          </section>
        )}

        {page.professionals.length > 0 && (
          <section className="mx-auto max-w-6xl px-6 py-20" aria-labelledby="estudio-team">
            <h2 id="estudio-team" className="font-serif text-4xl">{t.team}</h2>
            <ul className="mt-10 grid gap-12 md:grid-cols-2">
              {page.professionals.map((professional) => (
                <li key={professional.name} className="grid grid-cols-[120px_1fr] gap-6">
                  {professional.photo ? <LandingPhoto image={professional.photo} sizes="120px" className="aspect-[3/4]" /> : <div aria-hidden className="aspect-[3/4] bg-[#E6E0D3]" />}
                  <div>
                    <h3 className="font-serif text-2xl">{professional.name}</h3>
                    {professional.role && <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#7A5C2E]">{professional.role}</p>}
                    {professional.bio && <p className="mt-4 leading-relaxed text-[#3D3A35]">{professional.bio}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="border-t border-[#1A1A1A]/15">
          <div className="mx-auto grid max-w-6xl gap-16 px-6 py-20 md:grid-cols-2">
            <div>
              <h2 className="font-serif text-4xl">{page.location ? t.location : t.contact}</h2>
              <div className="mt-8"><ContactDetails page={page} /></div>
            </div>
            {page.faqs.length > 0 && (
              <div>
                <h2 className="font-serif text-4xl">{t.faq}</h2>
                <div className="mt-8"><FaqList page={page} itemClassName="rounded-none border-b border-[#1A1A1A]/20 px-0" /></div>
              </div>
            )}
          </div>
        </section>
      </main>

      <LandingFooter page={page} className="border-t border-[#1A1A1A]/15 text-[#5A554D]" />
      <StickyMobileCta page={page} className={`rounded-none ${primaryClass}`} />
    </div>
  )
}
