import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, User, MapPin } from "lucide-react";
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

interface Intervention {
  id: string;
  titre: string;
  date_intervention: string;
  statut: string;
  adresse: string;
  techniciens: {
    nom: string;
    prenom: string;
  } | null;
  clients: {
    nom: string;
    prenom: string;
    entreprise: string | null;
  } | null;
}

export default function Calendar() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  useEffect(() => {
    loadWeekInterventions();
  }, [currentWeekStart]);

  const loadWeekInterventions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

    const { data, error } = await supabase
      .from("interventions")
      .select(`
        *,
        techniciens!interventions_technicien_id_fkey(nom, prenom),
        clients!interventions_client_id_fkey(nom, prenom, entreprise)
      `)
      .eq("user_id", user.id)
      .gte("date_intervention", currentWeekStart.toISOString())
      .lte("date_intervention", weekEnd.toISOString())
      .order("date_intervention");

    if (!error && data) {
      setInterventions(data);
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const getInterventionsForDay = (day: Date) => {
    return interventions.filter((intervention) =>
      isSameDay(new Date(intervention.date_intervention), day)
    );
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "a_faire":
        return "bg-muted text-muted-foreground";
      case "en_cours":
        return "bg-primary/10 text-primary";
      case "termine":
        return "bg-accent/10 text-accent";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case "a_faire":
        return "À faire";
      case "en_cours":
        return "En cours";
      case "termine":
        return "Terminé";
      default:
        return statut;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-gradient">Calendrier</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Semaine du {format(currentWeekStart, "d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}
            className="px-3 md:px-4 py-2 text-sm md:text-base rounded-lg border-2 border-border hover:bg-primary/5 transition-colors"
          >
            <span className="hidden sm:inline">Semaine précédente</span>
            <span className="sm:hidden">Préc.</span>
          </button>
          <button
            onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="px-3 md:px-4 py-2 text-sm md:text-base rounded-lg border-2 border-primary text-primary hover:bg-primary/10 transition-colors"
          >
            <span className="hidden sm:inline">Cette semaine</span>
            <span className="sm:hidden">Actuelle</span>
          </button>
          <button
            onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}
            className="px-3 md:px-4 py-2 text-sm md:text-base rounded-lg border-2 border-border hover:bg-primary/5 transition-colors"
          >
            <span className="hidden sm:inline">Semaine suivante</span>
            <span className="sm:hidden">Suiv.</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 md:gap-4">
        {weekDays.map((day, index) => {
          const dayInterventions = getInterventionsForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <Card
              key={index}
              className={`card-hover border-2 ${isToday ? "border-primary shadow-glow" : ""}`}
            >
              <CardHeader className={`pb-3 ${isToday ? "bg-primary/5" : ""}`}>
                <CardTitle className="text-center">
                  <div className="flex flex-col sm:flex-col items-center gap-1">
                    <span className="text-xs md:text-sm font-semibold text-muted-foreground uppercase">
                      {format(day, "EEEE", { locale: fr })}
                    </span>
                    <span className={`text-xl md:text-2xl font-bold ${isToday ? "text-primary" : ""}`}>
                      {format(day, "d MMM", { locale: fr })}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dayInterventions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune intervention
                  </p>
                ) : (
                  dayInterventions.map((intervention) => (
                    <div
                      key={intervention.id}
                      className="p-3 rounded-lg border border-border hover:border-primary transition-colors space-y-2 bg-card"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm line-clamp-2">
                          {intervention.titre}
                        </h4>
                        <Badge className={`text-xs ${getStatusColor(intervention.statut)}`}>
                          {getStatusLabel(intervention.statut)}
                        </Badge>
                      </div>
                      
                      {intervention.date_intervention && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(intervention.date_intervention), "HH:mm")}
                        </div>
                      )}

                      {intervention.clients && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {intervention.clients.entreprise ||
                            `${intervention.clients.prenom} ${intervention.clients.nom}`}
                        </div>
                      )}

                      {intervention.adresse && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="line-clamp-1">{intervention.adresse}</span>
                        </div>
                      )}

                      {intervention.techniciens && (
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="text-xs">
                            {intervention.techniciens.prenom} {intervention.techniciens.nom}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
