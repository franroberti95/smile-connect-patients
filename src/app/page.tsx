"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"

export default function Home() {
  const { user, loading } = useAuth()

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Smile Connect - Pacientes</CardTitle>
          <CardDescription>
            Portal para pacientes: reservá turnos, consultá tus pagos y accedé a tu historia.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tu clínica comparte un link único para que reserves directamente.
          </p>
          {loading ? (
            <div className="flex justify-center py-2">
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </div>
          ) : user ? (
            <Button asChild className="w-full">
              <a href="/select-clinic">Elegir clínica</a>
            </Button>
          ) : (
            <Button asChild className="w-full">
              <a href="/login">Ingresar</a>
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
