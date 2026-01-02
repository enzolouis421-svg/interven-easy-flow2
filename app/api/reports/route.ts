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

    const reports = await prisma.report.findMany({
      where: {
        companyId: dbUser.companyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    return NextResponse.json(reports)
  } catch (error: any) {
    console.error('Reports error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des rapports' },
      { status: 500 }
    )
  }
}











