export default function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/30 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">
              © {new Date().getFullYear()} - Tous droits réservés
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
              <a 
                href="#" 
                className="hover:text-primary transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Mentions légales\n\nÉditeur du site:\nVotre entreprise\n\nHébergement:\nLovable Cloud\n\nContacts:\nPour toute question relative à l'utilisation de ce service, veuillez nous contacter.");
                }}
              >
                Mentions légales
              </a>
              <span className="text-muted-foreground/50">•</span>
              <a 
                href="#" 
                className="hover:text-primary transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Politique de confidentialité\n\nVos données personnelles sont traitées dans le respect du RGPD.\n\nDonnées collectées:\n- Informations de compte\n- Données clients et interventions\n\nConservation:\nVos données sont conservées de manière sécurisée.\n\nDroits:\nVous disposez d'un droit d'accès, de rectification et de suppression de vos données.");
                }}
              >
                Politique de confidentialité
              </a>
              <span className="text-muted-foreground/50">•</span>
              <a 
                href="#" 
                className="hover:text-primary transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Conditions générales d'utilisation\n\nEn utilisant ce service, vous acceptez:\n- D'utiliser le service conformément à sa destination\n- De ne pas porter atteinte aux droits des tiers\n- De respecter la législation en vigueur\n\nLe service est fourni 'tel quel' sans garantie d'aucune sorte.");
                }}
              >
                CGU
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
