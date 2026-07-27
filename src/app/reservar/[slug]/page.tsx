import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { BookingProductSelector, type BookableProduct } from "@/components/booking-product-selector"

interface ClinicBySlugResponse {
  clinicId: number
  name: string
  slug: string
  logoUrl: string | null
  booking: {
    enabled: boolean
    appointmentPrice?: number
    paymentMode?: "full" | "deposit"
    depositPercentage?: number
    bookingConfirmationMessage?: string
    cancellationPolicy?: string
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
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Turnos online desactivados</CardTitle>
            <CardDescription>
              {clinic.name} no tiene la reserva online activa por el momento.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Reservar turno</CardTitle>
          <CardDescription>
            Clínica: <span className="font-medium">{clinic.name}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clinic.booking.products.length > 0 ? (
            <BookingProductSelector products={clinic.booking.products} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Esta clínica todavía no configuró servicios para reserva online.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
