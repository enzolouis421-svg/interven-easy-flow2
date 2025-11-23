import PDFDocument from 'pdfkit'
import { Company } from '@prisma/client'

interface ReportData {
  type: 'CARBON_BALANCE' | 'ESG' | 'CSRD'
  company: Company
  period: string
  total: number
  byScope: {
    scope1: number
    scope2: number
    scope3: number
  }
  emissions: Array<{
    date: Date
    scope: string
    description: string
    co2e: number
  }>
}

export async function generateReportPDF(data: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // En-tête
    doc
      .fontSize(24)
      .fillColor('#2E6AEC')
      .text('AirNex', 50, 50)
      .fontSize(18)
      .fillColor('#000000')
      .text(
        data.type === 'CARBON_BALANCE'
          ? 'Bilan Carbone'
          : data.type === 'ESG'
          ? 'Rapport ESG'
          : 'Rapport CSRD',
        50,
        80
      )

    // Informations entreprise
    doc
      .fontSize(14)
      .text(data.company.name, 50, 120)
      .fontSize(10)
      .fillColor('#666666')
      .text(`Période : ${data.period}`, 50, 140)
      .text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, 50, 155)

    let y = 200

    // Résumé
    doc
      .fontSize(16)
      .fillColor('#000000')
      .text('Résumé des émissions', 50, y)
      .fontSize(12)
      .fillColor('#666666')

    y += 30

    doc
      .text(`Total : ${data.total.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kg CO2e`, 50, y)
    y += 20
    doc.text(`Scope 1 : ${data.byScope.scope1.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kg CO2e`, 50, y)
    y += 20
    doc.text(`Scope 2 : ${data.byScope.scope2.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kg CO2e`, 50, y)
    y += 20
    doc.text(`Scope 3 : ${data.byScope.scope3.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kg CO2e`, 50, y)

    y += 40

    // Graphique de répartition (texte)
    doc
      .fontSize(16)
      .fillColor('#000000')
      .text('Répartition par scope', 50, y)

    y += 30

    const totalScope = data.byScope.scope1 + data.byScope.scope2 + data.byScope.scope3
    if (totalScope > 0) {
      const scope1Percent = (data.byScope.scope1 / totalScope) * 100
      const scope2Percent = (data.byScope.scope2 / totalScope) * 100
      const scope3Percent = (data.byScope.scope3 / totalScope) * 100

      doc
        .fontSize(10)
        .fillColor('#666666')
        .text(`Scope 1 : ${scope1Percent.toFixed(1)}%`, 50, y)
      y += 15
      doc.text(`Scope 2 : ${scope2Percent.toFixed(1)}%`, 50, y)
      y += 15
      doc.text(`Scope 3 : ${scope3Percent.toFixed(1)}%`, 50, y)
    }

    y += 40

    // Détail des émissions (premières)
    if (data.emissions.length > 0) {
      doc
        .fontSize(16)
        .fillColor('#000000')
        .text('Détail des émissions', 50, y)

      y += 30

      data.emissions.slice(0, 20).forEach((emission) => {
        if (y > 700) {
          doc.addPage()
          y = 50
        }

        doc
          .fontSize(10)
          .fillColor('#000000')
          .text(
            `${new Date(emission.date).toLocaleDateString('fr-FR')} - ${emission.description}`,
            50,
            y,
            { width: 500 }
          )
        y += 15
        doc
          .fontSize(9)
          .fillColor('#666666')
          .text(
            `${emission.scope} • ${emission.co2e.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} kg CO2e`,
            50,
            y
          )
        y += 25
      })
    }

    // Pied de page
    const pageCount = doc.bufferedPageRange().count
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i)
      doc
        .fontSize(8)
        .fillColor('#999999')
        .text(
          `Page ${i + 1} sur ${pageCount} • AirNex - Analyse Carbone Automatisée`,
          50,
          doc.page.height - 30,
          { align: 'center' }
        )
    }

    doc.end()
  })
}

