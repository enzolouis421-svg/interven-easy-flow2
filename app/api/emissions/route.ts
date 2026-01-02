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
    const limit = parseInt(searchParams.get('limit') || '100')
    const scope = searchParams.get('scope')

    const where: any = {
      companyId: dbUser.companyId,
    }

    if (scope) {
      where.scope = scope
    }

    const emissions = await prisma.emissionRecord.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
      take: limit,
    })

    return NextResponse.json(emissions)
  } catch (error: any) {
    console.error('Emissions error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des émissions' },
      { status: 500 }
    )
  }
}











