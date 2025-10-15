import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, Wrench } from "lucide-react";

interface Technicien {
  id: string;
  nom: string;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  specialite: string | null;
}

export default function Techniciens() {
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);

  useEffect(() => {
    loadTechniciens();
  }, []);

  const loadTechniciens = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("techniciens")
      .select("*")
      .eq("user_id", user.id);

    if (!error && data) {
      setTechniciens(data);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Techniciens</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {techniciens.map((tech) => (
          <Card key={tech.id}>
            <CardHeader>
              <CardTitle className="text-lg">
                {tech.prenom} {tech.nom}
              </CardTitle>
              {tech.specialite && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wrench className="h-4 w-4" />
                  <span>{tech.specialite}</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {tech.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{tech.email}</span>
                </div>
              )}
              {tech.telephone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{tech.telephone}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {techniciens.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              Votre profil technicien sera créé automatiquement
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
