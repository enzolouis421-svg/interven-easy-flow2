'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Calendar } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

async function fetchReports() {
  const res = await fetch('/api/reports')
  if (!res.ok) throw new Error('Failed to fetch reports')
  return res.json()
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'CARBON_BALANCE' | 'ESG' | 'CSRD'>('CARBON_BALANCE')
  const [generating, setGenerating] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reports'],
    queryFn: fetchReports,
  })

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: reportType }),
      })

      if (!res.ok) throw new Error('Erreur lors de la génération')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rapport-${reportType.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      refetch()
    } catch (error) {
      console.error('Generate error:', error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Rapports</h1>
        <p className="text-muted-foreground">
          Générez vos bilans carbone, rapports ESG et CSRD.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Générer un nouveau rapport</CardTitle>
          <CardDescription>
            Sélectionnez le type de rapport à générer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CARBON_BALANCE">Bilan Carbone</SelectItem>
              <SelectItem value="ESG">Rapport ESG</SelectItem>
              <SelectItem value="CSRD">Rapport CSRD</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? 'Génération...' : 'Générer le rapport'}
            <FileText className="ml-2 w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rapports précédents</CardTitle>
          <CardDescription>
            Historique de vos rapports générés
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : data && data.length > 0 ? (
            <div className="space-y-4">
              {data.map((report: any) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{report.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {report.type} • {report.period}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                    {report.fileUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={report.fileUrl} download>
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun rapport généré pour le moment</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



