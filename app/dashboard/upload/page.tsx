'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, Image, FileSpreadsheet, X, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'

export default function UploadPage() {
  const [files, setFiles] = useState<Array<{
    file: File
    status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
    progress: number
    id?: string
    error?: string
  }>>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      status: 'pending' as const,
      progress: 0,
    }))
    setFiles((prev) => [...prev, ...newFiles])
    
    // Auto-upload
    newFiles.forEach((fileObj) => {
      uploadFile(fileObj.file)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: true,
  })

  const uploadFile = async (file: File) => {
    const fileId = Date.now().toString()
    setFiles((prev) =>
      prev.map((f) =>
        f.file === file ? { ...f, id: fileId, status: 'uploading', progress: 10 } : f
      )
    )

    try {
      const formData = new FormData()
      formData.append('file', file)

      setFiles((prev) =>
        prev.map((f) =>
          f.file === file ? { ...f, progress: 30 } : f
        )
      )

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload')
      }

      const data = await response.json()

      setFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? { ...f, status: 'processing', progress: 60, id: data.file.id }
            : f
        )
      )

      // Simuler le traitement (dans la vraie app, ce serait via une queue)
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.file === file
              ? { ...f, status: 'completed', progress: 100 }
              : f
          )
        )
        toast.success(`Fichier ${file.name} traité avec succès`)
      }, 2000)
    } catch (error: any) {
      setFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? { ...f, status: 'error', error: error.message }
            : f
        )
      )
      toast.error(`Erreur lors de l'upload de ${file.name}`)
    }
  }

  const removeFile = (file: File) => {
    setFiles((prev) => prev.filter((f) => f.file !== file))
  }

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') return <FileText className="w-5 h-5" />
    if (file.type.startsWith('image/')) return <Image className="w-5 h-5" />
    if (file.type.includes('spreadsheet') || file.type.includes('excel') || file.name.endsWith('.csv'))
      return <FileSpreadsheet className="w-5 h-5" />
    return <FileText className="w-5 h-5" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Importer des données</h1>
        <p className="text-muted-foreground">
          Importez vos factures, fichiers CSV ou Excel pour calculer automatiquement vos émissions carbone.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Glisser-déposer vos fichiers</CardTitle>
          <CardDescription>
            Formats supportés : PDF, images (PNG, JPG), CSV, Excel (XLS, XLSX)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              hover:border-primary hover:bg-primary/5
            `}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              {isDragActive ? 'Déposez vos fichiers ici' : 'Glissez vos fichiers ici ou cliquez pour sélectionner'}
            </p>
            <p className="text-sm text-muted-foreground">
              Formats acceptés : PDF, images, CSV, Excel
            </p>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fichiers en cours</CardTitle>
            <CardDescription>
              {files.filter((f) => f.status === 'completed').length} sur {files.length} traités
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((fileObj, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">{getFileIcon(fileObj.file)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{fileObj.file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {fileObj.status === 'uploading' || fileObj.status === 'processing' ? (
                      <Progress value={fileObj.progress} className="mt-2" />
                    ) : fileObj.status === 'completed' ? (
                      <div className="flex items-center gap-2 mt-2 text-sm text-accent">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Traîté avec succès</span>
                      </div>
                    ) : fileObj.status === 'error' ? (
                      <p className="text-sm text-destructive mt-2">{fileObj.error}</p>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(fileObj.file)}
                    disabled={fileObj.status === 'uploading' || fileObj.status === 'processing'}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}



