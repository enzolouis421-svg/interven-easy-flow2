import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, Wrench, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

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
  const [open, setOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technicien | null>(null);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    specialite: "",
  });

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

  const handleEdit = (tech: Technicien) => {
    setEditingTech(tech);
    setFormData({
      nom: tech.nom,
      prenom: tech.prenom || "",
      email: tech.email || "",
      telephone: tech.telephone || "",
      specialite: tech.specialite || "",
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTech) return;

    const { error } = await supabase
      .from("techniciens")
      .update(formData)
      .eq("id", editingTech.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } else {
      toast({
        title: "Technicien modifié",
        description: "Les informations ont été mises à jour.",
      });
      setOpen(false);
      setEditingTech(null);
      setFormData({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        specialite: "",
      });
      loadTechniciens();
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Techniciens</h1>

      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setEditingTech(null);
          setFormData({
            nom: "",
            prenom: "",
            email: "",
            telephone: "",
            specialite: "",
          });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le technicien</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) =>
                    setFormData({ ...formData, prenom: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                type="tel"
                value={formData.telephone}
                onChange={(e) =>
                  setFormData({ ...formData, telephone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialite">Spécialité</Label>
              <Input
                id="specialite"
                value={formData.specialite}
                onChange={(e) =>
                  setFormData({ ...formData, specialite: e.target.value })
                }
              />
            </div>
            <Button type="submit" className="w-full">
              Modifier
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {techniciens.map((tech) => (
          <Card key={tech.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">
                  {tech.prenom} {tech.nom}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(tech)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
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
