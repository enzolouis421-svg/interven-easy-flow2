import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
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

  const handleDownloadPDF = async () => {
    // Ouvrir la fenêtre AVANT l'appel async pour éviter le blocage de popup
    const printWindow = window.open("", "_blank");
    
    toast({
      title: "Génération du PDF",
      description: "Le PDF de la facture est en cours de génération...",
    });

    const { data, error } = await supabase.functions.invoke("generate-pdf", {
      body: { type: "facture", id },
    });

    if (error) {
      if (printWindow) printWindow.close();
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF",
        variant: "destructive",
      });
      return;
    }

    if (printWindow && data.html) {
      printWindow.document.write(data.html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleRelance = () => {
    if (!client?.email) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Ce client n'a pas d'adresse email.",
      });
      return;
    }

    const dateEmission = new Date(facture.date_emission).toLocaleDateString("fr-FR");
    const subject = encodeURIComponent(`Relance concernant votre facture ${facture.reference}`);
    const body = encodeURIComponent(
      `Bonjour ${client.prenom || ""},\n\n` +
      `Je me permets de revenir vers vous au sujet de la facture que je vous ai envoyée le ${dateEmission}.\n\n` +
      `Avez-vous pu en prendre connaissance ?\n\n` +
      `N'hésitez pas à me dire si vous souhaitez en discuter ou ajuster certains points, je reste à votre disposition.\n\n` +
      `Bien cordialement,\n` +
      `${company?.nom_entreprise || ""}\n` +
      `${company?.email || ""}\n` +
      `${company?.telephone || ""}`
    );

    window.location.href = `mailto:${client.email}?subject=${subject}&body=${body}`;
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/interventions-devis")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/facture/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button variant="outline" onClick={handleRelance}>
            <Bell className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Relancer</span>
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger PDF
          </Button>
        </div>
      </div>

      <Card className="p-8">
        <div className="space-y-8">
          {/* En-tête */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">FACTURE</h1>
              <p className="text-muted-foreground">{facture.reference}</p>
            </div>
            {company && (
              <div className="text-right">
                <p className="font-bold">{company.nom_entreprise}</p>
                <p className="text-sm">{company.adresse}</p>
                <p className="text-sm">{company.code_postal} {company.ville}</p>
                {company.siret && <p className="text-sm">SIRET: {company.siret}</p>}
                <p className="text-sm">{company.email}</p>
                <p className="text-sm">{company.telephone}</p>
              </div>
            )}
          </div>

          {/* Informations client */}
          {client && (
            <div>
              <p className="font-semibold mb-2">Client</p>
              <div className="bg-muted p-4 rounded">
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Date d'émission</p>
              <p className="font-medium">
                {new Date(facture.date_emission).toLocaleDateString('fr-FR')}
              </p>
            </div>
            {facture.date_echeance && (
              <div>
                <p className="text-sm text-muted-foreground">Date d'échéance</p>
                <p className="font-medium">
                  {new Date(facture.date_echeance).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <p className="font-medium">{facture.statut}</p>
            </div>
          </div>

          {/* Lignes de prestation */}
          <div>
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2">Description</th>
                  <th className="text-right py-2">Qté</th>
                  <th className="text-right py-2">Prix HT</th>
                  <th className="text-right py-2">TVA</th>
                  <th className="text-right py-2">Total HT</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((ligne: any, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{ligne.description}</td>
                    <td className="text-right">{ligne.quantite}</td>
                    <td className="text-right">{ligne.prix_unitaire.toFixed(2)} €</td>
                    <td className="text-right">{ligne.tva}%</td>
                    <td className="text-right">
                      {(ligne.quantite * ligne.prix_unitaire).toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totaux */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>Total HT:</span>
                <span className="font-medium">{facture.total_ht.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span>TVA:</span>
                <span className="font-medium">{facture.total_tva.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total TTC:</span>
                <span>{facture.total_ttc.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Conditions et notes */}
          {facture.conditions_paiement && (
            <div>
              <p className="font-semibold mb-2">Conditions de paiement</p>
              <p className="text-sm text-muted-foreground">{facture.conditions_paiement}</p>
            </div>
          )}

          {facture.notes && (
            <div>
              <p className="font-semibold mb-2">Notes</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{facture.notes}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
