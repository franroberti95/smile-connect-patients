import type { LandingAction, LandingService, PublicLandingPage } from "./types"

const copy = {
  es: {
    booking: "Reservar turno",
    external: "Reservar turno",
    whatsapp: "Escribinos por WhatsApp",
    phone: "Llamar a la clínica",
    services: "Servicios",
    servicesIntro: "Precios y duraciones actualizados.",
    team: "Nuestro equipo",
    faq: "Preguntas frecuentes",
    location: "Cómo llegar",
    contact: "Contacto",
    openMap: "Ver en el mapa",
    email: "Email",
    privacy: "Política de privacidad",
    poweredBy: "Turnos con Smile Connect",
    minutes: "min",
    bookThis: "Reservar",
    signInNote: "Para reservar online vas a iniciar sesión y completar tu teléfono y documento.",
    fullPayment: "El turno se abona online al reservar.",
    deposit: (pct: number) => `Al reservar se abona una seña del ${pct}%.`,
    existingOnly: "La reserva online es solo para pacientes de la clínica. Si es tu primera visita, contactanos.",
    noOnlineBooking: "Contactanos para coordinar tu turno.",
    whyUs: "Por qué elegirnos",
    previewWaiting: "Esperando la vista previa…",
  },
  en: {
    booking: "Book an appointment",
    external: "Book an appointment",
    whatsapp: "Message us on WhatsApp",
    phone: "Call the clinic",
    services: "Services",
    servicesIntro: "Up-to-date prices and durations.",
    team: "Our team",
    faq: "Frequently asked questions",
    location: "Getting here",
    contact: "Contact",
    openMap: "Open in maps",
    email: "Email",
    privacy: "Privacy policy",
    poweredBy: "Bookings by Smile Connect",
    minutes: "min",
    bookThis: "Book",
    signInNote: "To book online you'll sign in and add your phone number and ID.",
    fullPayment: "The appointment is paid online when booking.",
    deposit: (pct: number) => `A ${pct}% deposit is paid when booking.`,
    existingOnly: "Online booking is for existing patients. If this is your first visit, please contact us.",
    noOnlineBooking: "Contact us to arrange your appointment.",
    whyUs: "Why patients choose us",
    previewWaiting: "Waiting for preview…",
  },
} as const

export type LandingCopy = (typeof copy)["es"] | (typeof copy)["en"]

export function getLandingCopy(locale: PublicLandingPage["locale"]): LandingCopy {
  return copy[locale] ?? copy.es
}

export function actionLabel(action: LandingAction, t: LandingCopy) {
  return action.label || t[action.kind]
}

export function isExternalAction(action: LandingAction) {
  return action.kind === "external" || action.kind === "whatsapp"
}

export function formatPrice(service: LandingService, locale: PublicLandingPage["locale"]) {
  if (!service.amount) return null
  try {
    return new Intl.NumberFormat(locale === "en" ? "en-US" : "es-AR", {
      style: "currency",
      currency: service.currencyCode,
      maximumFractionDigits: 0,
    }).format(service.amount)
  } catch {
    return `${service.currencyCode} ${service.amount}`
  }
}

export function bookingNotes(page: PublicLandingPage, t: LandingCopy): string[] {
  if (page.primaryAction?.kind !== "booking" || !page.booking) {
    return page.primaryAction ? [t.noOnlineBooking] : []
  }
  const notes: string[] = [t.signInNote]
  if (page.booking.paymentMode === "deposit" && page.booking.depositPercentage) {
    notes.push(t.deposit(page.booking.depositPercentage))
  } else {
    notes.push(t.fullPayment)
  }
  return notes
}
