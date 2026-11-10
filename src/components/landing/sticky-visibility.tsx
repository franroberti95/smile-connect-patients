"use client"

import { useEffect, useState, type ReactNode } from "react"
import { HERO_CTA_ATTRIBUTE } from "@/lib/landing/hero-cta"

/** Shows its children only while the hero call-to-action is off screen, so mobile never shows two booking buttons at once. */
export function WhenHeroCtaHidden({ children }: { children: ReactNode }) {
  const [heroVisible, setHeroVisible] = useState(true)

  useEffect(() => {
    const target = document.querySelector(`[${HERO_CTA_ATTRIBUTE}]`)
    if (!target) return
    const observer = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting))
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  return heroVisible ? null : <>{children}</>
}
