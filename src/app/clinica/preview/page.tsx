import type { Metadata } from "next"
import { LandingPreview } from "./preview-client"

export const metadata: Metadata = {
  title: "Vista previa",
  robots: { index: false, follow: false },
}

export default function LandingPreviewPage() {
  return <LandingPreview />
}
