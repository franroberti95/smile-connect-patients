"use client"

import { useCallback, useEffect, useState } from "react"
import { ExternalLink, FileText, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { getIdToken } from "@/lib/firebase"

interface PatientFile {
  file_id: number
  file_name: string
  file_display_name: string | null
  details: string | null
  file_type: string | null
  size: number | null
  patient_file_type: string | null
  created_at: string | null
  folder: string | null
}

interface PatientRecipe {
  recipeId: number
  type: string
  createdAt: string
  diagnosis: string | null
  date: string | null
  medications: Array<{ name: string | null }>
  pdfUrl: string | null
  verificationUrl: string | null
}

interface PatientPortalContentProps {
  clinicId: number
  allowFiles: boolean
  allowRecipes: boolean
}

function formatDate(value: string | null) {
  if (!value) return "Sin fecha"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("es-AR")
}

function formatSize(bytes: number | null) {
  if (!bytes) return null
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function PatientPortalContent({ clinicId, allowFiles, allowRecipes }: PatientPortalContentProps) {
  const [files, setFiles] = useState<PatientFile[]>([])
  const [recipes, setRecipes] = useState<PatientRecipe[]>([])
  const [filesLoading, setFilesLoading] = useState(allowFiles)
  const [recipesLoading, setRecipesLoading] = useState(allowRecipes)
  const [openingFileId, setOpeningFileId] = useState<number | null>(null)

  useEffect(() => {
    if (!allowFiles && !allowRecipes) return
    let cancelled = false

    const load = async () => {
      const idToken = await getIdToken()
      if (!idToken || cancelled) {
        if (!cancelled) {
          setFilesLoading(false)
          setRecipesLoading(false)
        }
        return
      }

      await Promise.all([
        allowFiles
          ? api<{ files: PatientFile[] }>(`/api/public/patient/files?clinicId=${clinicId}`, {
              headers: { Authorization: `Bearer ${idToken}` },
            })
              .then((response) => {
                if (!cancelled) setFiles(response.files || [])
              })
              .finally(() => {
                if (!cancelled) setFilesLoading(false)
              })
          : Promise.resolve(),
        allowRecipes
          ? api<{ recipes: PatientRecipe[] }>(`/api/public/patient/recipes?clinicId=${clinicId}`, {
              headers: { Authorization: `Bearer ${idToken}` },
            })
              .then((response) => {
                if (!cancelled) setRecipes(response.recipes || [])
              })
              .finally(() => {
                if (!cancelled) setRecipesLoading(false)
              })
          : Promise.resolve(),
      ])
    }

    void load().catch(() => {
      if (!cancelled) {
        setFilesLoading(false)
        setRecipesLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [allowFiles, allowRecipes, clinicId])

  const openFile = useCallback(async (fileId: number) => {
    setOpeningFileId(fileId)
    try {
      const idToken = await getIdToken()
      if (!idToken) return
      const response = await api<{ url: string }>(
        `/api/public/patient/files/${fileId}?clinicId=${clinicId}`,
        { headers: { Authorization: `Bearer ${idToken}` } }
      )
      window.open(response.url, "_blank", "noopener,noreferrer")
    } finally {
      setOpeningFileId(null)
    }
  }, [clinicId])

  return (
    <>
      {allowFiles && (
        <Card>
          <CardHeader>
            <CardTitle>Mis archivos</CardTitle>
            <CardDescription>Documentos e imágenes compartidos por la clínica.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filesLoading ? (
              <p className="text-sm text-muted-foreground">Cargando archivos...</p>
            ) : files.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tenés archivos disponibles.</p>
            ) : (
              files.map((file) => (
                <div key={file.file_id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <FolderOpen className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{file.file_display_name || file.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[formatDate(file.created_at), formatSize(file.size)].filter(Boolean).join(" · ")}
                      </p>
                      {file.details && <p className="mt-1 text-xs text-muted-foreground">{file.details}</p>}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={openingFileId === file.file_id}
                    onClick={() => void openFile(file.file_id)}
                  >
                    {openingFileId === file.file_id ? "Abriendo..." : "Ver"}
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {allowRecipes && (
        <Card>
          <CardHeader>
            <CardTitle>Mis recetas</CardTitle>
            <CardDescription>Recetas emitidas por tus profesionales.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recipesLoading ? (
              <p className="text-sm text-muted-foreground">Cargando recetas...</p>
            ) : recipes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tenés recetas disponibles.</p>
            ) : (
              recipes.map((recipe) => (
                <div key={recipe.recipeId} className="flex items-start justify-between gap-4 rounded-lg border p-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{recipe.diagnosis || "Receta médica"}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(recipe.date || recipe.createdAt)}</p>
                      {recipe.medications.length > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {recipe.medications.map((medication) => medication.name).filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                  {recipe.pdfUrl && (
                    <Button asChild variant="outline" size="sm">
                      <a href={recipe.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Ver PDF
                      </a>
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}
