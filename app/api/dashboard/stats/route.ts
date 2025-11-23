import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { company: true },
    })

    if (!dbUser || !dbUser.companyId) {
      return NextResponse.json(
        { error: 'Entreprise non trouvée' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '6months'

    // Calculer la période
    const now = new Date()
    const startDate = new Date()
    if (period === '6months') {
      startDate.setMonth(now.getMonth() - 6)
    } else if (period === '1year') {
      startDate.setFullYear(now.getFullYear() - 1)
    } else {
      startDate.setMonth(now.getMonth() - 1)
    }

    // Récupérer les émissions
    const emissions = await prisma.emissionRecord.findMany({
      where: {
        companyId: dbUser.companyId,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Calculer les statistiques
    const total = emissions.reduce((sum, e) => sum + e.co2e, 0)
    const byScope = {
      scope1: emissions
        .filter((e) => e.scope === 'SCOPE_1')
        .reduce((sum, e) => sum + e.co2e, 0),
      scope2: emissions
        .filter((e) => e.scope === 'SCOPE_2')
        .reduce((sum, e) => sum + e.co2e, 0),
      scope3: emissions
        .filter((e) => e.scope === 'SCOPE_3')
        .reduce((sum, e) => sum + e.co2e, 0),
    }

    // Données mensuelles
    const monthlyData = emissions.reduce((acc, e) => {
      const month = e.period || new Date(e.date).toISOString().slice(0, 7)
      if (!acc[month]) {
        acc[month] = { month, emissions: 0, scope1: 0, scope2: 0, scope3: 0 }
      }
      acc[month].emissions += e.co2e
      if (e.scope === 'SCOPE_1') acc[month].scope1 += e.co2e
      if (e.scope === 'SCOPE_2') acc[month].scope2 += e.co2e
      if (e.scope === 'SCOPE_3') acc[month].scope3 += e.co2e
      return acc
    }, {} as Record<string, any>)

    const monthlyArray = Object.values(monthlyData).sort(
      (a: any, b: any) => a.month.localeCompare(b.month)
    )

    // Par catégorie
    const byCategory = emissions.reduce((acc, e) => {
      const cat = e.activityType || 'Autre'
      if (!acc[cat]) {
        acc[cat] = { category: cat, emissions: 0 }
      }
      acc[cat].emissions += e.co2e
      return acc
    }, {} as Record<string, any>)

    const categoryArray = Object.values(byCategory).sort(
      (a: any, b: any) => b.emissions - a.emissions
    )

    // Tendances (comparaison avec période précédente)
    const previousStartDate = new Date(startDate)
    const previousEndDate = new Date(startDate)
    previousStartDate.setMonth(previousStartDate.getMonth() - (period === '6months' ? 6 : 12))

    const previousEmissions = await prisma.emissionRecord.findMany({
      where: {
        companyId: dbUser.companyId,
        date: {
          gte: previousStartDate,
          lt: startDate,
        },
      },
    })

    const previousTotal = previousEmissions.reduce((sum, e) => sum + e.co2e, 0)
    const reduction = previousTotal > 0 ? ((previousTotal - total) / previousTotal) * 100 : 0

    return NextResponse.json({
      total,
      byScope,
      byCategory: categoryArray,
      monthly: monthlyArray,
      trends: {
        current: total,
        previous: previousTotal,
        reduction,
      },
    })
  } catch (error: any) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors du calcul des statistiques' },
      { status: 500 }
    )
  }
}



