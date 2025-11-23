// Facteurs d'émission standards (en kg CO2e/unité)
// Source : Base Carbone ADEME, IPCC, etc.

export const EMISSION_FACTORS: Record<string, number> = {
  // Énergie - Électricité (France)
  'electricity_fr': 0.056, // kg CO2e/kWh (mix électrique français)
  'electricity_eu': 0.276, // kg CO2e/kWh (mix électrique européen moyen)
  
  // Énergie - Gaz
  'natural_gas': 0.206, // kg CO2e/kWh
  'lpg': 0.214, // kg CO2e/kWh
  
  // Énergie - Fioul
  'fuel_oil': 0.324, // kg CO2e/kWh
  'diesel': 2.68, // kg CO2e/L
  'petrol': 2.31, // kg CO2e/L
  
  // Transport
  'car_diesel_km': 0.171, // kg CO2e/km (voiture diesel moyenne)
  'car_petrol_km': 0.192, // kg CO2e/km (voiture essence moyenne)
  'car_electric_km': 0.020, // kg CO2e/km (voiture électrique, mix FR)
  'truck_km': 0.162, // kg CO2e/km (camion moyen)
  'plane_km': 0.285, // kg CO2e/km (avion court courrier)
  'train_km': 0.014, // kg CO2e/km (train, mix FR)
  
  // Matières premières
  'concrete_kg': 0.130, // kg CO2e/kg (béton)
  'steel_kg': 2.30, // kg CO2e/kg (acier)
  'aluminum_kg': 8.24, // kg CO2e/kg (aluminium)
  'plastic_kg': 2.50, // kg CO2e/kg (plastique moyen)
  'paper_kg': 1.30, // kg CO2e/kg (papier)
  
  // Déchets
  'waste_landfill_kg': 0.500, // kg CO2e/kg (mise en décharge)
  'waste_incineration_kg': 0.400, // kg CO2e/kg (incinération)
  'waste_recycling_kg': -0.500, // kg CO2e/kg (recyclage, négatif car évite des émissions)
}

// Catégories d'activités par défaut
export const DEFAULT_CATEGORIES = [
  {
    name: 'Électricité',
    scope: 'SCOPE_2' as const,
    activityType: 'énergie',
    defaultEmissionFactor: EMISSION_FACTORS.electricity_fr,
    unit: 'kWh',
  },
  {
    name: 'Gaz naturel',
    scope: 'SCOPE_2' as const,
    activityType: 'énergie',
    defaultEmissionFactor: EMISSION_FACTORS.natural_gas,
    unit: 'kWh',
  },
  {
    name: 'Fioul',
    scope: 'SCOPE_1' as const,
    activityType: 'énergie',
    defaultEmissionFactor: EMISSION_FACTORS.fuel_oil,
    unit: 'kWh',
  },
  {
    name: 'Transport routier',
    scope: 'SCOPE_1' as const,
    activityType: 'transport',
    defaultEmissionFactor: EMISSION_FACTORS.car_diesel_km,
    unit: 'km',
  },
  {
    name: 'Transport aérien',
    scope: 'SCOPE_3' as const,
    activityType: 'transport',
    defaultEmissionFactor: EMISSION_FACTORS.plane_km,
    unit: 'km',
  },
  {
    name: 'Achats généraux',
    scope: 'SCOPE_3' as const,
    activityType: 'achat',
    defaultEmissionFactor: 0.5, // Estimation moyenne
    unit: 'EUR',
  },
  {
    name: 'Déchets',
    scope: 'SCOPE_3' as const,
    activityType: 'déchet',
    defaultEmissionFactor: EMISSION_FACTORS.waste_landfill_kg,
    unit: 'kg',
  },
]

// Fonction pour obtenir un facteur d'émission
export function getEmissionFactor(key: string): number {
  return EMISSION_FACTORS[key] || 0
}

// Fonction pour calculer les émissions
export function calculateEmissions(
  quantity: number,
  emissionFactor: number
): number {
  return quantity * emissionFactor
}



