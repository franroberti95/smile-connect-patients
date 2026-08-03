"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth, type PatientClinic } from "@/components/auth-provider"
import { api } from "@/lib/api"
import { getIdToken } from "@/lib/firebase"

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading, selectedClinic, selectClinic, logout } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    } else if (!loading && (!selectedClinic || selectedClinic.status !== "active")) {
      router.replace("/select-clinic")
    }
  }, [loading, router, selectedClinic, user])

  // Refresh the cached clinic (slug, logo, etc. may have changed since it was stored).
  useEffect(() => {
    if (!selectedClinic) return

    const refreshClinic = async () => {
      try {
        const idToken = await getIdToken()
        if (!idToken) return

        const response = await api<{ clinics: PatientClinic[] }>("/api/public/patient/clinics", {
          headers: { Authorization: `Bearer ${idToken}` },
        })
        const fresh = response.clinics.find((c) => c.clinicId === selectedClinic.clinicId)
        if (!fresh) {
          router.replace("/select-clinic")
          return
        }
        if (fresh.status !== "active") {
          selectClinic(fresh)
          router.replace("/select-clinic")
          return
        }
        if (JSON.stringify(fresh) !== JSON.stringify(selectedClinic)) {
          selectClinic(fresh)
        }
      } catch {
        // Ignore refresh errors; keep using the cached clinic.
      }
    }

    void refreshClinic()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClinic?.clinicId])

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </main>
    )
  }

  if (!user || !selectedClinic) return null

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  return (
    <main className="flex flex-1 flex-col p-6">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Portal del Paciente</h1>
            <p className="text-muted-foreground text-sm">
              {selectedClinic.name} · {user.email}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mis turnos</CardTitle>
            <CardDescription>
              Próximamente: turnos agendados y solicitudes de reserva.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No tenés turnos próximos.</p>
            {selectedClinic?.slug && (
              <Button
                className="mt-4"
                onClick={() => router.push(`/reservar/${selectedClinic.slug}`)}
              >
                Reservar turno
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagos</CardTitle>
            <CardDescription>
              Próximamente: resumen de pagos pendientes y facturas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No tenés pagos pendientes.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
