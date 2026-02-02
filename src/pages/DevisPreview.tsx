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

      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", devisData.client_id)
        .maybeSingle();
      
      if (clientError && clientError.code !== 'PGRST116') {
        console.warn("Erreur lors du chargement du client:", clientError);
      }

      const { data: companyData } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", devisData.user_id)
        .single();

      setDevis({
        ...devisData,
        lignes_prestation: typeof devisData.lignes_prestation === 'string' 
          ? (() => {
              try {
                return JSON.parse(devisData.lignes_prestation);
              } catch {
                return [];
              }
            })()
          : (devisData.lignes_prestation || []),
      });
      setClient(clientData || null);
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
    try {
      toast({
        title: "Génération du PDF",
        description: "Le PDF du devis est en cours de génération...",
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
          body: JSON.stringify({ type: "devis", id }),
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
        const filename = `devis-${devis?.reference || id}-${new Date().toISOString().split('T')[0]}.pdf`;
        
        await generatePDFFromHTML(data.html, filename);
        
        toast({
          title: "PDF généré",
          description: "Le PDF a été téléchargé avec succès",
        });
      }
    } catch (error: any) {
      console.error("Erreur téléchargement PDF:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de télécharger le PDF. Vérifiez que la fonction Edge est déployée.",
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
    
    toast({
      title: "Email préparé",
      description: "Votre client mail s'ouvre avec le message pré-rempli.",
    });
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
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 max-w-6xl">
        <div className="bg-white text-black p-4 sm:p-5 md:p-8 lg:p-12 rounded-lg shadow-lg border border-border">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b-2 border-gray-200">
            <div className="flex-1 min-w-0">
              {company?.logo_url && (
                <img src={company.logo_url} alt="Logo" className="h-12 sm:h-16 mb-3 sm:mb-4" />
              )}
              <h2 className="text-lg sm:text-xl font-bold break-words">{company?.nom_entreprise}</h2>
              <p className="text-xs sm:text-sm text-gray-600 break-words">{company?.adresse}</p>
              <p className="text-xs sm:text-sm text-gray-600 break-words">
                {company?.code_postal} {company?.ville}
              </p>
              {company?.siret && <p className="text-xs sm:text-sm text-gray-600">SIRET: {company?.siret}</p>}
              {company?.telephone && <p className="text-xs sm:text-sm text-gray-600">{company?.telephone}</p>}
              {company?.email && <p className="text-xs sm:text-sm text-gray-600 break-all">{company?.email}</p>}
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">DEVIS</h1>
              <p className="text-xs sm:text-sm">
                <span className="font-semibold">N°:</span> {devis.reference}
              </p>
              <p className="text-xs sm:text-sm">
                <span className="font-semibold">Date:</span>{" "}
                {new Date(devis.date_creation).toLocaleDateString("fr-FR")}
              </p>
              <p className="text-xs sm:text-sm">
                <span className="font-semibold">Valide jusqu'au:</span>{" "}
                {validUntil.toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>

          {/* Client Info */}
          <div className="mb-6 sm:mb-8">
            <h3 className="font-bold text-base sm:text-lg mb-2">Client</h3>
            <div className="bg-gray-50 p-3 sm:p-4 rounded">
              <p className="font-semibold text-sm sm:text-base break-words">
                {client?.entreprise || `${client?.prenom} ${client?.nom}`}
              </p>
              {client?.adresse && <p className="text-xs sm:text-sm break-words mt-1">{client.adresse}</p>}
              {client?.code_postal && (
                <p className="text-xs sm:text-sm mt-1 break-words">
                  {client.code_postal} {client.ville}
                </p>
              )}
              {client?.email && <p className="text-xs sm:text-sm mt-1 break-all">{client.email}</p>}
              {client?.telephone && <p className="text-xs sm:text-sm mt-1">{client.telephone}</p>}
            </div>
          </div>

          {/* Service Lines */}
          <div className="mb-6 sm:mb-8 overflow-x-auto -mx-2 sm:-mx-4 md:mx-0 px-2 sm:px-4 md:px-0">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-primary/10">
                  <th className="border border-gray-300 p-2 sm:p-3 text-left text-xs sm:text-sm min-w-[200px]">Description</th>
                  <th className="border border-gray-300 p-2 sm:p-3 text-center w-20 sm:w-24 text-xs sm:text-sm">Qté</th>
                  <th className="border border-gray-300 p-2 sm:p-3 text-right w-24 sm:w-32 text-xs sm:text-sm">P.U. HT</th>
                  <th className="border border-gray-300 p-2 sm:p-3 text-center w-16 sm:w-20 text-xs sm:text-sm">TVA</th>
                  <th className="border border-gray-300 p-2 sm:p-3 text-right w-24 sm:w-32 text-xs sm:text-sm">Total HT</th>
                </tr>
              </thead>
              <tbody>
                {devis.lignes_prestation.map((ligne: any, index: number) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2 sm:p-3 text-xs sm:text-sm break-words align-top">
                      <div className="font-medium">{ligne.description}</div>
                    </td>
                    <td className="border border-gray-300 p-2 sm:p-3 text-center text-xs sm:text-sm align-top">{ligne.quantite}</td>
                    <td className="border border-gray-300 p-2 sm:p-3 text-right text-xs sm:text-sm align-top">
                      {ligne.prix_unitaire.toFixed(2)} €
                    </td>
                    <td className="border border-gray-300 p-2 sm:p-3 text-center text-xs sm:text-sm align-top">{ligne.tva}%</td>
                    <td className="border border-gray-300 p-2 sm:p-3 text-right text-xs sm:text-sm align-top">
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
          <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm border-t-2 border-gray-200 pt-4 sm:pt-6">
            {devis.delai_realisation && (
              <div className="space-y-1">
                <p className="font-semibold">Délai de réalisation:</p>
                <p className="text-gray-600 break-words pl-2">{devis.delai_realisation}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="font-semibold">Conditions de paiement:</p>
              <p className="text-gray-600 break-words pl-2">{devis.conditions_paiement}</p>
            </div>
            {devis.notes && (
              <div className="space-y-1">
                <p className="font-semibold">Notes:</p>
                <p className="text-gray-600 whitespace-pre-wrap break-words pl-2">{devis.notes}</p>
              </div>
            )}
          </div>

          {/* Signatures Section */}
          <div className="mt-6 sm:mt-8 lg:mt-12 border-t-2 border-gray-200 pt-4 sm:pt-6 lg:pt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6 lg:mb-8">
              {/* Client Signature */}
              <div className="space-y-2 sm:space-y-3 lg:space-y-4 flex flex-col">
                <p className="font-semibold text-center text-xs sm:text-sm lg:text-base">Signature du client</p>
                {devis.client_signature_url ? (
                  <div className="border-2 border-gray-300 rounded p-2 h-32 sm:h-32 lg:h-40 flex items-center justify-center bg-gray-50 flex-shrink-0">
                    <img 
                      src={devis.client_signature_url} 
                      alt="Signature client" 
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded p-4 h-32 sm:h-32 lg:h-40 flex items-center justify-center bg-gray-50 flex-shrink-0">
                    <p className="text-gray-400 text-xs sm:text-sm">Signature en attente</p>
                  </div>
                )}
                <div className="space-y-1 text-center text-xs sm:text-sm mt-auto">
                  <p className="font-semibold">Date:</p>
                  <div className="border-b-2 border-gray-300 w-full sm:w-40 mx-auto pb-1">
                    {devis.date_signature 
                      ? new Date(devis.date_signature).toLocaleDateString("fr-FR")
                      : "___/___/_____"}
                  </div>
                </div>
              </div>

              {/* Company Signature */}
              <div className="space-y-2 sm:space-y-3 lg:space-y-4 flex flex-col">
                <p className="font-semibold text-center text-xs sm:text-sm lg:text-base">Signature de l'entreprise</p>
                {devis.company_signature_url ? (
                  <div className="border-2 border-gray-300 rounded p-2 h-32 sm:h-32 lg:h-40 flex items-center justify-center bg-gray-50 flex-shrink-0">
                    <img 
                      src={devis.company_signature_url} 
                      alt="Signature entreprise" 
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded p-4 h-32 sm:h-32 lg:h-40 flex items-center justify-center bg-gray-50 flex-shrink-0">
                    <p className="text-gray-400 text-xs sm:text-sm">Signature en attente</p>
                  </div>
                )}
                <div className="space-y-1 text-center text-xs sm:text-sm mt-auto">
                  <p className="font-semibold">Date:</p>
                  <div className="border-b-2 border-gray-300 w-full sm:w-40 mx-auto pb-1">
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
