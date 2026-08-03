"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth, type PatientClinic } from "@/components/auth-provider"
import { api } from "@/lib/api"
import { getIdToken } from "@/lib/firebase"
import { toast } from "sonner"
import { PatientRegistrationForm } from "@/components/patient-registration-form"

interface ClinicsResponse {
  clinics: PatientClinic[]
}

export default function SelectClinicPage() {
  const router = useRouter()
  const { user, loading, selectClinic } = useAuth()
  const [clinics, setClinics] = useState<PatientClinic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSelecting, setIsSelecting] = useState<number | null>(null)
  const [registeringClinic, setRegisteringClinic] = useState<PatientClinic | null>(null)

  const loadClinics = useCallback(async (): Promise<PatientClinic[]> => {
    if (!user) return []
    try {
      const idToken = await getIdToken()
      if (!idToken) {
        router.replace("/login")
        return []
      }

      const response = await api<ClinicsResponse>("/api/public/patient/clinics", {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      setClinics(response.clinics)
      return response.clinics
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "No pudimos cargar tus clínicas.")
      return []
    } finally {
      setIsLoading(false)
    }
  }, [router, user])

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/login")
      return
    }

    void loadClinics()
  }, [loading, router, user, loadClinics])

  const handleSelect = (clinic: PatientClinic) => {
    if (clinic.status === "registration_required") {
      setRegisteringClinic(clinic)
      return
    }

    setIsSelecting(clinic.clinicId)
    selectClinic(clinic)
    router.push("/dashboard")
  }

  const handleRegistered = async () => {
    if (!registeringClinic) return

    setIsLoading(true)
    setRegisteringClinic(null)
    const refreshedClinics = await loadClinics()

    const refreshedClinic = refreshedClinics.find((c) => c.clinicId === registeringClinic.clinicId)
    if (refreshedClinic?.status === "active") {
      selectClinic(refreshedClinic)
      router.push("/dashboard")
    }
  }

  if (loading || isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </main>
    )
  }

  if (registeringClinic && user?.email) {
    return (
      <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-sky-50 via-white to-teal-50 p-6 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <PatientRegistrationForm
          clinic={registeringClinic}
          userEmail={user.email}
          onRegistered={handleRegistered}
          onCancel={() => setRegisteringClinic(null)}
        />
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
                <div className="flex-1">
                  <p className="font-medium">{clinic.name}</p>
                  {clinic.status === "registration_required" && (
                    <p className="text-xs text-muted-foreground">Completar datos para acceder</p>
                  )}
                </div>
                {isSelecting === clinic.clinicId ? (
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : clinic.status === "registration_required" ? (
                  <span className="text-sm font-medium text-primary">Registrarme</span>
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
