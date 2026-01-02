'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Calendar } from 'lucide-react'

async function fetchEmissions() {
  const res = await fetch('/api/emissions')
  if (!res.ok) throw new Error('Failed to fetch emissions')
  return res.json()
}

export default function EmissionsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['emissions'],
    queryFn: fetchEmissions,
  })

  const getScopeColor = (scope: string) => {
    switch (scope) {
      case 'SCOPE_1':
        return 'destructive'
      case 'SCOPE_2':
        return 'default'
      case 'SCOPE_3':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Émissions carbone</h1>
        <p className="text-muted-foreground">
          Liste détaillée de toutes vos émissions enregistrées.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des émissions</CardTitle>
          <CardDescription>
            Toutes les émissions calculées et enregistrées
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error || !data || data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune émission enregistrée pour le moment</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead className="text-right">Émissions (kg CO2e)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((emission: any) => (
                  <TableRow key={emission.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {new Date(emission.date).toLocaleDateString('fr-FR')}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{emission.description}</TableCell>
                    <TableCell>
                      <Badge variant={getScopeColor(emission.scope)}>
                        {emission.scope}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {emission.quantity.toLocaleString('fr-FR')} {emission.unit}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {emission.co2e.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}











