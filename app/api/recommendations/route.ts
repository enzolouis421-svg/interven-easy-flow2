import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { generateRecommendations } from '@/lib/openai'

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

    // Récupérer les recommandations existantes
    const existingRecommendations = await prisma.aIRecommendation.findMany({
      where: {
        companyId: dbUser.companyId,
      },
      orderBy: {
        priority: 'desc',
      },
    })

    // Si pas de recommandations, en générer de nouvelles
    if (existingRecommendations.length === 0) {
      // Récupérer les données d'émissions pour l'IA
      const emissions = await prisma.emissionRecord.findMany({
        where: {
          companyId: dbUser.companyId,
        },
        take: 100,
      })

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

      const byCategory = emissions.reduce((acc, e) => {
        const cat = e.activityType || 'Autre'
        if (!acc[cat]) acc[cat] = 0
        acc[cat] += e.co2e
        return acc
      }, {} as Record<string, number>)

      const categoryArray = Object.entries(byCategory).map(([category, emissions]) => ({
        category,
        emissions,
      }))

      // Générer les recommandations avec l'IA
      try {
        const aiRecommendations = await generateRecommendations({
          total,
          byScope,
          byCategory: categoryArray,
          trends: [],
        })

        // Sauvegarder les recommandations
        for (const rec of aiRecommendations) {
          await prisma.aIRecommendation.create({
            data: {
              userId: user.id,
              companyId: dbUser.companyId,
              title: rec.title,
              description: rec.description,
              category: rec.category as any,
              priority: rec.priority,
              impact: rec.impact,
              effort: rec.effort,
              aiGenerated: true,
              aiReasoning: rec.reasoning,
              status: 'PENDING',
            },
          })
        }

        // Recharger les recommandations
        const updatedRecommendations = await prisma.aIRecommendation.findMany({
          where: {
            companyId: dbUser.companyId,
          },
          orderBy: {
            priority: 'desc',
          },
        })

        return NextResponse.json(updatedRecommendations)
      } catch (aiError) {
        console.error('AI generation error:', aiError)
        // Retourner des recommandations par défaut si l'IA échoue
      }
    }

    return NextResponse.json(existingRecommendations)
  } catch (error: any) {
    console.error('Recommendations error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des recommandations' },
      { status: 500 }
    )
  }
}











