import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Users, Wrench, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalInterventions: 0,
    interventionsEnCours: 0,
    totalClients: 0,
    totalTechniciens: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [interventions, interventionsEnCours, clients, techniciens] = await Promise.all([
      supabase.from("interventions").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("interventions").select("id", { count: "exact" }).eq("user_id", user.id).eq("statut", "en_cours"),
      supabase.from("clients").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("techniciens").select("id", { count: "exact" }).eq("user_id", user.id),
    ]);

    setStats({
      totalInterventions: interventions.count || 0,
      interventionsEnCours: interventionsEnCours.count || 0,
      totalClients: clients.count || 0,
      totalTechniciens: techniciens.count || 0,
    });
  };

  const statsCards = [
    {
      title: "Interventions",
      value: stats.totalInterventions,
      icon: ClipboardList,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "En cours",
      value: stats.interventionsEnCours,
      icon: CheckCircle2,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Clients",
      value: stats.totalClients,
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Techniciens",
      value: stats.totalTechniciens,
      icon: Wrench,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue sur IntervenGo
          </p>
        </div>
        <Button onClick={() => navigate("/interventions/new")}>
          + Nouvelle intervention
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Button
            variant="outline"
            className="h-24"
            onClick={() => navigate("/interventions/new")}
          >
            <div className="flex flex-col items-center gap-2">
              <ClipboardList className="h-6 w-6" />
              <span>Nouvelle intervention</span>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-24"
            onClick={() => navigate("/clients")}
          >
            <div className="flex flex-col items-center gap-2">
              <Users className="h-6 w-6" />
              <span>Gérer les clients</span>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-24"
            onClick={() => navigate("/interventions")}
          >
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="h-6 w-6" />
              <span>Voir les interventions</span>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
