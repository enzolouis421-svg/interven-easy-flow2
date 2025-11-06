import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Users, Wrench, CheckCircle2, Euro, FileText, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalInterventions: 0,
    interventionsEnCours: 0,
    totalClients: 0,
    totalTechniciens: 0,
    totalCA: 0,
    devisStats: {
      enAttente: 0,
      envoye: 0,
      accepte: 0,
      refuse: 0,
    },
  });
  const [todayInterventions, setTodayInterventions] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
    loadTodayInterventions();
  }, []);

  const loadTodayInterventions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data } = await supabase
      .from("interventions")
      .select("*, clients!interventions_client_id_fkey(nom, prenom, entreprise)")
      .eq("user_id", user.id)
      .gte("date_intervention", today.toISOString())
      .lt("date_intervention", tomorrow.toISOString())
      .order("date_intervention");

    if (data) {
      setTodayInterventions(data);
    }
  };

  const loadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [interventions, interventionsEnCours, clients, techniciens, devisAcceptes, allDevis] = await Promise.all([
      supabase.from("interventions").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("interventions").select("id", { count: "exact" }).eq("user_id", user.id).eq("statut", "en_cours"),
      supabase.from("clients").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("techniciens").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("devis").select("total_ttc").eq("user_id", user.id).eq("statut", "Accepté"),
      supabase.from("devis").select("statut", { count: "exact" }).eq("user_id", user.id),
    ]);

    // Calculer le CA total
    const totalCA = devisAcceptes.data?.reduce((sum, devis) => sum + (Number(devis.total_ttc) || 0), 0) || 0;

    // Compter les devis par statut
    const devisParStatut = allDevis.data?.reduce((acc: any, devis) => {
      const statut = devis.statut;
      if (statut === "En attente") acc.enAttente++;
      else if (statut === "Envoyé") acc.envoye++;
      else if (statut === "Accepté") acc.accepte++;
      else if (statut === "Refusé") acc.refuse++;
      return acc;
    }, { enAttente: 0, envoye: 0, accepte: 0, refuse: 0 }) || { enAttente: 0, envoye: 0, accepte: 0, refuse: 0 };

    setStats({
      totalInterventions: interventions.count || 0,
      interventionsEnCours: interventionsEnCours.count || 0,
      totalClients: clients.count || 0,
      totalTechniciens: techniciens.count || 0,
      totalCA,
      devisStats: devisParStatut,
    });
  };

  const statsCards = [
    {
      title: "Interventions",
      value: stats.totalInterventions,
      icon: ClipboardList,
      color: "text-primary",
      bgColor: "bg-primary/10",
      gradient: "gradient-primary",
    },
    {
      title: "En cours",
      value: stats.interventionsEnCours,
      icon: CheckCircle2,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      gradient: "gradient-secondary",
    },
    {
      title: "Clients",
      value: stats.totalClients,
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
      gradient: "gradient-accent",
    },
    {
      title: "Chiffre d'affaires",
      value: `${stats.totalCA.toFixed(2)} €`,
      icon: Euro,
      color: "text-orange",
      bgColor: "bg-orange/10",
      gradient: "gradient-orange",
    },
  ];

  const devisChartData = [
    { name: "En attente", value: stats.devisStats.enAttente, color: "hsl(var(--muted))" },
    { name: "Envoyé", value: stats.devisStats.envoye, color: "hsl(var(--primary))" },
    { name: "Accepté", value: stats.devisStats.accepte, color: "hsl(var(--accent))" },
    { name: "Refusé", value: stats.devisStats.refuse, color: "hsl(var(--destructive))" },
  ];

  return (
    <div className="space-y-4 md:space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-4xl font-bold text-gradient">Tableau de bord</h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-lg">
          Bienvenue sur IntervenGo
        </p>
      </div>

      {/* Today's Interventions Alert */}
      {todayInterventions.length > 0 && (
        <Card className="border-2 border-primary bg-primary/5">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-primary text-base md:text-lg">
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              Interventions du jour ({todayInterventions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="space-y-2">
              {todayInterventions.map((intervention) => (
                <div
                  key={intervention.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-card rounded-lg border hover:border-primary transition-colors cursor-pointer"
                  onClick={() => navigate(`/interventions/${intervention.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm md:text-base truncate">{intervention.titre}</p>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">
                      {intervention.clients?.entreprise || 
                        `${intervention.clients?.prenom} ${intervention.clients?.nom}`}
                    </p>
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                    {intervention.date_intervention && 
                      new Date(intervention.date_intervention).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="card-hover border-2 overflow-hidden relative group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${stat.gradient}`} 
                 style={{ opacity: 0.05 }} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-semibold text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 p-4 md:p-6 pt-0">
              <div className="text-xl md:text-3xl font-bold truncate">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 md:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="card-hover border-2">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg lg:text-xl">
              <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
              Répartition des devis
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center p-4 md:p-6 pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={devisChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {devisChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 mt-4 w-full">
              {devisChartData.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center gap-2 text-xs md:text-sm">
                  <div 
                    className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-muted-foreground truncate">
                    {entry.name}: <span className="font-semibold text-foreground">{entry.value}</span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover border-2">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:gap-4 grid-cols-2 p-4 md:p-6 pt-0">
            <Button
              variant="outline"
              className="h-20 md:h-24 hover:bg-primary/5 border-2 hover:border-primary transition-all duration-300"
              onClick={() => navigate("/interventions/new")}
            >
              <div className="flex flex-col items-center gap-1.5 md:gap-2">
                <ClipboardList className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                <span className="font-semibold text-xs md:text-sm text-center leading-tight">Nouvelle intervention</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-20 md:h-24 hover:bg-accent/5 border-2 hover:border-accent transition-all duration-300"
              onClick={() => navigate("/clients")}
            >
              <div className="flex flex-col items-center gap-1.5 md:gap-2">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-accent" />
                <span className="font-semibold text-xs md:text-sm text-center leading-tight">Gérer les clients</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-20 md:h-24 hover:bg-secondary/5 border-2 hover:border-secondary transition-all duration-300"
              onClick={() => navigate("/interventions-devis")}
            >
              <div className="flex flex-col items-center gap-1.5 md:gap-2">
                <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-secondary" />
                <span className="font-semibold text-xs md:text-sm text-center leading-tight">Interventions & Devis</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-20 md:h-24 hover:bg-orange/5 border-2 hover:border-orange transition-all duration-300"
              onClick={() => navigate("/devis/new")}
            >
              <div className="flex flex-col items-center gap-1.5 md:gap-2">
                <FileText className="h-5 w-5 md:h-6 md:w-6 text-orange" />
                <span className="font-semibold text-xs md:text-sm text-center leading-tight">Nouveau devis</span>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
