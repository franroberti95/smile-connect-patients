"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth, type PatientClinic } from "@/components/auth-provider"
import { api } from "@/lib/api"
import { getIdToken } from "@/lib/firebase"

interface PatientAppointment {
  appointmentId: number
  startDate: string
  endDate: string
  professionalName: string | null
  boxName: string | null
  clinicName: string
}

interface PendingReservation {
  externalReference: string
  startDate: string
  endDate: string
  initPoint: string | null
  expiresAt: string
  clinicName: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState("")

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) {
        setRemaining("Expirada")
        return
      }
      const mins = Math.floor(diff / 60_000)
      const secs = Math.floor((diff % 60_000) / 1000)
      setRemaining(`${mins}:${secs.toString().padStart(2, "0")}`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  return <span className="text-xs font-mono text-amber-600">{remaining}</span>
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading, selectedClinic, selectClinic, logout } = useAuth()
  const [appointments, setAppointments] = useState<PatientAppointment[]>([])
  const [pendingReservations, setPendingReservations] = useState<PendingReservation[]>([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(true)
  const [emailAmbiguous, setEmailAmbiguous] = useState(false)

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

  // Fetch patient appointments and pending reservations
  const fetchAppointments = useCallback(async () => {
    if (!selectedClinic?.slug) return
    try {
      const idToken = await getIdToken()
      if (!idToken) return

      const response = await api<{
        appointments: PatientAppointment[]
        pendingReservations: PendingReservation[]
        reservationMinutes: number
      }>(`/api/public/patient/appointments?slug=${selectedClinic.slug}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      })

      setAppointments(response.appointments || [])
      setPendingReservations(response.pendingReservations || [])
    } catch {
      // Silently fail — show empty state
    } finally {
      setAppointmentsLoading(false)
    }
  }, [selectedClinic?.slug])

  useEffect(() => {
    if (!loading && user && selectedClinic?.status === "active") {
      fetchAppointments()
    }
  }, [loading, user, selectedClinic, fetchAppointments])

  useEffect(() => {
    if (loading || !user || !selectedClinic?.slug || selectedClinic.status !== "active") return
    let cancelled = false
    getIdToken()
      .then((idToken) => {
        if (!idToken) return null
        return api<{ emailAmbiguous?: boolean }>(
          `/api/public/patient/me?slug=${encodeURIComponent(selectedClinic.slug!)}`,
          { headers: { Authorization: `Bearer ${idToken}` } }
        )
      })
      .then((data) => {
        if (cancelled || !data) return
        setEmailAmbiguous(data.emailAmbiguous ?? false)
      })
      .catch(() => {
        if (!cancelled) setEmailAmbiguous(false)
      })
    return () => {
      cancelled = true
    }
  }, [loading, user, selectedClinic])

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

  const hasUpcoming = appointments.length > 0 || pendingReservations.length > 0

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
            {!hasUpcoming && !appointmentsLoading && (
              <CardDescription>
                No tenés turnos próximos.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {appointmentsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Cargando turnos...
              </div>
            ) : (
              <>
                {/* Pending reservations (awaiting payment) */}
                {pendingReservations.map((res) => (
                  <div
                    key={res.externalReference}
                    className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {formatDate(res.startDate)} · {formatTime(res.startDate)} - {formatTime(res.endDate)}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-xs text-muted-foreground">Reserva pendiente de pago</span>
                        <CountdownTimer expiresAt={res.expiresAt} />
                      </div>
                    </div>
                    {res.initPoint && (
                      <Button
                        size="sm"
                        onClick={() => window.open(res.initPoint!, "_blank")}
                      >
                        Pagar
                      </Button>
                    )}
                  </div>
                ))}

                {/* Upcoming appointments */}
                {appointments
                  .filter((apt) => new Date(apt.endDate) > new Date())
                  .map((apt) => (
                    <div
                      key={apt.appointmentId}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">
                          {formatDate(apt.startDate)} · {formatTime(apt.startDate)} - {formatTime(apt.endDate)}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-xs text-muted-foreground">Confirmado</span>
                          {apt.professionalName && (
                            <span className="text-xs text-muted-foreground">· {apt.professionalName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                {/* Empty upcoming state */}
                {!hasUpcoming && (
                  <p className="text-sm text-muted-foreground">No tenés turnos próximos.</p>
                )}

                {/* Past appointments */}
                {appointments.filter((apt) => new Date(apt.endDate) <= new Date()).length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Anteriores</p>
                    {appointments
                      .filter((apt) => new Date(apt.endDate) <= new Date())
                      .map((apt) => (
                        <div
                          key={apt.appointmentId}
                          className="flex items-center justify-between rounded-lg border border-muted p-3 opacity-60"
                        >
                          <div className="space-y-0.5">
                            <p className="text-sm">
                              {formatDate(apt.startDate)} · {formatTime(apt.startDate)} - {formatTime(apt.endDate)}
                            </p>
                            <div className="flex items-center gap-2">
                              {apt.professionalName && (
                                <span className="text-xs text-muted-foreground">{apt.professionalName}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </>
            )}

            {selectedClinic?.slug && (
              emailAmbiguous ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  No podés reservar turnos online porque tu email está asociado a más de un paciente en esta
                  clínica. Contactá a la clínica para resolverlo.
                </p>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => router.push(`/reservar/${selectedClinic.slug}`)}
                >
                  Reservar turno
                </Button>
              )
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
