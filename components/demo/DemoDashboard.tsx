'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingDown, TrendingUp, FileText, Zap, AlertCircle } from 'lucide-react'

// Données de démonstration
const monthlyData = [
  { month: 'Jan', emissions: 1250, scope1: 450, scope2: 600, scope3: 200 },
  { month: 'Fév', emissions: 1180, scope1: 420, scope2: 580, scope3: 180 },
  { month: 'Mar', emissions: 1320, scope1: 480, scope2: 620, scope3: 220 },
  { month: 'Avr', emissions: 1150, scope1: 400, scope2: 570, scope3: 180 },
  { month: 'Mai', emissions: 1080, scope1: 380, scope2: 550, scope3: 150 },
  { month: 'Juin', emissions: 1020, scope1: 360, scope2: 530, scope3: 130 },
]

const scopeData = [
  { name: 'Scope 1', value: 2490, color: '#ef4444' },
  { name: 'Scope 2', value: 3450, color: '#f59e0b' },
  { name: 'Scope 3', value: 1060, color: '#3b82f6' },
]

const categoryData = [
  { category: 'Énergie', emissions: 3450 },
  { category: 'Transport', emissions: 1890 },
  { category: 'Achats', emissions: 1120 },
  { category: 'Déchets', emissions: 540 },
]

const recommendations = [
  {
    title: 'Optimiser la consommation électrique',
    description: 'Passer à un fournisseur d\'électricité verte pourrait réduire vos émissions Scope 2 de 30%.',
    impact: 1035,
    priority: 'HIGH',
    category: 'ENERGY',
  },
  {
    title: 'Réduire les déplacements professionnels',
    description: 'Privilégier les visioconférences et optimiser les trajets pourrait réduire les émissions de transport de 25%.',
    impact: 472,
    priority: 'MEDIUM',
    category: 'TRANSPORT',
  },
  {
    title: 'Améliorer le tri des déchets',
    description: 'Mettre en place un système de tri et de recyclage pourrait réduire les émissions liées aux déchets de 40%.',
    impact: 216,
    priority: 'MEDIUM',
    category: 'WASTE',
  },
]

export function DemoDashboard() {
  const totalEmissions = 7000
  const previousPeriod = 7500
  const reduction = ((previousPeriod - totalEmissions) / previousPeriod) * 100

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
            <div className="text-2xl font-bold">{totalEmissions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">kg CO2e (6 mois)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réduction</CardTitle>
            <TrendingDown className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">-{reduction.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">vs période précédente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scope 2</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scopeData[1].value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">kg CO2e (énergie)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommandations</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recommendations.length}</div>
            <p className="text-xs text-muted-foreground">actions disponibles</p>
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
              <LineChart data={monthlyData}>
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

      {/* Categories and Recommendations */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Émissions par catégorie</CardTitle>
            <CardDescription>Répartition des activités</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="emissions" fill="#2E6AEC" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommandations IA</CardTitle>
            <CardDescription>Actions pour réduire vos émissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{rec.title}</h4>
                  <Badge variant={rec.priority === 'HIGH' ? 'destructive' : 'secondary'}>
                    {rec.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingDown className="w-4 h-4 text-accent" />
                  <span className="text-accent font-medium">
                    Réduction estimée : {rec.impact} kg CO2e/an
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



