import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, name, companyName } = body

    if (!userId || !email || !name || !companyName) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Créer l'entreprise
    const company = await prisma.company.create({
      data: {
        name: companyName,
        email,
      },
    })

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        name,
        companyId: company.id,
        role: 'ADMIN', // Premier utilisateur = admin
      },
    })

    // Créer les paramètres de l'entreprise
    await prisma.companySettings.create({
      data: {
        companyId: company.id,
      },
    })

    return NextResponse.json({
      success: true,
      user,
      company,
    })
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du compte' },
      { status: 500 }
    )
  }
}











