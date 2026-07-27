import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from "firebase/auth"
import { normalizeEmail } from "./utils/email"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app: FirebaseApp | undefined
let auth: Auth | undefined
let googleProvider: GoogleAuthProvider | undefined

if (typeof window !== "undefined" || process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig)
    auth = getAuth(app)

    googleProvider = new GoogleAuthProvider()
    googleProvider.setCustomParameters({ prompt: "select_account", scope: "email" })
  } catch (error) {
    console.warn("Firebase initialization failed:", error)
  }
}

export { auth, googleProvider }

export function getCurrentUser(): User | null {
  return auth?.currentUser ?? null
}

export async function getIdToken(): Promise<string | null> {
  const user = getCurrentUser()
  if (!user) return null
  return user.getIdToken()
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  if (!auth) throw new Error("Firebase is not initialized. Check your environment variables.")
  const normalizedEmail = normalizeEmail(email)
  try {
    const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password)
    return credential.user
  } catch (error: any) {
    // Fallback for existing users registered with dots in Firebase
    if (error.code === "auth/user-not-found" && normalizedEmail !== email.toLowerCase().trim()) {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      return credential.user
    }
    throw error
  }
}

export async function registerWithEmail(email: string, password: string): Promise<User> {
  if (!auth) throw new Error("Firebase is not initialized. Check your environment variables.")
  const normalizedEmail = normalizeEmail(email)
  const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password)
  return credential.user
}

export async function loginWithGoogle(): Promise<User> {
  if (!auth || !googleProvider) {
    throw new Error("Firebase is not initialized. Check your environment variables.")
  }
  const credential = await signInWithPopup(auth, googleProvider)
  return credential.user
}

export async function logout(): Promise<void> {
  if (!auth) return
  await signOut(auth)
}
