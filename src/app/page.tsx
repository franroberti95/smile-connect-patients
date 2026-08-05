"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

export default function Home() {
  const router = useRouter()
  const { user, loading, selectedClinic } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/login")
    } else if (!selectedClinic || selectedClinic.status !== "active") {
      router.replace("/select-clinic")
    } else {
      router.replace("/dashboard")
    }
  }, [loading, router, selectedClinic, user])

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6">
      <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
    </main>
  )
}
