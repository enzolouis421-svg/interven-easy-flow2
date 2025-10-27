import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, FileDown, FileText, Mail, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DevisPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [devis, setDevis] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevis();
  }, [id]);

  const loadDevis = async () => {
    if (!id) return;

    try {
      const { data: devisData, error: devisError } = await supabase
        .from("devis")
        .select("*")
        .eq("id", id)
        .single();

      if (devisError) throw devisError;

      const { data: clientData } = await supabase
        .from("clients")
        .select("*")
        .eq("id", devisData.client_id)
        .single();

      const { data: companyData } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", devisData.user_id)
        .single();

      setDevis({
        ...devisData,
        lignes_prestation: typeof devisData.lignes_prestation === 'string' 
          ? JSON.parse(devisData.lignes_prestation) 
          : (devisData.lignes_prestation || []),
      });
      setClient(clientData);
      setCompany(companyData);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    // Ouvrir la fenêtre AVANT l'appel async pour éviter le blocage de popup
    const printWindow = window.open("", "_blank");
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-pdf", {
        body: { type: "devis", id },
      });

      if (error) throw error;

      if (data.html && printWindow) {
        printWindow.document.write(data.html);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      toast({
        title: "PDF généré",
        description: "Fenêtre d'impression ouverte",
      });
    } catch (error: any) {
      if (printWindow) printWindow.close();
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleGenerateFacture = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Créer une facture à partir du devis
      const { data: factureData, error } = await supabase
        .from("factures")
        .insert({
          user_id: user.id,
          devis_id: id,
          client_id: devis.client_id,
          client_nom: devis.client_nom,
          reference: `FACT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`,
          date_emission: new Date().toISOString(),
          date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          lignes_prestation: devis.lignes_prestation,
          total_ht: devis.total_ht,
          total_tva: devis.total_tva,
          total_ttc: devis.total_ttc,
          conditions_paiement: devis.conditions_paiement,
          notes: devis.notes,
          statut: "Non payée",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Facture créée",
        description: "La facture a été générée à partir du devis",
      });

      navigate(`/facture/preview/${factureData.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleSendEmail = () => {
    if (!client?.email) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Ce client n'a pas d'adresse email.",
      });
      return;
    }

    const subject = encodeURIComponent(`Devis ${devis.reference}`);
    const body = encodeURIComponent(
      `Bonjour ${client.prenom || ""} ${client.nom},\n\n` +
      `Veuillez trouver ci-joint votre devis ${devis.reference}.\n\n` +
      `N'hésitez pas à me contacter pour toute question.\n\n` +
      `Cordialement,\n` +
      `${company?.nom_entreprise || ""}\n` +
      `${company?.email || ""}\n` +
      `${company?.telephone || ""}`
    );

    window.location.href = `mailto:${client.email}?subject=${subject}&body=${body}`;
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

    const dateEnvoi = new Date(devis.date_creation).toLocaleDateString("fr-FR");
    const subject = encodeURIComponent(`Relance concernant votre devis ${devis.reference}`);
    const body = encodeURIComponent(
      `Bonjour ${client.prenom || ""},\n\n` +
      `Je me permets de revenir vers vous au sujet du devis que je vous ai envoyé le ${dateEnvoi}.\n\n` +
      `Avez-vous pu en prendre connaissance ?\n\n` +
      `N'hésitez pas à me dire si vous souhaitez en discuter ou ajuster certains points, je reste à votre disposition.\n\n` +
      `Bien cordialement,\n` +
      `${company?.nom_entreprise || ""}\n` +
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

  if (!devis) {
    return (
      <div className="container mx-auto p-8">
        <p>Devis non trouvé</p>
      </div>
    );
  }

  const validUntil = new Date(devis.date_creation);
  validUntil.setDate(validUntil.getDate() + devis.validite_jours);

  return (
    <div className="min-h-screen bg-background">
      {/* Actions Bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/devis/${id}`)} className="hidden md:flex">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button variant="outline" size="sm" onClick={handleSendEmail}>
              <Mail className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Envoyer</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleRelance}>
              <Bell className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Relancer</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleGenerateFacture}>
              <FileText className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Générer facture</span>
            </Button>
            <Button size="sm" onClick={handleDownloadPDF} className="btn-gradient">
              <FileDown className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Télécharger PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Devis Preview */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white text-black p-8 md:p-12 rounded-lg shadow-lg border border-border">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 pb-8 border-b-2 border-gray-200">
            <div>
              {company?.logo_url && (
                <img src={company.logo_url} alt="Logo" className="h-16 mb-4" />
              )}
              <h2 className="text-xl font-bold">{company?.nom_entreprise}</h2>
              <p className="text-sm text-gray-600">{company?.adresse}</p>
              <p className="text-sm text-gray-600">
                {company?.code_postal} {company?.ville}
              </p>
              <p className="text-sm text-gray-600">SIRET: {company?.siret}</p>
              <p className="text-sm text-gray-600">{company?.telephone}</p>
              <p className="text-sm text-gray-600">{company?.email}</p>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-primary mb-2">DEVIS</h1>
              <p className="text-sm">
                <span className="font-semibold">N°:</span> {devis.reference}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Date:</span>{" "}
                {new Date(devis.date_creation).toLocaleDateString("fr-FR")}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Valide jusqu'au:</span>{" "}
                {validUntil.toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>

          {/* Client Info */}
          <div className="mb-8">
            <h3 className="font-bold text-lg mb-2">Client</h3>
            <div className="bg-gray-50 p-4 rounded">
              <p className="font-semibold">
                {client?.entreprise || `${client?.prenom} ${client?.nom}`}
              </p>
              {client?.adresse && <p className="text-sm">{client.adresse}</p>}
              {client?.code_postal && (
                <p className="text-sm">
                  {client.code_postal} {client.ville}
                </p>
              )}
              {client?.email && <p className="text-sm">{client.email}</p>}
              {client?.telephone && <p className="text-sm">{client.telephone}</p>}
            </div>
          </div>

          {/* Service Lines */}
          <div className="mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-primary/10">
                  <th className="border border-gray-300 p-3 text-left">Description</th>
                  <th className="border border-gray-300 p-3 text-center w-24">Qté</th>
                  <th className="border border-gray-300 p-3 text-right w-32">P.U. HT</th>
                  <th className="border border-gray-300 p-3 text-center w-20">TVA</th>
                  <th className="border border-gray-300 p-3 text-right w-32">Total HT</th>
                </tr>
              </thead>
              <tbody>
                {devis.lignes_prestation.map((ligne: any, index: number) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-3">{ligne.description}</td>
                    <td className="border border-gray-300 p-3 text-center">{ligne.quantite}</td>
                    <td className="border border-gray-300 p-3 text-right">
                      {ligne.prix_unitaire.toFixed(2)} €
                    </td>
                    <td className="border border-gray-300 p-3 text-center">{ligne.tva}%</td>
                    <td className="border border-gray-300 p-3 text-right">
                      {(ligne.quantite * ligne.prix_unitaire).toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-semibold">Total HT:</span>
                <span>{devis.total_ht.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-semibold">Total TVA:</span>
                <span>{devis.total_tva.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between py-3 bg-primary/10 px-3 rounded font-bold text-lg">
                <span>TOTAL TTC:</span>
                <span className="text-primary">{devis.total_ttc.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-4 text-sm border-t-2 border-gray-200 pt-6">
            {devis.delai_realisation && (
              <div>
                <p className="font-semibold">Délai de réalisation:</p>
                <p className="text-gray-600">{devis.delai_realisation}</p>
              </div>
            )}
            <div>
              <p className="font-semibold">Conditions de paiement:</p>
              <p className="text-gray-600">{devis.conditions_paiement}</p>
            </div>
            {devis.notes && (
              <div>
                <p className="font-semibold">Notes:</p>
                <p className="text-gray-600">{devis.notes}</p>
              </div>
            )}
          </div>

          {/* Signatures Section */}
          <div className="mt-12 border-t-2 border-gray-200 pt-8">
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Client Signature */}
              <div className="space-y-4">
                <p className="font-semibold text-center">Signature du client</p>
                {devis.client_signature_url ? (
                  <div className="border-2 border-gray-300 rounded p-2 h-32 flex items-center justify-center bg-gray-50">
                    <img 
                      src={devis.client_signature_url} 
                      alt="Signature client" 
                      className="max-h-full"
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded p-4 h-32 flex items-center justify-center bg-gray-50">
                    <p className="text-gray-400 text-sm">Signature en attente</p>
                  </div>
                )}
                <div className="space-y-1 text-center text-sm">
                  <p className="font-semibold">Date:</p>
                  <div className="border-b-2 border-gray-300 w-40 mx-auto pb-1">
                    {devis.date_signature 
                      ? new Date(devis.date_signature).toLocaleDateString("fr-FR")
                      : "___/___/_____"}
                  </div>
                </div>
              </div>

              {/* Company Signature */}
              <div className="space-y-4">
                <p className="font-semibold text-center">Signature de l'entreprise</p>
                {devis.company_signature_url ? (
                  <div className="border-2 border-gray-300 rounded p-2 h-32 flex items-center justify-center bg-gray-50">
                    <img 
                      src={devis.company_signature_url} 
                      alt="Signature entreprise" 
                      className="max-h-full"
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded p-4 h-32 flex items-center justify-center bg-gray-50">
                    <p className="text-gray-400 text-sm">Signature en attente</p>
                  </div>
                )}
                <div className="space-y-1 text-center text-sm">
                  <p className="font-semibold">Date:</p>
                  <div className="border-b-2 border-gray-300 w-40 mx-auto pb-1">
                    {devis.date_signature 
                      ? new Date(devis.date_signature).toLocaleDateString("fr-FR")
                      : "___/___/_____"}
                  </div>
                </div>
              </div>
            </div>

            {/* Bon pour accord */}
            <div className="text-center">
              <p className="text-lg font-bold uppercase text-primary">
                Bon pour accord
              </p>
              <p className="text-xs text-gray-500 mt-2">
                En signant ce document, le client accepte les conditions générales et le montant indiqué
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
