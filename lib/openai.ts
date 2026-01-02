import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Types pour l'extraction de factures
export interface ExtractedInvoiceData {
  supplier?: string
  date?: string
  total?: number
  items?: Array<{
    description: string
    quantity?: number
    unit?: string
    amount?: number
  }>
  energyType?: string // électricité, gaz, fuel, etc.
  consumption?: number
  consumptionUnit?: string // kWh, m3, L, etc.
}

// Types pour la classification
export interface ActivityClassification {
  activityType: string
  category: string
  scope: 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3'
  description: string
  quantity: number
  unit: string
  emissionFactor?: number
}

// Extraction de données depuis une facture
export async function extractInvoiceData(
  text: string,
  imageUrl?: string
): Promise<ExtractedInvoiceData> {
  const prompt = `Tu es un expert en extraction de données de factures énergétiques et d'achats.
Extrais les informations suivantes d'une facture :
- Fournisseur (supplier)
- Date de facturation (date)
- Montant total (total)
- Type d'énergie si applicable (energyType: électricité, gaz, fuel, etc.)
- Consommation si applicable (consumption et consumptionUnit: kWh, m3, L, etc.)
- Articles détaillés (items: description, quantity, unit, amount)

Réponds UNIQUEMENT en JSON valide, sans texte supplémentaire.`

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: prompt,
    },
  ]

  if (imageUrl) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: 'Analyse cette facture et extrais les données.' },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    })
  } else {
    messages.push({
      role: 'user',
      content: `Extrais les données de cette facture :\n\n${text}`,
    })
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    response_format: { type: 'json_object' },
    temperature: 0.1,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  return JSON.parse(content) as ExtractedInvoiceData
}

// Classification d'une activité
export async function classifyActivity(
  description: string,
  context?: Record<string, any>
): Promise<ActivityClassification> {
  const prompt = `Tu es un expert en classification d'activités pour le calcul d'empreinte carbone.
Classifie cette activité selon les scopes du GHG Protocol :
- SCOPE_1 : Émissions directes (combustibles, véhicules de l'entreprise, fuites de gaz réfrigérants)
- SCOPE_2 : Émissions indirectes liées à l'énergie (électricité, vapeur, chaleur, froid achetés)
- SCOPE_3 : Autres émissions indirectes (achats, transport, déchets, etc.)

Pour chaque activité, détermine :
- activityType : énergie, transport, achat, matière_première, déchet, etc.
- category : catégorie spécifique
- scope : SCOPE_1, SCOPE_2 ou SCOPE_3
- description : description normalisée
- quantity : quantité estimée si possible
- unit : unité (kWh, km, kg, etc.)
- emissionFactor : facteur d'émission en kg CO2e/unité si tu le connais

Réponds UNIQUEMENT en JSON valide.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: prompt },
      {
        role: 'user',
        content: `Classifie cette activité : "${description}"${context ? `\n\nContexte : ${JSON.stringify(context)}` : ''}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  return JSON.parse(content) as ActivityClassification
}

// Génération d'insights et recommandations
export async function generateRecommendations(
  emissionsData: {
    total: number
    byScope: { scope1: number; scope2: number; scope3: number }
    byCategory: Array<{ category: string; emissions: number }>
    trends: Array<{ period: string; emissions: number }>
  }
): Promise<Array<{
  title: string
  description: string
  category: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  impact: number
  effort: 'LOW' | 'MEDIUM' | 'HIGH'
  reasoning: string
}>> {
  const prompt = `Tu es un expert en réduction d'empreinte carbone.
Analyse ces données d'émissions et génère des recommandations concrètes et actionnables.

Données :
- Total : ${emissionsData.total} kg CO2e
- Scope 1 : ${emissionsData.byScope.scope1} kg CO2e
- Scope 2 : ${emissionsData.byScope.scope2} kg CO2e
- Scope 3 : ${emissionsData.byScope.scope3} kg CO2e
- Catégories : ${JSON.stringify(emissionsData.byCategory)}
- Tendances : ${JSON.stringify(emissionsData.trends)}

Génère 5-10 recommandations avec :
- title : titre court et actionnable
- description : description détaillée
- category : ENERGY, TRANSPORT, WASTE, PROCUREMENT, PROCESS, OTHER
- priority : LOW, MEDIUM, HIGH, CRITICAL
- impact : réduction estimée en kg CO2e/an
- effort : LOW, MEDIUM, HIGH
- reasoning : explication de la recommandation

Réponds UNIQUEMENT en JSON valide avec un tableau "recommendations".`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: 'Génère les recommandations.' },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  const result = JSON.parse(content)
  return result.recommendations || []
}

// Génération de texte pour rapports
export async function generateReportText(
  type: 'CARBON_BALANCE' | 'ESG' | 'CSRD',
  data: Record<string, any>
): Promise<string> {
  const prompts = {
    CARBON_BALANCE: `Génère un texte d'introduction et de synthèse pour un bilan carbone professionnel.
Données : ${JSON.stringify(data)}
Le texte doit être professionnel, clair et conforme aux standards français.`,
    ESG: `Génère un texte pour un rapport ESG (Environnemental, Social, Gouvernance).
Données : ${JSON.stringify(data)}
Mets l'accent sur les aspects environnementaux et la gouvernance.`,
    CSRD: `Génère un texte pour un rapport CSRD (Corporate Sustainability Reporting Directive).
Données : ${JSON.stringify(data)}
Le texte doit être conforme aux exigences européennes.`,
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: prompts[type] },
      { role: 'user', content: 'Génère le texte du rapport.' },
    ],
    temperature: 0.7,
  })

  return response.choices[0]?.message?.content || ''
}











