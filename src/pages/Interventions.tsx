import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, MapPin, Calendar, Users, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Intervention {
  id: string;
  titre: string;
  description: string;
  statut: "a_faire" | "en_cours" | "termine";
  date_intervention: string;
  adresse: string;
  clients: { nom: string; prenom: string } | null;
}

const statusConfig = {
  a_faire: { label: "À faire", variant: "status-badge-todo" as const },
  en_cours: { label: "En cours", variant: "status-badge-progress" as const },
  termine: { label: "Terminé", variant: "status-badge-done" as const },
};

export default function Interventions() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [filter, setFilter] = useState<"all" | "a_faire" | "en_cours" | "termine">("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadInterventions();
  }, []);

  const loadInterventions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("interventions")
      .select("*, clients(nom, prenom)")
      .eq("user_id", user.id)
      .order("date_intervention", { ascending: false });

    if (!error && data) {
      setInterventions(data);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("interventions").delete().eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } else {
      toast({
        title: "Intervention supprimée",
        description: "L'intervention a été supprimée avec succès.",
      });
      loadInterventions();
    }
  };

  const filteredInterventions = filter === "all"
    ? interventions
    : interventions.filter((i) => i.statut === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Interventions</h1>
        <Button onClick={() => navigate("/interventions/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle intervention
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          Toutes
        </Button>
        <Button
          variant={filter === "a_faire" ? "default" : "outline"}
          onClick={() => setFilter("a_faire")}
        >
          À faire
        </Button>
        <Button
          variant={filter === "en_cours" ? "default" : "outline"}
          onClick={() => setFilter("en_cours")}
        >
          En cours
        </Button>
        <Button
          variant={filter === "termine" ? "default" : "outline"}
          onClick={() => setFilter("termine")}
        >
          Terminées
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredInterventions.map((intervention) => (
          <Card
            key={intervention.id}
            className="hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{intervention.titre}</CardTitle>
                <div className="flex gap-2 items-center">
                  <Badge className={statusConfig[intervention.statut].variant}>
                    {statusConfig[intervention.statut].label}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/interventions/${intervention.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(intervention.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {intervention.description}
              </p>
              {intervention.clients && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {intervention.clients.prenom} {intervention.clients.nom}
                  </span>
                </div>
              )}
              {intervention.adresse && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="line-clamp-1">{intervention.adresse}</span>
                </div>
              )}
              {intervention.date_intervention && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(intervention.date_intervention), "PPP", {
                      locale: fr,
                    })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInterventions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              Aucune intervention trouvée
            </p>
            <Button onClick={() => navigate("/interventions/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une intervention
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
