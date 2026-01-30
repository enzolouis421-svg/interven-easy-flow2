import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Edit, Bell } from "lucide-react";

export default function FacturePreview() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [facture, setFacture] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    loadFacture();
  }, [id]);

  const loadFacture = async () => {
    if (!id) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: factureData, error: factureError } = await supabase
      .from("factures")
      .select("*")
      .eq("id", id)
      .single();

    if (factureError || !factureData) {
      toast({
        title: "Erreur",
        description: "Facture non trouvée",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { data: clientData } = await supabase
      .from("clients")
      .select("*")
      .eq("id", factureData.client_id)
      .single();

    const { data: companyData } = await supabase
      .from("company_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    setFacture(factureData);
    setClient(clientData);
    setCompany(companyData);
    setLoading(false);
  };

  // Calculer les jours de retard
  const calculateDaysDelay = (): number => {
    if (!facture?.date_echeance) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const echeance = new Date(facture.date_echeance);
    echeance.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - echeance.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Vérifier si la facture est en retard et doit être relancée
  const isOverdueAndNotRelanced = (): boolean => {
    if (!facture?.date_echeance) return false;
    const joursRetard = calculateDaysDelay();
    return joursRetard > 0 && !facture.relance_envoyee;
  };

  const handleDownloadPDF = async () => {
    try {
      toast({
        title: "Génération du PDF",
        description: "Le PDF de la facture est en cours de génération...",
      });

      // Récupérer le token d'authentification
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Vous devez être connecté pour télécharger le PDF",
        });
        return;
      }

      // Appeler l'Edge Function avec l'authentification
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
          },
          body: JSON.stringify({ type: "facture", id }),
        }
      );

      if (!response.ok) {
        let errorMessage = `Erreur lors du téléchargement (code: ${response.status})`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          const text = await response.text().catch(() => "");
          if (text) errorMessage = text.substring(0, 200);
        }
        
        if (response.status === 404) {
          errorMessage = "La fonction de génération PDF n'est pas disponible. Veuillez contacter le support technique.";
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = "Erreur d'authentification. Veuillez vous reconnecter.";
        } else if (response.status === 500) {
          errorMessage = "Erreur serveur. Veuillez réessayer plus tard.";
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.html) {
        const { generatePDFFromHTML } = await import("@/lib/pdfGenerator");
        const filename = `facture-${facture?.reference || id}-${new Date().toISOString().split('T')[0]}.pdf`;
        
        await generatePDFFromHTML(data.html, filename);
        
        toast({
          title: "PDF généré",
          description: "Le PDF a été téléchargé avec succès",
        });
      }
    } catch (error: any) {
      console.error("Erreur téléchargement PDF:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer le PDF. Vérifiez que la fonction Edge est déployée.",
        variant: "destructive",
      });
    }
  };

  const handleRelance = async () => {
    if (!client?.email) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Ce client n'a pas d'adresse email.",
      });
      return;
    }

    if (!facture?.date_echeance) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Cette facture n'a pas de date d'échéance.",
      });
      return;
    }

    const joursRetard = calculateDaysDelay();
    
    if (joursRetard <= 0) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Cette facture n'est pas encore en retard.",
      });
      return;
    }

    try {
      // Mettre à jour relance_envoyee dans la base de données
      const { error: updateError } = await supabase
        .from("factures")
        .update({ relance_envoyee: true })
        .eq("id", id);

      if (updateError) {
        console.error("Erreur mise à jour relance:", updateError);
        // Continuer quand même pour ouvrir le mailto
      } else {
        // Recharger la facture pour mettre à jour l'état
        setFacture((prev: any) => ({ ...prev, relance_envoyee: true }));
      }

      // Préparer le template email
      const prenom = client.prenom || "";
      const nomEntreprise = company?.nom_entreprise || "";
      const emailEntreprise = company?.email || "";
      const telephoneEntreprise = company?.telephone || "";
      const totalTTC = facture.total_ttc?.toFixed(2) || "0.00";

      const subject = encodeURIComponent(
        `Relance facture ${facture.reference} (${joursRetard} jour${joursRetard > 1 ? "s" : ""} de retard)`
      );

      const body = encodeURIComponent(
        `Bonjour ${prenom},\n\n` +
        `Votre facture ${facture.reference} d'un montant de ${totalTTC} € est en retard de ${joursRetard} jour${joursRetard > 1 ? "s" : ""}.\n\n` +
        `Merci de procéder au règlement dans les plus brefs délais.\n\n` +
        `Cordialement,\n` +
        `${nomEntreprise}\n` +
        `${emailEntreprise}\n` +
        `${telephoneEntreprise}`
      );

      // Ouvrir le client mail
      window.location.href = `mailto:${client.email}?subject=${subject}&body=${body}`;

      toast({
        title: "Email préparé",
        description: "Votre client mail s'ouvre avec le message de relance pré-rempli.",
      });
    } catch (error: any) {
      console.error("Erreur relance:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de préparer la relance.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!facture) {
    return (
      <div className="container mx-auto py-6">
        <p>Facture non trouvée</p>
      </div>
    );
  }

  const lignes = facture.lignes_prestation || [];
  const joursRetard = calculateDaysDelay();
  const showRelanceBadge = isOverdueAndNotRelanced();

  return (
    <div className="container mx-auto py-3 sm:py-6 space-y-3 sm:space-y-6 px-2 sm:px-0">
      <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3">
        <Button variant="ghost" onClick={() => navigate("/interventions-devis")} className="text-sm sm:text-base">
          <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
          Retour
        </Button>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => navigate(`/facture/${id}/edit`)} className="text-xs sm:text-sm">
            <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden md:inline">Modifier</span>
            <span className="md:hidden">Modif.</span>
          </Button>
          {showRelanceBadge && (
            <Button 
              variant="default" 
              onClick={handleRelance}
              className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm"
            >
              <Bell className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden md:inline">Relancer</span>
              <span className="md:hidden">Relancer</span>
            </Button>
          )}
          <Button onClick={handleDownloadPDF} className="text-xs sm:text-sm">
            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden md:inline">Télécharger PDF</span>
            <span className="md:hidden">PDF</span>
          </Button>
        </div>
      </div>

      <Card className="p-3 sm:p-4 md:p-8">
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
          {/* En-tête avec badge */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">FACTURE</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">{facture.reference}</p>
                </div>
                {showRelanceBadge && (
                  <Badge variant="destructive" className="text-xs sm:text-sm px-2 sm:px-3 py-1 whitespace-nowrap w-fit">
                    À relancer ({joursRetard} jour{joursRetard > 1 ? "s" : ""} de retard)
                  </Badge>
                )}
              </div>
            </div>
            {company && (
              <div className="text-left sm:text-right text-xs sm:text-sm">
                <p className="font-bold text-sm sm:text-base">{company.nom_entreprise}</p>
                <p>{company.adresse}</p>
                <p>{company.code_postal} {company.ville}</p>
                {company.siret && <p>SIRET: {company.siret}</p>}
                <p>{company.email}</p>
                <p>{company.telephone}</p>
              </div>
            )}
          </div>

          {/* Informations client */}
          {client && (
            <div>
              <p className="font-semibold mb-2 text-sm sm:text-base">Client</p>
              <div className="bg-muted p-3 sm:p-4 rounded text-xs sm:text-sm">
                <p className="font-medium">{client.nom}</p>
                {client.entreprise && <p>{client.entreprise}</p>}
                {client.adresse && <p>{client.adresse}</p>}
                {client.code_postal && client.ville && (
                  <p>{client.code_postal} {client.ville}</p>
                )}
                {client.email && <p>{client.email}</p>}
                {client.telephone && <p>{client.telephone}</p>}
              </div>
            </div>
          )}

          {/* Dates et statut */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Date d'émission</p>
              <p className="font-medium text-sm sm:text-base">
                {new Date(facture.date_emission).toLocaleDateString('fr-FR')}
              </p>
            </div>
            {facture.date_echeance && (
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Date d'échéance</p>
                <p className={`font-medium text-sm sm:text-base ${joursRetard > 0 ? 'text-red-600' : ''}`}>
                  {new Date(facture.date_echeance).toLocaleDateString('fr-FR')}
                  {joursRetard > 0 && (
                    <span className="text-xs ml-2 block sm:inline">
                      ({joursRetard} jour{joursRetard > 1 ? "s" : ""} de retard)
                    </span>
                  )}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Statut</p>
              <p className="font-medium text-sm sm:text-base">{facture.statut}</p>
            </div>
          </div>

          {/* Lignes de prestation */}
          <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0 px-3 sm:px-4 md:px-0">
            <table className="w-full min-w-[600px] md:min-w-0 text-xs sm:text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 font-semibold">Description</th>
                  <th className="text-right py-2 font-semibold">Qté</th>
                  <th className="text-right py-2 font-semibold">Prix HT</th>
                  <th className="text-right py-2 font-semibold">TVA</th>
                  <th className="text-right py-2 font-semibold">Total HT</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((ligne: any, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 pr-2">{ligne.description}</td>
                    <td className="text-right py-2">{ligne.quantite}</td>
                    <td className="text-right py-2">{ligne.prix_unitaire.toFixed(2)} €</td>
                    <td className="text-right py-2">{ligne.tva}%</td>
                    <td className="text-right py-2">
                      {(ligne.quantite * ligne.prix_unitaire).toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totaux */}
          <div className="flex justify-end">
            <div className="w-full sm:w-64 space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span>Total HT:</span>
                <span className="font-medium">{facture.total_ht.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span>TVA:</span>
                <span className="font-medium">{facture.total_tva.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-base sm:text-lg font-bold border-t pt-2">
                <span>Total TTC:</span>
                <span>{facture.total_ttc.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Conditions et notes */}
          {facture.conditions_paiement && (
            <div>
              <p className="font-semibold mb-2 text-sm sm:text-base">Conditions de paiement</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{facture.conditions_paiement}</p>
            </div>
          )}

          {facture.notes && (
            <div>
              <p className="font-semibold mb-2 text-sm sm:text-base">Notes</p>
              <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-line">{facture.notes}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
