"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { getIdToken } from "@/lib/firebase"
import type { PatientClinic } from "./auth-provider"

interface PatientRegistrationFormProps {
  clinic: PatientClinic
  userEmail: string
  onRegistered: () => void
  onCancel: () => void
}

interface RegistrationFormData {
  name: string
  surname: string
  id_number: string
  phone_country_code: string
  phone_number: string
  birth_day: string
  address: string
  sex: string
  medical_insurance_name: string
  medical_insurance_plan: string
  medical_insurance_number: string
}

const REQUIRED_ERROR = "Este campo es obligatorio"

export function PatientRegistrationForm({ clinic, userEmail, onRegistered, onCancel }: PatientRegistrationFormProps) {
  const [form, setForm] = useState<RegistrationFormData>({
    name: "",
    surname: "",
    id_number: "",
    phone_country_code: "54",
    phone_number: "",
    birth_day: "",
    address: "",
    sex: "",
    medical_insurance_name: "",
    medical_insurance_plan: "",
    medical_insurance_number: "",
  })
  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationFormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const updateField = (field: keyof RegistrationFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setSubmitError(null)
  }

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof RegistrationFormData, string>> = {}
    if (!form.name.trim()) nextErrors.name = REQUIRED_ERROR
    if (!form.surname.trim()) nextErrors.surname = REQUIRED_ERROR
    if (!form.phone_number.trim()) nextErrors.phone_number = REQUIRED_ERROR
    if (!form.id_number.trim()) nextErrors.id_number = REQUIRED_ERROR
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    setLoading(true)
    setSubmitError(null)

    try {
      const idToken = await getIdToken()
      await api<{ patientId: number; alreadyRegistered?: boolean }>("/api/public/patient/clinics/register", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
        body: {
          clinicId: clinic.clinicId,
          name: form.name.trim(),
          surname: form.surname.trim(),
          id_number: form.id_number.trim() || null,
          phone_country_code: form.phone_country_code.trim() || null,
          phone_number: form.phone_number.trim() || null,
          birth_day: form.birth_day || null,
          address: form.address.trim() || null,
          sex: form.sex || null,
          medical_insurance_name: form.medical_insurance_name.trim() || null,
          medical_insurance_plan: form.medical_insurance_plan.trim() || null,
          medical_insurance_number: form.medical_insurance_number.trim() || null,
        },
      })
      onRegistered()
    } catch (error: any) {
      setSubmitError(error?.message || "No pudimos registrar tus datos. Intentá de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle className="text-xl">Completá tus datos</CardTitle>
        <CardDescription>
          Para acceder a {clinic.name} necesitamos que completes tu ficha de paciente. El email no se puede cambiar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={userEmail} disabled />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Juan"
                disabled={loading}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="surname">Apellido *</Label>
              <Input
                id="surname"
                value={form.surname}
                onChange={(e) => updateField("surname", e.target.value)}
                placeholder="Pérez"
                disabled={loading}
              />
              {errors.surname && <p className="text-sm text-destructive">{errors.surname}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="phone_country_code">Código país</Label>
              <Input
                id="phone_country_code"
                value={form.phone_country_code}
                onChange={(e) => updateField("phone_country_code", e.target.value)}
                placeholder="54"
                disabled={loading}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="phone_number">Teléfono *</Label>
              <Input
                id="phone_number"
                value={form.phone_number}
                onChange={(e) => updateField("phone_number", e.target.value)}
                placeholder="9 11 1234 5678"
                disabled={loading}
              />
              {errors.phone_number && <p className="text-sm text-destructive">{errors.phone_number}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="id_number">DNI / Documento *</Label>
              <Input
                id="id_number"
                value={form.id_number}
                onChange={(e) => updateField("id_number", e.target.value)}
                placeholder="12345678"
                disabled={loading}
              />
              {errors.id_number && <p className="text-sm text-destructive">{errors.id_number}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_day">Fecha de nacimiento</Label>
              <Input
                id="birth_day"
                type="date"
                value={form.birth_day}
                onChange={(e) => updateField("birth_day", e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sex">Sexo</Label>
            <select
              id="sex"
              value={form.sex}
              onChange={(e) => updateField("sex", e.target.value)}
              disabled={loading}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Seleccionar</option>
              <option value="male">Masculino</option>
              <option value="female">Femenino</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="Av. Siempre Viva 123"
              disabled={loading}
            />
          </div>

          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium">Obra social (opcional)</p>
            <div className="space-y-2">
              <Label htmlFor="medical_insurance_name">Nombre</Label>
              <Input
                id="medical_insurance_name"
                value={form.medical_insurance_name}
                onChange={(e) => updateField("medical_insurance_name", e.target.value)}
                placeholder="OSDE"
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="medical_insurance_plan">Plan</Label>
                <Input
                  id="medical_insurance_plan"
                  value={form.medical_insurance_plan}
                  onChange={(e) => updateField("medical_insurance_plan", e.target.value)}
                  placeholder="210"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medical_insurance_number">Número de afiliado</Label>
                <Input
                  id="medical_insurance_number"
                  value={form.medical_insurance_number}
                  onChange={(e) => updateField("medical_insurance_number", e.target.value)}
                  placeholder="123456789"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Volver
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading && (
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Completar registro
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
