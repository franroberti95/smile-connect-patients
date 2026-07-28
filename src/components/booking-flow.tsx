"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api, ApiError } from "@/lib/api"
import { useAuth } from "./auth-provider"

export interface BookableProduct {
  productId: number
  name: string
  procedureName: string
  amount: number
  currencyId: number
  durationMinutes: number
  professionalIds: number[]
  professionalChoiceMode: "automatic" | "patient"
  boxSelectionMode: "automatic" | "specific"
  boxIds: number[]
}

export interface ClinicProfessional {
  professionalId: number
  name: string
  surname: string
}

interface BookingFlowProps {
  slug: string
  products: BookableProduct[]
  professionals: ClinicProfessional[]
  timezone: string
}

const currencyCodeById: Record<number, string> = {
  1: "ARS",
  2: "USD",
  3: "EUR",
  4: "CLP",
  5: "UYU",
  6: "MXN",
  7: "COP",
  8: "PEN",
  9: "BRL",
  10: "GTQ",
}

function formatDateLabel(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: timezone,
  }).format(date)
}

function formatTimeLabel(iso: string, timezone: string) {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(iso))
}

function toTimezoneDateString(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone,
  })
  return formatter.format(date)
}

export function BookingFlow({ slug, products, professionals, timezone }: BookingFlowProps) {
  const { user } = useAuth()
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })
  const [slots, setSlots] = useState<Array<{ start: string; end: string; professionalId: number; professionalName: string; professionalSurname: string }>>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string; professionalId: number } | null>(null)
  const [patientName, setPatientName] = useState("")
  const [patientSurname, setPatientSurname] = useState("")
  const [patientPhone, setPatientPhone] = useState("")
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  const selectedProduct = useMemo(
    () => products.find((p) => p.productId === selectedProductId),
    [products, selectedProductId]
  )

  const availableProfessionals = useMemo(() => {
    if (!selectedProduct) return []
    const ids =
      selectedProduct.professionalIds.length > 0
        ? selectedProduct.professionalIds
        : professionals.map((p) => p.professionalId)
    return professionals.filter((p) => ids.includes(p.professionalId))
  }, [selectedProduct, professionals])

  const formatAmount = (amount: number, currencyId: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currencyCodeById[currencyId] || "ARS",
    }).format(amount)

  const loadSlots = async (date: Date, product: BookableProduct, professionalId?: number) => {
    setSlotsLoading(true)
    setSlotsError(null)
    setSlots([])
    try {
      const params = new URLSearchParams({
        slug,
        productId: String(product.productId),
        date: toTimezoneDateString(date, timezone),
      })
      if (professionalId) params.set("professionalId", String(professionalId))
      const data = await api<{ slots: Array<{ start: string; end: string; professionalId: number; professionalName: string; professionalSurname: string }> }>(
        `/api/public/appointments/availability?${params.toString()}`
      )
      setSlots(data.slots)
    } catch (error) {
      setSlotsError(error instanceof ApiError ? error.message : "No pudimos cargar los horarios")
    } finally {
      setSlotsLoading(false)
    }
  }

  const handleProductSelect = (productId: number) => {
    setSelectedProductId(productId)
    setSelectedProfessionalId(null)
    setSelectedSlot(null)
    setSlots([])
    setBookingSuccess(false)
    setBookingError(null)
  }

  useEffect(() => {
    if (!selectedProduct) return
    if (selectedProduct.professionalChoiceMode === "patient" && !selectedProfessionalId) return
    loadSlots(selectedDate, selectedProduct, selectedProfessionalId ?? undefined)
  }, [selectedProduct, selectedProfessionalId, selectedDate])

  const handleProfessionalSelect = (professionalId: number | null) => {
    setSelectedProfessionalId(professionalId)
    setSelectedSlot(null)
    if (selectedProduct) {
      loadSlots(selectedDate, selectedProduct, professionalId ?? undefined)
    }
  }

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
    setSelectedSlot(null)
    if (selectedProduct) {
      loadSlots(date, selectedProduct, selectedProfessionalId ?? undefined)
    }
  }

  const handleBook = async () => {
    if (!selectedProduct || !selectedSlot || !user) return
    if (!patientName.trim() || !patientSurname.trim()) {
      setBookingError("Completá nombre y apellido")
      return
    }
    setBookingLoading(true)
    setBookingError(null)
    try {
      const idToken = await user.getIdToken()
      await api(
        "/api/public/appointments",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
          body: {
            slug,
            productId: selectedProduct.productId,
            start: selectedSlot.start,
            professionalId: selectedProduct.professionalChoiceMode === "patient" ? selectedSlot.professionalId : undefined,
            patient: {
              name: patientName.trim(),
              surname: patientSurname.trim(),
              phoneNumber: patientPhone.trim(),
            },
          },
        }
      )
      setBookingSuccess(true)
    } catch (error) {
      setBookingError(error instanceof ApiError ? error.message : "No pudimos reservar el turno")
    } finally {
      setBookingLoading(false)
    }
  }

  if (bookingSuccess) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6 text-center space-y-3">
          <p className="font-semibold">¡Turno reservado!</p>
          <p className="text-sm text-muted-foreground">
            Te enviaremos la confirmación por correo o WhatsApp.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setBookingSuccess(false)
              setSelectedProductId(null)
              setSelectedProfessionalId(null)
              setSelectedSlot(null)
              setSlots([])
            }}
          >
            Reservar otro turno
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="font-semibold">Elegí el servicio</h2>
        <div className="space-y-2">
          {products.map((product) => (
            <button
              key={product.productId}
              type="button"
              onClick={() => handleProductSelect(product.productId)}
              className={`w-full rounded-lg border p-4 text-left transition-colors ${
                selectedProductId === product.productId
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.procedureName}</p>
                </div>
                <p className="font-medium">{formatAmount(product.amount, product.currencyId)}</p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Duración estimada: {product.durationMinutes} min
              </p>
            </button>
          ))}
        </div>
      </div>

      {selectedProduct && selectedProduct.professionalChoiceMode === "patient" && availableProfessionals.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Elegí el profesional</h2>
          <div className="space-y-2">
            {availableProfessionals.map((professional) => (
              <button
                key={professional.professionalId}
                type="button"
                onClick={() => handleProfessionalSelect(professional.professionalId)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedProfessionalId === professional.professionalId
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
              >
                {professional.surname}, {professional.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedProduct && (selectedProduct.professionalChoiceMode !== "patient" || selectedProfessionalId !== null) && (
        <div className="space-y-3">
          <h2 className="font-semibold">Elegí el día</h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const prev = new Date(selectedDate)
                prev.setDate(prev.getDate() - 1)
                handleDateChange(prev)
              }}
            >
              ←
            </Button>
            <span className="flex-1 text-center text-sm font-medium">
              {formatDateLabel(selectedDate, timezone)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const next = new Date(selectedDate)
                next.setDate(next.getDate() + 1)
                handleDateChange(next)
              }}
            >
              →
            </Button>
          </div>

          {slotsLoading ? (
            <p className="text-sm text-muted-foreground">Cargando horarios...</p>
          ) : slotsError ? (
            <p className="text-sm text-destructive">{slotsError}</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay horarios disponibles para este día.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.start}
                  type="button"
                  onClick={() => setSelectedSlot({ start: slot.start, end: slot.end, professionalId: slot.professionalId })}
                  className={`rounded-md border p-2 text-center text-sm transition-colors ${
                    selectedSlot?.start === slot.start
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                >
                  {formatTimeLabel(slot.start, timezone)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedSlot && (
        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="font-semibold">Tus datos</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="patient-name">Nombre</Label>
              <Input
                id="patient-name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Juan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-surname">Apellido</Label>
              <Input
                id="patient-surname"
                value={patientSurname}
                onChange={(e) => setPatientSurname(e.target.value)}
                placeholder="Pérez"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="patient-phone">Teléfono</Label>
            <Input
              id="patient-phone"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              placeholder="+54 9 11 1234 5678"
            />
          </div>
          {bookingError && <p className="text-sm text-destructive">{bookingError}</p>}
          <Button
            type="button"
            className="w-full"
            disabled={bookingLoading}
            onClick={handleBook}
          >
            {bookingLoading ? "Reservando..." : "Confirmar reserva"}
          </Button>
        </div>
      )}
    </div>
  )
}
