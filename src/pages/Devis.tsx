import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, FileText, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Devis {
  id: string;
  numero_devis: string;
  date_devis: string;
  statut: string;
  total_ttc: number;
  clients: { nom: string; prenom: string; entreprise: string | null } | null;
}

const statusConfig = {
  brouillon: { label: "Brouillon", variant: "secondary" as const },
  envoye: { label: "Envoyé", variant: "default" as const },
  accepte: { label: "Accepté", variant: "default" as const },
  refuse: { label: "Refusé", variant: "destructive" as const },
  expire: { label: "Expiré", variant: "secondary" as const },
};

export default function Devis() {
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadDevis();
  }, []);

  const loadDevis = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("devis")
      .select("*, clients(nom, prenom, entreprise)")
      .eq("user_id", user.id)
      .order("date_devis", { ascending: false });

    if (!error && data) {
      setDevisList(data);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("devis").delete().eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } else {
      toast({
        title: "Devis supprimé",
        description: "Le devis a été supprimé avec succès.",
      });
      loadDevis();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Devis</h1>
        <Button onClick={() => navigate("/devis/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau devis
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {devisList.map((devis) => (
          <Card
            key={devis.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    Devis {devis.numero_devis}
                  </CardTitle>
                  <Badge className="mt-2" variant={statusConfig[devis.statut as keyof typeof statusConfig]?.variant}>
                    {statusConfig[devis.statut as keyof typeof statusConfig]?.label}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/devis/${devis.id}`);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(devis.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {devis.clients && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {devis.clients.entreprise || `${devis.clients.prenom} ${devis.clients.nom}`}
                  </span>
                </div>
              )}
              <div className="text-sm">
                Date: {format(new Date(devis.date_devis), "PPP", { locale: fr })}
              </div>
              <div className="text-lg font-bold text-primary">
                {parseFloat(String(devis.total_ttc)).toFixed(2)} € TTC
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {devisList.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Aucun devis trouvé</p>
            <Button onClick={() => navigate("/devis/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un devis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}