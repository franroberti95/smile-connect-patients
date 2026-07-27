export function normalizeEmail(email: string): string {
  if (!email) return email

  const [localPart, domain] = email.toLowerCase().trim().split("@")
  if (!localPart || !domain) return email.toLowerCase().trim()

  const normalizedDomain = domain === "googlemail.com" ? "gmail.com" : domain

  if (normalizedDomain === "gmail.com") {
    const withoutDots = localPart.replace(/\./g, "")
    const withoutPlus = withoutDots.split("+")[0]
    return `${withoutPlus}@${normalizedDomain}`
  }

  return `${localPart}@${normalizedDomain}`
}
