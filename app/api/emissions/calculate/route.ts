import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { calculateEmissions } from '@/lib/emission-factors'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const {
      activityType,
      categoryId,
      scope,
      description,
      quantity,
      unit,
      emissionFactor,
      date,
      projectId,
      sourceFileId,
    } = body

    // Récupérer l'utilisateur et l'entreprise
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

    // Calculer les émissions
    const co2e = calculateEmissions(quantity, emissionFactor)

    // Créer l'enregistrement d'émission
    const emissionRecord = await prisma.emissionRecord.create({
      data: {
        userId: user.id,
        companyId: dbUser.companyId,
        projectId: projectId || null,
        activityType,
        categoryId: categoryId || null,
        scope,
        description,
        quantity,
        unit,
        emissionFactor,
        co2e,
        date: new Date(date),
        period: new Date(date).toISOString().slice(0, 7), // YYYY-MM
        sourceFileId: sourceFileId || null,
      },
    })

    return NextResponse.json({
      success: true,
      emission: emissionRecord,
    })
  } catch (error: any) {
    console.error('Calculate emissions error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors du calcul' },
      { status: 500 }
    )
  }
}



