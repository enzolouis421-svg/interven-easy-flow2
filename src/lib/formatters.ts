/**
 * Formate un numéro de téléphone en ajoutant des espaces
 * Exemple: 0612345678 -> 06 12 34 56 78
 */
export function formatPhoneNumber(value: string): string {
  // Enlever tous les caractères non numériques
  const cleaned = value.replace(/\D/g, '');
  
  // Formater avec des espaces tous les 2 chiffres
  const formatted = cleaned.match(/.{1,2}/g)?.join(' ') || cleaned;
  
  return formatted;
}

/**
 * Hook pour gérer l'input de numéro de téléphone avec formatage automatique
 */
export function usePhoneInput(initialValue: string = '') {
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    e.target.value = formatted;
    return formatted;
  };
  
  return { handlePhoneChange, formatPhoneNumber };
}
