'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, TrendingDown, Zap, AlertCircle, Upload } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'

async function fetchDashboardStats() {
  const res = await fetch('/api/dashboard/stats?period=6months')
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          Erreur lors du chargement des données
        </p>
      </div>
    )
  }

  const { total, byScope, byCategory, monthly, trends } = data

  const scopeData = [
    { name: 'Scope 1', value: byScope.scope1, color: '#ef4444' },
    { name: 'Scope 2', value: byScope.scope2, color: '#f59e0b' },
    { name: 'Scope 3', value: byScope.scope3, color: '#2E6AEC' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Émissions totales</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {total.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">kg CO2e (6 mois)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réduction</CardTitle>
            <TrendingDown className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${trends.reduction > 0 ? 'text-accent' : 'text-destructive'}`}>
              {trends.reduction > 0 ? '-' : '+'}{Math.abs(trends.reduction).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">vs période précédente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scope 2</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {byScope.scope2.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">kg CO2e (énergie)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/recommendations">
              <Button variant="ghost" className="w-full justify-start p-0 h-auto">
                <div className="text-2xl font-bold">Voir</div>
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">recommandations</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Évolution mensuelle</CardTitle>
            <CardDescription>Émissions par scope sur 6 mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="emissions" stroke="#2E6AEC" strokeWidth={2} name="Total" />
                <Line type="monotone" dataKey="scope1" stroke="#ef4444" strokeWidth={2} name="Scope 1" />
                <Line type="monotone" dataKey="scope2" stroke="#f59e0b" strokeWidth={2} name="Scope 2" />
                <Line type="monotone" dataKey="scope3" stroke="#3b82f6" strokeWidth={2} name="Scope 3" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition par scope</CardTitle>
            <CardDescription>Distribution des émissions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={scopeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {scopeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Émissions par catégorie</CardTitle>
          <CardDescription>Répartition des activités</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="emissions" fill="#2E6AEC" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Link href="/dashboard/upload">
              <Button>
                <Upload className="mr-2 w-4 h-4" />
                Importer des données
              </Button>
            </Link>
            <Link href="/dashboard/reports">
              <Button variant="outline">
                <FileText className="mr-2 w-4 h-4" />
                Générer un rapport
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



