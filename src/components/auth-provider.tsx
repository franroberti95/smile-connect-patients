"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth, loginWithEmail, loginWithGoogle, registerWithEmail, logout } from "@/lib/firebase"

export interface PatientClinic {
  clinicId: number
  name: string
  logoUrl: string | null
  slug: string | null
  status: "active" | "registration_required" | "pending_approval"
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  selectedClinic: PatientClinic | null
  selectClinic: (clinic: PatientClinic) => void
  loginWithEmail: (email: string, password: string) => Promise<User>
  loginWithGoogle: () => Promise<User>
  registerWithEmail: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedClinic, setSelectedClinic] = useState<PatientClinic | null>(null)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setSelectedClinic(null)

      if (currentUser) {
        const storedClinic = window.localStorage.getItem(`patient-clinic:${currentUser.uid}`)
        if (storedClinic) {
          try {
            setSelectedClinic(JSON.parse(storedClinic) as PatientClinic)
          } catch {
            window.localStorage.removeItem(`patient-clinic:${currentUser.uid}`)
          }
        }
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const selectClinic = (clinic: PatientClinic) => {
    setSelectedClinic(clinic)
    if (user) {
      window.localStorage.setItem(`patient-clinic:${user.uid}`, JSON.stringify(clinic))
    }
  }

  const value: AuthContextValue = {
    user,
    loading,
    selectedClinic,
    selectClinic,
    loginWithEmail,
    loginWithGoogle,
    registerWithEmail,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
