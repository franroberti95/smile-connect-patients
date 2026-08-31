"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"

const loginSchema = z.object({
  email: z.string().email("Ingresá un email válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

const registerSchema = loginSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

type LoginFormValues = z.infer<typeof loginSchema>
type RegisterFormValues = z.infer<typeof registerSchema>

function getPostLoginPath() {
  const next = new URLSearchParams(window.location.search).get("next")
  if (!next) return "/select-clinic"

  try {
    const url = new URL(next, window.location.origin)
    return url.origin === window.location.origin
      ? `${url.pathname}${url.search}${url.hash}`
      : "/select-clinic"
  } catch {
    return "/select-clinic"
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export default function LoginPage() {
  const router = useRouter()
  const { loginWithEmail, loginWithGoogle, registerWithEmail } = useAuth()
  const [view, setView] = useState<"login" | "register">("login")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  const onLogin = async (data: LoginFormValues) => {
    setIsLoading(true)
    try {
      await loginWithEmail(data.email, data.password)
      toast.success("¡Bienvenido!")
      router.push(getPostLoginPath())
    } catch (error: unknown) {
      console.error(error)
      toast.error(getErrorMessage(error, "No pudimos iniciar sesión. Intentalo de nuevo."))
    } finally {
      setIsLoading(false)
    }
  }

  const onRegister = async (data: RegisterFormValues) => {
    setIsLoading(true)
    try {
      await registerWithEmail(data.email, data.password)
      toast.success("¡Tu cuenta fue creada!")
      router.push(getPostLoginPath())
    } catch (error: unknown) {
      console.error(error)
      toast.error(getErrorMessage(error, "No pudimos crear tu cuenta. Intentalo de nuevo."))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    try {
      await loginWithGoogle()
      toast.success("¡Bienvenido!")
      router.push(getPostLoginPath())
    } catch (error: unknown) {
      console.error(error)
      toast.error(getErrorMessage(error, "No pudimos iniciar sesión con Google."))
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6 bg-gradient-to-br from-sky-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z" />
              <path d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
              <path d="M16 17a4 4 0 0 0-8 0" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Portal del Paciente</h1>
          <p className="text-muted-foreground text-sm">
            Accedé a tus turnos, pagos y tratamientos.
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>{view === "login" ? "Ingresar" : "Crear cuenta"}</CardTitle>
            <CardDescription>
              {view === "login"
                ? "Usá tu cuenta de Google o tu email y contraseña."
                : "Registrate con tu email y una contraseña."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {view === "login" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading || isLoading}
                >
                  {isGoogleLoading ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" />
                    </svg>
                  )}
                  Continuar con Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="h-px w-full bg-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">o</span>
                  </div>
                </div>

                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="tu@email.com" {...loginForm.register("email")} />
                    {loginForm.formState.errors.email && (
                      <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input id="login-password" type="password" placeholder="••••••" {...loginForm.register("password")} />
                    {loginForm.formState.errors.password && (
                      <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
                    Ingresar con email
                  </Button>
                </form>
                <p className="text-center text-sm text-muted-foreground">
                  ¿No tenés una cuenta?{" "}
                  <Button type="button" variant="link" className="h-auto p-0" onClick={() => setView("register")}>
                    Registrate
                  </Button>
                </p>
              </>
            ) : (
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input id="register-email" type="email" placeholder="tu@email.com" {...registerForm.register("email")} />
                  {registerForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Contraseña</Label>
                  <Input id="register-password" type="password" placeholder="••••••" {...registerForm.register("password")} />
                  {registerForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">Confirmar contraseña</Label>
                  <Input id="register-confirm-password" type="password" placeholder="••••••" {...registerForm.register("confirmPassword")} />
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
                  Crear cuenta
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  ¿Ya tenés una cuenta?{" "}
                  <Button type="button" variant="link" className="h-auto p-0" onClick={() => setView("login")}>
                    Ingresá
                  </Button>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
