import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, FileText, Trash2, Eye, Download, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Intervention {
  id: string;
  titre: string;
  description: string | null;
  statut: string;
  date_intervention: string | null;
  adresse: string | null;
  rapport_pdf_url: string | null;
  clients: { nom: string; prenom: string; entreprise: string | null } | null;
}

interface Devis {
  id: string;
  reference: string;
  date_creation: string;
  statut: string;
  total_ttc: number;
  pret_envoi: boolean;
  clients: { nom: string; prenom: string; entreprise: string | null } | null;
}

const interventionStatusConfig = {
  a_faire: { label: "À faire", variant: "secondary" as const },
  en_cours: { label: "En cours", variant: "default" as const },
  termine: { label: "Terminée", variant: "default" as const },
};

const devisStatusConfig = {
  "En attente": { label: "En attente", variant: "secondary" as const },
  "Envoyé": { label: "Envoyé", variant: "outline" as const },
  "Accepté": { label: "Accepté", variant: "default" as const },
  "Refusé": { label: "Refusé", variant: "destructive" as const },
};

export default function InterventionsDevis() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [typeFilter, setTypeFilter] = useState<"tous" | "interventions" | "devis">("tous");
  const [statusFilter, setStatusFilter] = useState<string>("tous");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Charger les interventions
    const { data: interventionsData } = await supabase
      .from("interventions")
      .select("*, clients(nom, prenom, entreprise)")
      .eq("user_id", user.id)
      .order("date_intervention", { ascending: false });

    if (interventionsData) setInterventions(interventionsData);

    // Charger les devis
    const { data: devisData } = await supabase
      .from("devis")
      .select("*, clients(nom, prenom, entreprise)")
      .eq("user_id", user.id)
      .order("date_creation", { ascending: false });

    if (devisData) setDevis(devisData);
  };

  const handleDeleteIntervention = async (id: string) => {
    const { error } = await supabase.from("interventions").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } else {
      toast({ title: "Intervention supprimée", description: "L'intervention a été supprimée avec succès." });
      loadData();
    }
  };

  const handleDeleteDevis = async (id: string) => {
    const { error } = await supabase.from("devis").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } else {
      toast({ title: "Devis supprimé", description: "Le devis a été supprimé avec succès." });
      loadData();
    }
  };

  const handleDownloadDevisPDF = async (id: string) => {
    try {
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
        const errorData = await response.json().catch(() => ({ message: "Erreur inconnue" }));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.html) {
        // Utiliser la fonction de génération PDF pour télécharger le fichier
        const { generatePDFFromHTML } = await import("@/lib/pdfGenerator");
        const currentDevis = devis.find(d => d.id === id);
        const filename = `devis-${currentDevis?.reference || id}-${new Date().toISOString().split('T')[0]}.pdf`;
        
        await generatePDFFromHTML(data.html, filename);
        
        toast({
          title: "PDF téléchargé",
          description: "Le PDF a été téléchargé avec succès",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur de téléchargement",
        description: error.message || "Impossible de télécharger le PDF. Veuillez réessayer ou contacter le support.",
      });
    }
  };

  const handleDownloadInterventionPDF = async (id: string) => {
    try {
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

      // Vérifier que les variables d'environnement sont définies
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Variables d'environnement Supabase manquantes. Vérifiez votre fichier .env");
      }

      // Appeler l'Edge Function avec l'authentification
      const functionUrl = `${supabaseUrl}/functions/v1/generate-pdf`;
      console.log("Appel Edge Function:", functionUrl);
      
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: supabaseKey,
        },
        body: JSON.stringify({ type: "intervention", id }),
      });

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
        // Utiliser la fonction de génération PDF pour télécharger le fichier
        const { generatePDFFromHTML } = await import("@/lib/pdfGenerator");
        const intervention = interventions.find(i => i.id === id);
        const filename = `intervention-${intervention?.titre?.replace(/[^a-zA-Z0-9]/g, '-') || id}-${new Date().toISOString().split('T')[0]}.pdf`;
        
        await generatePDFFromHTML(data.html, filename);
        
        toast({
          title: "PDF téléchargé",
          description: "Le PDF a été téléchargé avec succès",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur de téléchargement",
        description: error.message || "Impossible de télécharger le PDF. Veuillez réessayer ou contacter le support.",
      });
    }
  };

  const filteredInterventions = interventions.filter((item) => {
    if (statusFilter === "tous") return true;
    return item.statut === statusFilter;
  });

  const filteredDevis = devis.filter((item) => {
    if (statusFilter === "tous") return true;
    return item.statut === statusFilter;
  });

  const showInterventions = typeFilter === "tous" || typeFilter === "interventions";
  const showDevis = typeFilter === "tous" || typeFilter === "devis";

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Interventions & Devis</h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate("/interventions/new")} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nouvelle intervention</span>
            <span className="sm:hidden">Intervention</span>
          </Button>
          <Button onClick={() => navigate("/devis/new")} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nouveau devis</span>
            <span className="sm:hidden">Devis</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:gap-4">
        <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="tous" className="flex-1 sm:flex-none">Tous</TabsTrigger>
            <TabsTrigger value="interventions" className="flex-1 sm:flex-none">Interventions</TabsTrigger>
            <TabsTrigger value="devis" className="flex-1 sm:flex-none">Devis</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filtres pour "Tous" - uniquement le bouton Tout */}
        {typeFilter === "tous" && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === "tous" ? "default" : "outline"}
              onClick={() => setStatusFilter("tous")}
              size="sm"
              className="text-xs md:text-sm"
            >
              Tout
            </Button>
          </div>
        )}

        {/* Filtres pour "Interventions" - Tout, À faire, En cours, Terminée */}
        {typeFilter === "interventions" && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === "tous" ? "default" : "outline"}
              onClick={() => setStatusFilter("tous")}
              size="sm"
              className="text-xs md:text-sm"
            >
              Tout
            </Button>
            <Button
              variant={statusFilter === "a_faire" ? "default" : "outline"}
              onClick={() => setStatusFilter("a_faire")}
              size="sm"
              className="text-xs md:text-sm"
            >
              À faire
            </Button>
            <Button
              variant={statusFilter === "en_cours" ? "default" : "outline"}
              onClick={() => setStatusFilter("en_cours")}
              size="sm"
              className="text-xs md:text-sm"
            >
              En cours
            </Button>
            <Button
              variant={statusFilter === "termine" ? "default" : "outline"}
              onClick={() => setStatusFilter("termine")}
              size="sm"
              className="text-xs md:text-sm"
            >
              Terminée
            </Button>
          </div>
        )}

        {/* Filtres pour "Devis" - Tout, En attente, Envoyé, Accepté, Refusé */}
        {typeFilter === "devis" && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === "tous" ? "default" : "outline"}
              onClick={() => setStatusFilter("tous")}
              size="sm"
              className="text-xs md:text-sm"
            >
              Tout
            </Button>
            <Button
              variant={statusFilter === "En attente" ? "default" : "outline"}
              onClick={() => setStatusFilter("En attente")}
              size="sm"
              className="text-xs md:text-sm"
            >
              En attente
            </Button>
            <Button
              variant={statusFilter === "Envoyé" ? "default" : "outline"}
              onClick={() => setStatusFilter("Envoyé")}
              size="sm"
              className="text-xs md:text-sm"
            >
              Envoyé
            </Button>
            <Button
              variant={statusFilter === "Accepté" ? "default" : "outline"}
              onClick={() => setStatusFilter("Accepté")}
              size="sm"
              className="text-xs md:text-sm"
            >
              Accepté
            </Button>
            <Button
              variant={statusFilter === "Refusé" ? "default" : "outline"}
              onClick={() => setStatusFilter("Refusé")}
              size="sm"
              className="text-xs md:text-sm"
            >
              Refusé
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {showInterventions &&
          filteredInterventions.map((intervention) => (
            <Card key={intervention.id} className="card-hover border-l-4 border-l-primary">
              <CardHeader className="p-4 md:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base md:text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
                      {intervention.titre}
                    </CardTitle>
                    <Badge className="mt-2" variant={interventionStatusConfig[intervention.statut as keyof typeof interventionStatusConfig]?.variant}>
                      {interventionStatusConfig[intervention.statut as keyof typeof interventionStatusConfig]?.label}
                    </Badge>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {/* Bouton Visualiser (œil) - pour toutes les interventions */}
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/interventions/preview/${intervention.id}`)} className="hover:bg-primary/10 hover:text-primary h-8 w-8" title="Visualiser">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {/* Bouton Modifier */}
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/interventions/${intervention.id}`)} className="hover:bg-primary/10 hover:text-primary h-8 w-8" title="Modifier">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    {/* Bouton Télécharger PDF */}
                    <Button variant="ghost" size="icon" onClick={() => handleDownloadInterventionPDF(intervention.id)} className="hover:bg-accent/10 hover:text-accent h-8 w-8" title="Télécharger PDF">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    {/* Bouton Supprimer */}
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteIntervention(intervention.id)} className="hover:bg-destructive/10 hover:text-destructive h-8 w-8" title="Supprimer">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 p-4 md:p-6 pt-0">
                {intervention.description && (
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{intervention.description}</p>
                )}
                {intervention.clients && (
                  <div className="text-xs md:text-sm font-medium truncate">
                    {intervention.clients.entreprise || `${intervention.clients.prenom} ${intervention.clients.nom}`}
                  </div>
                )}
                {intervention.adresse && (
                  <div className="text-xs md:text-sm text-muted-foreground truncate">{intervention.adresse}</div>
                )}
                {intervention.date_intervention && (
                  <div className="text-xs md:text-sm text-muted-foreground">
                    {format(new Date(intervention.date_intervention), "PPP", { locale: fr })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

        {showDevis &&
          filteredDevis.map((d) => (
            <Card key={d.id} className="card-hover border-l-4 border-l-secondary">
              <CardHeader className="p-4 md:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base md:text-lg bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent truncate">
                      {d.reference}
                    </CardTitle>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant={devisStatusConfig[d.statut as keyof typeof devisStatusConfig]?.variant} className="text-xs">
                        {devisStatusConfig[d.statut as keyof typeof devisStatusConfig]?.label}
                      </Badge>
                      {d.pret_envoi && <Badge variant="default" className="bg-accent text-xs">Prêt</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/devis/preview/${d.id}`)} className="hover:bg-secondary/10 hover:text-secondary h-8 w-8" title="Visualiser">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/devis/${d.id}`)} className="hover:bg-primary/10 hover:text-primary h-8 w-8" title="Modifier">
                      <FileText className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDownloadDevisPDF(d.id)} className="hover:bg-accent/10 hover:text-accent h-8 w-8" title="Télécharger PDF">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteDevis(d.id)} className="hover:bg-destructive/10 hover:text-destructive h-8 w-8" title="Supprimer">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 p-4 md:p-6 pt-0">
                {d.clients && (
                  <div className="flex items-center gap-2 text-xs md:text-sm font-medium">
                    <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 text-secondary flex-shrink-0" />
                    <span className="truncate">{d.clients.entreprise || `${d.clients.prenom} ${d.clients.nom}`}</span>
                  </div>
                )}
                <div className="text-xs md:text-sm text-muted-foreground">
                  {format(new Date(d.date_creation), "PPP", { locale: fr })}
                </div>
                <div className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {parseFloat(String(d.total_ttc)).toFixed(2)} € TTC
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {filteredInterventions.length === 0 && filteredDevis.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Aucun élément trouvé</p>
            <div className="flex gap-2">
              <Button onClick={() => navigate("/interventions/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une intervention
              </Button>
              <Button onClick={() => navigate("/devis/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un devis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
