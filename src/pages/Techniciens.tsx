import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, Wrench, Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingTech) {
      // Update existing technician
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
        resetForm();
        loadTechniciens();
      }
    } else {
      // Create new technician
      const { error } = await supabase
        .from("techniciens")
        .insert({
          ...formData,
          user_id: user.id,
        });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.message,
        });
      } else {
        toast({
          title: "Technicien ajouté",
          description: "Le nouveau technicien a été créé avec succès.",
        });
        resetForm();
        loadTechniciens();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("techniciens")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } else {
      toast({
        title: "Technicien supprimé",
        description: "Le technicien a été supprimé avec succès.",
      });
      setDeletingId(null);
      loadTechniciens();
    }
  };

  const resetForm = () => {
    setOpen(false);
    setEditingTech(null);
    setFormData({
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      specialite: "",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gradient">Techniciens</h1>
          <p className="text-muted-foreground mt-2">
            Gérez votre équipe de techniciens
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="btn-gradient">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau technicien
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingTech ? "Modifier le technicien" : "Nouveau technicien"}
            </DialogTitle>
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
            <Button type="submit" className="w-full btn-gradient">
              {editingTech ? "Modifier" : "Ajouter"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce technicien ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {techniciens.map((tech, index) => (
          <Card 
            key={tech.id} 
            className="card-hover border-2 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg break-words">
                  {tech.prenom} {tech.nom}
                </CardTitle>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                    onClick={() => handleEdit(tech)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeletingId(tech.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
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
                <div className="flex items-center gap-2 text-sm break-all">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>{tech.email}</span>
                </div>
              )}
              {tech.telephone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>{tech.telephone}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {techniciens.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">Aucun technicien</p>
            <p className="text-muted-foreground mb-4">
              Commencez par ajouter votre premier technicien
            </p>
            <Button onClick={() => setOpen(true)} className="btn-gradient">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un technicien
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
