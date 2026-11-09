import type { ComponentType } from "react"
import type { PublicLandingPage } from "@/lib/landing/types"
import type { LandingTemplateProps } from "./shared"
import { CalmaTemplate } from "./templates/calma"
import { EstudioTemplate } from "./templates/estudio"
import { PuntoTemplate } from "./templates/punto"

/** Template keys are persisted in clinic content; never rename a key, only add new ones. */
export const landingTemplates: Record<string, ComponentType<LandingTemplateProps>> = {
  calma: CalmaTemplate,
  estudio: EstudioTemplate,
  punto: PuntoTemplate,
}

export const DEFAULT_TEMPLATE_KEY = "calma"

export function LandingRenderer({ page }: { page: PublicLandingPage }) {
  const Template = landingTemplates[page.templateKey] ?? landingTemplates[DEFAULT_TEMPLATE_KEY]
  return (
    <div lang={page.locale}>
      <Template page={page} />
    </div>
  )
}
