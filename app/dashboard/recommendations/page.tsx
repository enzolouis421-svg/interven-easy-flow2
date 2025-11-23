'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingDown, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'

async function fetchRecommendations() {
  const res = await fetch('/api/recommendations')
  if (!res.ok) throw new Error('Failed to fetch recommendations')
  return res.json()
}

export default function RecommendationsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['recommendations'],
    queryFn: fetchRecommendations,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Recommandations IA</h1>
          <p className="text-muted-foreground">
            Recevez des recommandations personnalisées pour réduire vos émissions carbone.
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {error ? 'Erreur lors du chargement' : 'Aucune recommandation disponible pour le moment.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'destructive'
      case 'HIGH':
        return 'destructive'
      case 'MEDIUM':
        return 'default'
      default:
        return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'IMPLEMENTED':
        return <CheckCircle2 className="w-4 h-4 text-accent" />
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4 text-primary" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Recommandations IA</h1>
        <p className="text-muted-foreground">
          Actions personnalisées pour réduire votre empreinte carbone.
        </p>
      </div>

      <div className="grid gap-4">
        {data.map((rec: any, idx: number) => (
          <Card key={idx}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle>{rec.title}</CardTitle>
                    {getStatusIcon(rec.status)}
                  </div>
                  <CardDescription>{rec.description}</CardDescription>
                </div>
                <Badge variant={getPriorityColor(rec.priority)}>
                  {rec.priority}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium">
                      Réduction estimée : {rec.impact?.toLocaleString('fr-FR') || 'N/A'} kg CO2e/an
                    </span>
                  </div>
                  {rec.effort && (
                    <div className="text-sm text-muted-foreground">
                      Effort : {rec.effort}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {rec.status === 'PENDING' && (
                    <>
                      <Button size="sm" variant="outline">
                        Commencer
                      </Button>
                      <Button size="sm" variant="ghost">
                        Ignorer
                      </Button>
                    </>
                  )}
                  {rec.status === 'IN_PROGRESS' && (
                    <Button size="sm" variant="outline">
                      En cours...
                    </Button>
                  )}
                  {rec.status === 'IMPLEMENTED' && (
                    <Badge variant="secondary">Implémenté</Badge>
                  )}
                </div>
              </div>
              {rec.aiReasoning && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Analyse IA :</strong> {rec.aiReasoning}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}



