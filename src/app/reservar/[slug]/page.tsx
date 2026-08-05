import { Suspense } from "react"
import { notFound } from "next/navigation"
import { api } from "@/lib/api"
import { BookingFlow, type BookableProduct, type ClinicProfessional } from "@/components/booking-flow"

interface ClinicBySlugResponse {
  clinicId: number
  name: string
  slug: string
  logoUrl: string | null
  timezone: string
  calendarMinutesInterval: number
  professionals: ClinicProfessional[]
  booking: {
    enabled: boolean
    paymentMode?: "full" | "deposit"
    depositPercentage?: number
    bookingConfirmationMessage?: string
    cancellationPolicy?: string
    feePayer?: "clinic" | "patient"
    feePercentage?: number
    advanceBookingDays?: number
    mpPublicKey?: string | null
    products: BookableProduct[]
  }
}

interface BookingPageProps {
  params: Promise<{ slug: string }>
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug } = await params

  if (!slug) {
    notFound()
  }

  let clinic: ClinicBySlugResponse | undefined
  try {
    clinic = await api<ClinicBySlugResponse>(`/api/public/clinics/by-slug/${encodeURIComponent(slug)}`)
  } catch {
    notFound()
  }

  if (!clinic.booking?.enabled) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-xl border bg-background p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">Turnos online desactivados</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {clinic.name} no tiene la reserva online activa por el momento.
          </p>
        </div>
      </main>
    )
  }

  if (!clinic.booking.mpPublicKey) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-xl border bg-background p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">Pagos no disponibles</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {clinic.name} todavía no conectó una cuenta de Mercado Pago para recibir pagos online.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-full flex-col bg-background">
      <header className="border-b bg-background px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reserva online</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{clinic.name}</h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          {clinic.booking.products.length > 0 ? (
            <Suspense fallback={null}>
              <BookingFlow
                slug={clinic.slug}
                products={clinic.booking.products}
                professionals={clinic.professionals}
                timezone={clinic.timezone}
                paymentMode={clinic.booking.paymentMode ?? "full"}
                depositPercentage={clinic.booking.depositPercentage}
                feePayer={clinic.booking.feePayer ?? "clinic"}
                feePercentage={clinic.booking.feePercentage ?? 3}
                advanceBookingDays={clinic.booking.advanceBookingDays ?? 1}
              />
            </Suspense>
          ) : (
            <div className="rounded-xl border bg-background p-8 text-center shadow-sm">
              <p className="text-sm text-muted-foreground">
                Esta clínica todavía no configuró servicios para reserva online.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
