"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth, type PatientClinic } from "@/components/auth-provider"
import { api } from "@/lib/api"
import { getIdToken } from "@/lib/firebase"
import { toast } from "sonner"

interface ClinicsResponse {
  clinics: PatientClinic[]
}

export default function SelectClinicPage() {
  const router = useRouter()
  const { user, loading, selectClinic } = useAuth()
  const [clinics, setClinics] = useState<PatientClinic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSelecting, setIsSelecting] = useState<number | null>(null)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/login")
      return
    }

    const loadClinics = async () => {
      try {
        const idToken = await getIdToken()
        if (!idToken) {
          router.replace("/login")
          return
        }

        const response = await api<ClinicsResponse>("/api/public/patient/clinics", {
          headers: { Authorization: `Bearer ${idToken}` },
        })
        setClinics(response.clinics)
      } catch (error: any) {
        console.error(error)
        toast.error(error.message || "No pudimos cargar tus clínicas.")
      } finally {
        setIsLoading(false)
      }
    }

    void loadClinics()
  }, [loading, router, user])

  const handleSelect = (clinic: PatientClinic) => {
    setIsSelecting(clinic.clinicId)
    selectClinic(clinic)
    router.push("/dashboard")
  }

  if (loading || isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </main>
    )
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-sky-50 via-white to-teal-50 p-6 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Elegí una clínica</CardTitle>
          <CardDescription>
            Seleccioná la clínica a la que querés acceder como paciente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {clinics.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="font-medium">No encontramos clínicas disponibles</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Consultá con tu clínica si el acceso al portal está habilitado para tu email.
              </p>
            </div>
          ) : (
            clinics.map((clinic) => (
              <button
                key={clinic.clinicId}
                type="button"
                onClick={() => handleSelect(clinic)}
                disabled={isSelecting !== null}
                className="flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-semibold text-primary">
                  {clinic.logoUrl ? (
                    <img src={clinic.logoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    clinic.name.slice(0, 1).toUpperCase()
                  )}
                </div>
                <span className="flex-1 font-medium">{clinic.name}</span>
                {isSelecting === clinic.clinicId ? (
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <span className="text-sm text-muted-foreground">Ingresar</span>
                )}
              </button>
            ))
          )}
          <Button variant="ghost" className="w-full" onClick={() => router.push("/")}>
            Volver
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
