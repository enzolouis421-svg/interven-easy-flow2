import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, Wrench, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function TechnicienProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [technicien, setTechnicien] = useState<any>(null);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    termine: 0,
    en_cours: 0,
    a_faire: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTechnicienData();
  }, [id]);

  const loadTechnicienData = async () => {
    if (!id) return;

    try {
      // Load technician
      const { data: techData, error: techError } = await supabase
        .from("techniciens")
        .select("*")
        .eq("id", id)
        .single();

      if (techError) throw techError;
      setTechnicien(techData);

      // Load interventions
      const { data: interventionsData, error: intError } = await supabase
        .from("interventions")
        .select("*, clients(nom, prenom)")
        .eq("technicien_id", id)
        .order("date_intervention", { ascending: false });

      if (intError) throw intError;
      setInterventions(interventionsData || []);

      // Calculate stats
      const total = interventionsData?.length || 0;
      const termine = interventionsData?.filter((i) => i.statut === "termine").length || 0;
      const en_cours = interventionsData?.filter((i) => i.statut === "en_cours").length || 0;
      const a_faire = interventionsData?.filter((i) => i.statut === "a_faire").length || 0;

      setStats({ total, termine, en_cours, a_faire });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!technicien) {
    return (
      <div className="container mx-auto p-8">
        <p>Technicien non trouvé</p>
      </div>
    );
  }

  const statusConfig = {
    termine: { label: "Terminé", variant: "default" as const, icon: CheckCircle, color: "text-green-500" },
    en_cours: { label: "En cours", variant: "secondary" as const, icon: Clock, color: "text-blue-500" },
    a_faire: { label: "À faire", variant: "outline" as const, icon: AlertCircle, color: "text-orange-500" },
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Profil du technicien</h1>
      </div>

      {/* Profile Info */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nom complet</p>
                <p className="text-lg font-semibold">
                  {technicien.prenom} {technicien.nom}
                </p>
              </div>
              {technicien.specialite && (
                <div>
                  <p className="text-sm text-muted-foreground">Spécialité</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Wrench className="h-4 w-4 text-primary" />
                    <p className="text-lg">{technicien.specialite}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {technicien.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-primary" />
                    <p className="text-lg">{technicien.email}</p>
                  </div>
                </div>
              )}
              {technicien.telephone && (
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-primary" />
                    <p className="text-lg">{technicien.telephone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-gradient">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gradient">{stats.total}</p>
              <p className="text-sm text-muted-foreground mt-1">Total interventions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-gradient">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">{stats.termine}</p>
              <p className="text-sm text-muted-foreground mt-1">Terminées</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-gradient">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-500">{stats.en_cours}</p>
              <p className="text-sm text-muted-foreground mt-1">En cours</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-gradient">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-500">{stats.a_faire}</p>
              <p className="text-sm text-muted-foreground mt-1">À faire</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interventions List */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des interventions</CardTitle>
        </CardHeader>
        <CardContent>
          {interventions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune intervention pour ce technicien
            </p>
          ) : (
            <div className="space-y-4">
              {interventions.map((intervention) => {
                const status = statusConfig[intervention.statut as keyof typeof statusConfig];
                const StatusIcon = status.icon;
                
                return (
                  <div
                    key={intervention.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/interventions/${intervention.id}`)}
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{intervention.titre}</h3>
                      <p className="text-sm text-muted-foreground">
                        Client: {intervention.clients?.prenom} {intervention.clients?.nom}
                      </p>
                      {intervention.date_intervention && (
                        <p className="text-sm text-muted-foreground">
                          Date: {new Date(intervention.date_intervention).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-5 w-5 ${status.color}`} />
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
