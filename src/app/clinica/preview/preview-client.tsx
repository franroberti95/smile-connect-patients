"use client"

import { useEffect, useState } from "react"
import { LandingRenderer } from "@/components/landing/registry"
import { getPreviewParentOrigin } from "@/lib/landing/api"
import { isPublicLandingPage, LANDING_PREVIEW_MESSAGE, type PublicLandingPage } from "@/lib/landing/types"

/** Renders draft content posted by the Smile Connect admin editor; drafts never touch a public API. */
export function LandingPreview() {
  const [page, setPage] = useState<PublicLandingPage | null>(null)

  useEffect(() => {
    const parentOrigin = getPreviewParentOrigin()
    if (!parentOrigin || window.parent === window) return

    const handler = (event: MessageEvent) => {
      if (event.origin !== parentOrigin || event.source !== window.parent) return
      if (event.data?.type !== LANDING_PREVIEW_MESSAGE || !isPublicLandingPage(event.data.page)) return
      setPage(event.data.page)
    }
    window.addEventListener("message", handler)
    window.parent.postMessage({ type: `${LANDING_PREVIEW_MESSAGE}:ready` }, parentOrigin)
    return () => window.removeEventListener("message", handler)
  }, [])

  if (!page) {
    return <p className="p-8 text-center text-sm text-slate-500">Cargando vista previa…</p>
  }

  return (
    <div
      onClickCapture={(event) => {
        if ((event.target as HTMLElement).closest("a")) event.preventDefault()
      }}
    >
      <LandingRenderer page={page} />
    </div>
  )
}
