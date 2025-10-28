import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, FileDown, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function InterventionPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [intervention, setIntervention] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntervention();
  }, [id]);

  const loadIntervention = async () => {
    if (!id) return;

    try {
      const { data: interventionData, error: interventionError } = await supabase
        .from("interventions")
        .select("*")
        .eq("id", id)
        .single();

      if (interventionError) throw interventionError;

      const { data: clientData } = await supabase
        .from("clients")
        .select("*")
        .eq("id", interventionData.client_id)
        .maybeSingle();

      const { data: companyData } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", interventionData.user_id)
        .single();

      setIntervention(interventionData);
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
    const printWindow = window.open("", "_blank");
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-pdf", {
        body: { type: "intervention", id },
      });

      if (error) {
        if (printWindow) printWindow.close();
        throw error;
      }

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

  const handleSendEmail = () => {
    if (!client?.email) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Ce client n'a pas d'adresse email.",
      });
      return;
    }

    const subject = encodeURIComponent(`Rapport d'intervention - ${intervention.titre}`);
    const body = encodeURIComponent(
      `Bonjour ${client.prenom || ""} ${client.nom},\n\n` +
      `Veuillez trouver ci-joint le rapport de l'intervention réalisée.\n\n` +
      `Titre: ${intervention.titre}\n` +
      `Date: ${intervention.date_intervention ? format(new Date(intervention.date_intervention), "PPP", { locale: fr }) : ""}\n\n` +
      `N'hésitez pas à me contacter pour toute question.\n\n` +
      `Cordialement,\n` +
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

  if (!intervention) {
    return (
      <div className="container mx-auto p-8">
        <p>Intervention non trouvée</p>
      </div>
    );
  }

  const statusLabels = {
    a_faire: "À faire",
    en_cours: "En cours",
    termine: "Terminée",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Actions Bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/interventions/${id}`)} className="hidden md:flex">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button variant="outline" size="sm" onClick={handleSendEmail}>
              <Mail className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Envoyer</span>
            </Button>
            <Button size="sm" onClick={handleDownloadPDF} className="btn-gradient">
              <FileDown className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Télécharger PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Intervention Preview */}
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
              <h1 className="text-3xl font-bold text-primary mb-2">INTERVENTION</h1>
              <p className="text-sm">
                <span className="font-semibold">Date:</span>{" "}
                {intervention.date_intervention
                  ? format(new Date(intervention.date_intervention), "PPP", { locale: fr })
                  : "Non définie"}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Statut:</span>{" "}
                {statusLabels[intervention.statut as keyof typeof statusLabels]}
              </p>
            </div>
          </div>

          {/* Client Info */}
          {client && (
            <div className="mb-8">
              <h3 className="font-bold text-lg mb-2">Client</h3>
              <div className="bg-gray-50 p-4 rounded">
                <p className="font-semibold">
                  {client.entreprise || `${client.prenom} ${client.nom}`}
                </p>
                {client.adresse && <p className="text-sm">{client.adresse}</p>}
                {client.code_postal && (
                  <p className="text-sm">
                    {client.code_postal} {client.ville}
                  </p>
                )}
                {client.email && <p className="text-sm">{client.email}</p>}
                {client.telephone && <p className="text-sm">{client.telephone}</p>}
              </div>
            </div>
          )}

          {/* Intervention Details */}
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-lg mb-2">Titre</h3>
              <p className="text-gray-700">{intervention.titre}</p>
            </div>

            {intervention.adresse && (
              <div>
                <h3 className="font-bold text-lg mb-2">Adresse d'intervention</h3>
                <p className="text-gray-700">{intervention.adresse}</p>
              </div>
            )}

            {intervention.description && (
              <div>
                <h3 className="font-bold text-lg mb-2">Description du problème</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{intervention.description}</p>
              </div>
            )}

            {intervention.materiel_utilise && (
              <div>
                <h3 className="font-bold text-lg mb-2">Matériel utilisé</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{intervention.materiel_utilise}</p>
              </div>
            )}

            {intervention.commentaire_technicien && (
              <div>
                <h3 className="font-bold text-lg mb-2">Commentaire du technicien</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{intervention.commentaire_technicien}</p>
              </div>
            )}

            {intervention.photos && intervention.photos.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-4">Photos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {intervention.photos.map((url: string, index: number) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Photo ${index + 1}`}
                      className="rounded-lg border border-gray-200 w-full h-48 object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            {intervention.signature_url && (
              <div className="mt-8 border-t-2 border-gray-200 pt-8">
                <h3 className="font-bold text-lg mb-4">Signature client</h3>
                <div className="border-2 border-gray-300 rounded p-4 inline-block bg-gray-50">
                  <img
                    src={intervention.signature_url}
                    alt="Signature client"
                    className="max-h-32"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Signature électronique conforme au règlement eIDAS
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
