import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { generateReportPDF } from '@/lib/pdf-generator'

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
    const { type } = body

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { company: true },
    })

    if (!dbUser || !dbUser.companyId || !dbUser.company) {
      return NextResponse.json(
        { error: 'Entreprise non trouvée' },
        { status: 404 }
      )
    }

    // Récupérer les données d'émissions
    const now = new Date()
    const startDate = new Date()
    startDate.setMonth(now.getMonth() - 12)

    const emissions = await prisma.emissionRecord.findMany({
      where: {
        companyId: dbUser.companyId,
        date: {
          gte: startDate,
        },
      },
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

    // Générer le PDF
    const pdfBuffer = await generateReportPDF({
      type,
      company: dbUser.company,
      period: `${startDate.toISOString().slice(0, 7)} à ${now.toISOString().slice(0, 7)}`,
      total,
      byScope,
      emissions: emissions.slice(0, 100), // Limiter pour le PDF
    })

    // Sauvegarder le rapport dans la base de données
    const report = await prisma.report.create({
      data: {
        userId: user.id,
        companyId: dbUser.companyId,
        type: type as any,
        title: `Rapport ${type} - ${dbUser.company.name}`,
        period: `${startDate.toISOString().slice(0, 7)} à ${now.toISOString().slice(0, 7)}`,
        startDate,
        endDate: now,
        data: {
          total,
          byScope,
          emissionCount: emissions.length,
        },
      },
    })

    // Upload vers Supabase Storage (optionnel)
    // Pour l'instant, on retourne directement le PDF

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rapport-${type.toLowerCase()}-${now.toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('Generate report error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération du rapport' },
      { status: 500 }
    )
  }
}











