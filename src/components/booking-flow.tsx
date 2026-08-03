"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Stethoscope,
  User,
} from "lucide-react"
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
  paymentMode: "full" | "deposit"
  depositPercentage?: number
  feePayer: "clinic" | "patient"
  feePercentage: number
  mpPublicKey: string
}

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: Record<string, unknown>) => {
      bricks: () => {
        create: (
          brickType: string,
          containerId: string,
          settings: Record<string, unknown>
        ) => Promise<{ unmount: () => void }>
      }
    }
  }
}

interface PaymentBrickFormData {
  token?: string
  payment_method_id: string
  issuer_id?: string
  installments?: number
  payer?: { email?: string }
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

export function BookingFlow({
  slug,
  products,
  professionals,
  timezone,
  paymentMode,
  depositPercentage,
  feePayer,
  feePercentage,
  mpPublicKey,
}: BookingFlowProps) {
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
  const [bookingPending, setBookingPending] = useState(false)
  const [showPaymentBrick, setShowPaymentBrick] = useState(false)
  const [mpSdkReady, setMpSdkReady] = useState(false)
  const paymentBrickContainerRef = useRef<HTMLDivElement>(null)
  const paymentBrickControllerRef = useRef<{ unmount: () => void } | null>(null)

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

  const pricing = useMemo(() => {
    if (!selectedProduct) return null
    const baseAmount =
      paymentMode === "deposit" && depositPercentage
        ? Math.round(selectedProduct.amount * (depositPercentage / 100) * 100) / 100
        : selectedProduct.amount
    const feeAmount = Math.round(baseAmount * (feePercentage / 100) * 100) / 100
    const totalToPay = feePayer === "patient" ? Math.round((baseAmount + feeAmount) * 100) / 100 : baseAmount
    return { baseAmount, feeAmount, totalToPay }
  }, [selectedProduct, paymentMode, depositPercentage, feePayer, feePercentage])

  useEffect(() => {
    if (window.MercadoPago) {
      setMpSdkReady(true)
      return
    }
    const script = document.createElement("script")
    script.src = "https://sdk.mercadopago.com/js/v2"
    script.async = true
    script.onload = () => setMpSdkReady(true)
    document.body.appendChild(script)
  }, [])

  useEffect(() => {
    if (!showPaymentBrick || !mpSdkReady || !pricing || !user?.email) return
    if (!window.MercadoPago || !paymentBrickContainerRef.current) return

    let cancelled = false
    const mp = new window.MercadoPago(mpPublicKey, { locale: "es-AR" })

    mp.bricks()
      .create("payment", "payment-brick-container", {
        initialization: {
          amount: pricing.totalToPay,
          payer: { email: user.email, entityType: "individual" },
        },
        customization: {
          paymentMethods: {
            creditCard: "all",
            debitCard: "all",
            mercadoPago: "all",
          },
        },
        callbacks: {
          onReady: () => {},
          onError: (error: unknown) => {
            console.error("Payment brick error", error)
            setBookingError("No pudimos cargar el formulario de pago")
          },
          onSubmit: ({ formData }: { formData: PaymentBrickFormData }) =>
            handleBook(formData),
        },
      })
      .then((controller) => {
        if (cancelled) {
          controller.unmount()
          return
        }
        paymentBrickControllerRef.current = controller
      })

    return () => {
      cancelled = true
      paymentBrickControllerRef.current?.unmount()
      paymentBrickControllerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPaymentBrick, mpSdkReady, pricing?.totalToPay, user?.email])

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
    setShowPaymentBrick(false)
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

  const handleContinueToPayment = () => {
    if (!patientName.trim() || !patientSurname.trim()) {
      setBookingError("Completá nombre y apellido")
      return
    }
    setBookingError(null)
    setShowPaymentBrick(true)
  }

  const handleBook = async (formData: PaymentBrickFormData) => {
    if (!selectedProduct || !selectedSlot || !user) return
    setBookingLoading(true)
    setBookingError(null)
    try {
      const idToken = await user.getIdToken()
      const result = await api<{ paymentStatus?: string }>(
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
              email: user.email,
              phoneNumber: patientPhone.trim(),
            },
            payment: {
              token: formData.token,
              paymentMethodId: formData.payment_method_id,
              issuerId: formData.issuer_id,
              installments: formData.installments,
            },
          },
        }
      )
      if (result.paymentStatus === "in_process" || result.paymentStatus === "pending") {
        setBookingPending(true)
      } else {
        setBookingSuccess(true)
      }
    } catch (error) {
      setBookingError(error instanceof ApiError ? error.message : "No pudimos procesar el pago")
      setShowPaymentBrick(false)
      throw error
    } finally {
      setBookingLoading(false)
    }
  }

  const handleReset = () => {
    setBookingSuccess(false)
    setBookingPending(false)
    setSelectedProductId(null)
    setSelectedProfessionalId(null)
    setSelectedSlot(null)
    setSlots([])
    setShowPaymentBrick(false)
    setBookingError(null)
  }

  const steps = useMemo(() => {
    const base = [
      { id: "service", label: "Servicio", done: !!selectedProduct, active: true },
      ...(selectedProduct?.professionalChoiceMode === "patient"
        ? [{ id: "professional", label: "Profesional", done: !!selectedProfessionalId, active: !!selectedProduct }]
        : []),
      { id: "datetime", label: "Día y hora", done: !!selectedSlot, active: !!selectedProduct },
      { id: "payment", label: "Pago", done: bookingSuccess, active: !!selectedSlot },
    ]
    return base
  }, [selectedProduct, selectedProfessionalId, selectedSlot, bookingSuccess])

  if (bookingSuccess) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold">¡Turno reservado!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Te enviaremos la confirmación por correo o WhatsApp.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={handleReset}>
            Reservar otro turno
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (bookingPending) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold">Estamos confirmando tu pago</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tu turno quedará reservado apenas se confirme el pago. Te avisaremos por correo o WhatsApp.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={handleReset}>
            Volver al inicio
          </Button>
        </CardContent>
      </Card>
    )
  }

  const selectedProfessionalName = useMemo(() => {
    if (!selectedProduct) return null
    if (selectedProduct.professionalChoiceMode !== "patient") return "Automático"
    const professional = professionals.find((p) => p.professionalId === selectedProfessionalId)
    return professional ? `${professional.surname}, ${professional.name}` : null
  }, [selectedProduct, selectedProfessionalId, professionals])

  return (
    <div className="flex flex-col gap-6">
      {/* Stepper */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  step.done
                    ? "bg-primary text-primary-foreground"
                    : step.active
                      ? "border-2 border-primary text-primary"
                      : "border-2 border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {step.done ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={`hidden text-xs font-medium sm:inline ${
                  step.done || step.active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`ml-2 hidden h-px flex-1 sm:block ${
                    step.done ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* Service selection */}
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Elegí el servicio</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {products.map((product) => {
                const selected = selectedProductId === product.productId
                return (
                  <button
                    key={product.productId}
                    type="button"
                    onClick={() => handleProductSelect(product.productId)}
                    className={`relative rounded-xl border p-4 text-left transition-all ${
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "bg-background hover:border-primary/50 hover:shadow-sm"
                    }`}
                  >
                    {selected && (
                      <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <p className="font-medium pr-6">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.procedureName}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {product.durationMinutes} min
                      </span>
                      <span className="font-semibold text-primary">
                        {formatAmount(product.amount, product.currencyId)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Professional selection */}
          {selectedProduct && selectedProduct.professionalChoiceMode === "patient" && availableProfessionals.length > 0 && (
            <section className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Elegí el profesional</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableProfessionals.map((professional) => {
                  const selected = selectedProfessionalId === professional.professionalId
                  return (
                    <button
                      key={professional.professionalId}
                      type="button"
                      onClick={() => handleProfessionalSelect(professional.professionalId)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background hover:border-primary/50 hover:bg-muted"
                      }`}
                    >
                      {professional.surname}, {professional.name}
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {/* Date & time */}
          {selectedProduct && (selectedProduct.professionalChoiceMode !== "patient" || selectedProfessionalId !== null) && (
            <section className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Elegí el día y horario</h2>
              </div>

              <div className="mb-4 flex items-center justify-between rounded-lg border bg-background p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const prev = new Date(selectedDate)
                    prev.setDate(prev.getDate() - 1)
                    handleDateChange(prev)
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold sm:text-base">
                  {formatDateLabel(selectedDate, timezone)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const next = new Date(selectedDate)
                    next.setDate(next.getDate() + 1)
                    handleDateChange(next)
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {slotsLoading ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Cargando horarios...
                </div>
              ) : slotsError ? (
                <p className="py-4 text-sm text-destructive">{slotsError}</p>
              ) : slots.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  No hay horarios disponibles para este día.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {slots.map((slot) => (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => {
                        setSelectedSlot({ start: slot.start, end: slot.end, professionalId: slot.professionalId })
                        setShowPaymentBrick(false)
                      }}
                      className={`rounded-lg border py-2.5 text-center text-sm font-medium transition-all ${
                        selectedSlot?.start === slot.start
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background hover:border-primary/50 hover:bg-muted"
                      }`}
                    >
                      {formatTimeLabel(slot.start, timezone)}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Patient data and payment */}
          {selectedSlot && (
            <section className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Tus datos y pago</h2>
              </div>

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
              <div className="mt-4 space-y-2">
                <Label htmlFor="patient-phone">Teléfono</Label>
                <Input
                  id="patient-phone"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="+54 9 11 1234 5678"
                />
              </div>

              {bookingError && (
                <p className="mt-4 text-sm text-destructive">{bookingError}</p>
              )}

              {!showPaymentBrick ? (
                <Button
                  type="button"
                  className="mt-5 w-full"
                  size="lg"
                  onClick={handleContinueToPayment}
                >
                  Continuar al pago
                </Button>
              ) : (
                <div className="mt-5 space-y-3">
                  {!mpSdkReady && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Cargando formulario de pago...
                    </div>
                  )}
                  <div id="payment-brick-container" ref={paymentBrickContainerRef} />
                  {bookingLoading && (
                    <p className="text-sm text-muted-foreground">Procesando pago y reservando turno...</p>
                  )}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Summary sidebar */}
        <aside className="h-fit rounded-xl border bg-card p-5 shadow-sm lg:sticky lg:top-6">
          <h3 className="font-semibold">Resumen de tu reserva</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Servicio</span>
              <span className="font-medium text-right max-w-[60%]">
                {selectedProduct?.name ?? "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Profesional</span>
              <span className="font-medium text-right max-w-[60%]">
                {selectedProfessionalName ?? "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Día y hora</span>
              <span className="font-medium text-right">
                {selectedSlot
                  ? `${formatDateLabel(new Date(selectedSlot.start), timezone)} · ${formatTimeLabel(selectedSlot.start, timezone)}`
                  : "—"}
              </span>
            </div>
          </div>

          {pricing && (
            <>
              <div className="my-4 h-px bg-border" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {paymentMode === "deposit" ? "Seña" : "Subtotal"}
                  </span>
                  <span>{formatAmount(pricing.baseAmount, selectedProduct!.currencyId)}</span>
                </div>
                {feePayer === "patient" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Comisión ({feePercentage}%)</span>
                    <span>{formatAmount(pricing.feeAmount, selectedProduct!.currencyId)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold">
                  <span>Total a pagar</span>
                  <span className="text-primary">
                    {formatAmount(pricing.totalToPay, selectedProduct!.currencyId)}
                  </span>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
