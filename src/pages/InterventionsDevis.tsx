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
  terminee: { label: "Terminée", variant: "default" as const },
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
      const { data, error } = await supabase.functions.invoke("generate-pdf", {
        body: { type: "devis", id },
      });

      if (error) throw error;

      toast({
        title: "Téléchargement réussi",
        description: "Le devis a été téléchargé au format PDF",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Interventions & Devis</h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/interventions/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle intervention
          </Button>
          <Button onClick={() => navigate("/devis/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau devis
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="tous">Tous</TabsTrigger>
            <TabsTrigger value="interventions">Interventions</TabsTrigger>
            <TabsTrigger value="devis">Devis</TabsTrigger>
          </TabsList>
        </Tabs>

        {showInterventions && (
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "tous" ? "default" : "outline"}
              onClick={() => setStatusFilter("tous")}
              size="sm"
            >
              Tout
            </Button>
            <Button
              variant={statusFilter === "a_faire" ? "default" : "outline"}
              onClick={() => setStatusFilter("a_faire")}
              size="sm"
            >
              À faire
            </Button>
            <Button
              variant={statusFilter === "en_cours" ? "default" : "outline"}
              onClick={() => setStatusFilter("en_cours")}
              size="sm"
            >
              En cours
            </Button>
            <Button
              variant={statusFilter === "terminee" ? "default" : "outline"}
              onClick={() => setStatusFilter("terminee")}
              size="sm"
            >
              Terminée
            </Button>
          </div>
        )}

        {showDevis && typeFilter === "devis" && (
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "tous" ? "default" : "outline"}
              onClick={() => setStatusFilter("tous")}
              size="sm"
            >
              Tout
            </Button>
            <Button
              variant={statusFilter === "En attente" ? "default" : "outline"}
              onClick={() => setStatusFilter("En attente")}
              size="sm"
            >
              En attente
            </Button>
            <Button
              variant={statusFilter === "Envoyé" ? "default" : "outline"}
              onClick={() => setStatusFilter("Envoyé")}
              size="sm"
            >
              Envoyé
            </Button>
            <Button
              variant={statusFilter === "Accepté" ? "default" : "outline"}
              onClick={() => setStatusFilter("Accepté")}
              size="sm"
            >
              Accepté
            </Button>
            <Button
              variant={statusFilter === "Refusé" ? "default" : "outline"}
              onClick={() => setStatusFilter("Refusé")}
              size="sm"
            >
              Refusé
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {showInterventions &&
          filteredInterventions.map((intervention) => (
            <Card key={intervention.id} className="card-hover border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {intervention.titre}
                    </CardTitle>
                    <Badge className="mt-2" variant={interventionStatusConfig[intervention.statut as keyof typeof interventionStatusConfig]?.variant}>
                      {interventionStatusConfig[intervention.statut as keyof typeof interventionStatusConfig]?.label}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/interventions/${intervention.id}`)} className="hover:bg-primary/10 hover:text-primary">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteIntervention(intervention.id)} className="hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {intervention.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{intervention.description}</p>
                )}
                {intervention.clients && (
                  <div className="text-sm font-medium">
                    {intervention.clients.entreprise || `${intervention.clients.prenom} ${intervention.clients.nom}`}
                  </div>
                )}
                {intervention.adresse && (
                  <div className="text-sm text-muted-foreground">{intervention.adresse}</div>
                )}
                {intervention.date_intervention && (
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(intervention.date_intervention), "PPP", { locale: fr })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

        {showDevis &&
          filteredDevis.map((d) => (
            <Card key={d.id} className="card-hover border-l-4 border-l-secondary">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                      {d.reference}
                    </CardTitle>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant={devisStatusConfig[d.statut as keyof typeof devisStatusConfig]?.variant}>
                        {devisStatusConfig[d.statut as keyof typeof devisStatusConfig]?.label}
                      </Badge>
                      {d.pret_envoi && <Badge variant="default" className="bg-accent">Prêt</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/devis/preview/${d.id}`)} className="hover:bg-secondary/10 hover:text-secondary" title="Visualiser">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/devis/${d.id}`)} className="hover:bg-primary/10 hover:text-primary" title="Modifier">
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDownloadDevisPDF(d.id)} className="hover:bg-accent/10 hover:text-accent" title="Télécharger PDF">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteDevis(d.id)} className="hover:bg-destructive/10 hover:text-destructive" title="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {d.clients && (
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-secondary" />
                    <span>{d.clients.entreprise || `${d.clients.prenom} ${d.clients.nom}`}</span>
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  {format(new Date(d.date_creation), "PPP", { locale: fr })}
                </div>
                <div className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
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
