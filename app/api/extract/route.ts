import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { extractInvoiceData, classifyActivity } from '@/lib/openai'

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
    const { fileId } = body

    if (!fileId) {
      return NextResponse.json({ error: 'fileId requis' }, { status: 400 })
    }

    // Récupérer le fichier
    const file = await prisma.uploadedFile.findUnique({
      where: { id: fileId },
      include: { company: true },
    })

    if (!file) {
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 })
    }

    // Mettre à jour le statut
    await prisma.uploadedFile.update({
      where: { id: fileId },
      data: { extractionStatus: 'EXTRACTING' },
    })

    try {
      // Récupérer le fichier depuis Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('files')
        .download(file.storagePath)

      if (downloadError || !fileData) {
        throw new Error('Erreur lors du téléchargement du fichier')
      }

      // Convertir en texte (pour PDF, on utiliserait pdf-parse, pour images on utiliserait OCR)
      // Pour l'instant, on simule avec l'extraction IA
      let extractedData

      if (file.fileType === 'pdf' || file.fileType === 'image') {
        // Pour les images, on peut passer l'URL directement à OpenAI Vision
        const { data: { publicUrl } } = supabase.storage
          .from('files')
          .getPublicUrl(file.storagePath)

        extractedData = await extractInvoiceData('', publicUrl)
      } else {
        // Pour CSV/Excel, on devrait parser le fichier
        const text = await fileData.text()
        extractedData = await extractInvoiceData(text)
      }

      // Classifier l'activité
      const description = extractedData.energyType || extractedData.supplier || 'Activité inconnue'
      const classification = await classifyActivity(
        description,
        extractedData
      )

      // Mettre à jour le fichier avec les données extraites
      await prisma.uploadedFile.update({
        where: { id: fileId },
        data: {
          extractionStatus: 'COMPLETED',
          extractedData: {
            ...extractedData,
            classification,
          },
        },
      })

      // Créer automatiquement un enregistrement d'émission si possible
      if (classification.quantity && classification.emissionFactor) {
        const dbUser = await prisma.user.findUnique({
          where: { id: file.userId },
        })

        if (dbUser && dbUser.companyId) {
          await prisma.emissionRecord.create({
            data: {
              userId: file.userId,
              companyId: dbUser.companyId,
              activityType: classification.activityType,
              scope: classification.scope as any,
              description: classification.description,
              quantity: classification.quantity,
              unit: classification.unit,
              emissionFactor: classification.emissionFactor,
              co2e: classification.quantity * classification.emissionFactor,
              date: extractedData.date ? new Date(extractedData.date) : new Date(),
              period: new Date().toISOString().slice(0, 7),
              source: 'facture',
              sourceFileId: fileId,
              rawData: extractedData as any,
            },
          })
        }
      }

      return NextResponse.json({
        success: true,
        extractedData,
        classification,
      })
    } catch (error: any) {
      await prisma.uploadedFile.update({
        where: { id: fileId },
        data: {
          extractionStatus: 'FAILED',
          errorMessage: error.message,
        },
      })

      throw error
    }
  } catch (error: any) {
    console.error('Extract error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'extraction' },
      { status: 500 }
    )
  }
}

