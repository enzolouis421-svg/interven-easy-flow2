import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Mail, Phone, MapPin, Trash2, Edit, Bell } from "lucide-react";
import { formatPhoneNumber } from "@/lib/formatters";

interface Client {
  id: string;
  nom: string;
  prenom: string | null;
  entreprise: string | null;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    entreprise: "",
    email: "",
    telephone: "",
    adresse: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("nom");

    if (!error && data) {
      setClients(data);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingId(client.id);
    setFormData({
      nom: client.nom,
      prenom: client.prenom || "",
      entreprise: client.entreprise || "",
      email: client.email || "",
      telephone: client.telephone || "",
      adresse: client.adresse || "",
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingId) {
      const { error } = await supabase
        .from("clients")
        .update(formData)
        .eq("id", editingId);

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.message,
        });
      } else {
        toast({
          title: "Client modifié",
          description: "Le client a été modifié avec succès.",
        });
      }
    } else {
      const { error } = await supabase.from("clients").insert({
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
          title: "Client ajouté",
          description: "Le client a été ajouté avec succès.",
        });
      }
    }

    setOpen(false);
    setEditingId(null);
    setFormData({
      nom: "",
      prenom: "",
      entreprise: "",
      email: "",
      telephone: "",
      adresse: "",
    });
    loadClients();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("clients").delete().eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } else {
      toast({
        title: "Client supprimé",
        description: "Le client a été supprimé avec succès.",
      });
      loadClients();
    }
  };

  const handleRelance = async (client: Client) => {
    if (!client.email) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Ce client n'a pas d'adresse email.",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer les factures en retard pour ce client
      const { data: factures, error: facturesError } = await supabase
        .from("factures")
        .select("*")
        .eq("client_id", client.id)
        .eq("user_id", user.id)
        .in("statut", ["Non payée", "En retard"])
        .order("date_echeance", { ascending: true });

      if (facturesError) {
        throw facturesError;
      }

      // Récupérer les informations de l'entreprise
      const { data: company } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!factures || factures.length === 0) {
        toast({
          title: "Aucune facture en retard",
          description: "Ce client n'a pas de facture en retard à relancer.",
        });
        return;
      }

      // Calculer les jours de retard pour chaque facture
      const facturesAvecRetard = factures.map((facture: any) => {
        if (!facture.date_echeance) return { ...facture, joursRetard: 0 };
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const echeance = new Date(facture.date_echeance);
        echeance.setHours(0, 0, 0, 0);
        const diffTime = today.getTime() - echeance.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return { ...facture, joursRetard: diffDays > 0 ? diffDays : 0 };
      }).filter((f: any) => f.joursRetard > 0);

      if (facturesAvecRetard.length === 0) {
        toast({
          title: "Aucune facture en retard",
          description: "Ce client n'a pas de facture en retard à relancer.",
        });
        return;
      }

      // Trier par jours de retard (plus urgent en premier)
      facturesAvecRetard.sort((a: any, b: any) => b.joursRetard - a.joursRetard);

      // Générer le message adapté
      const factureLaPlusUrgente = facturesAvecRetard[0];
      const joursRetardMax = factureLaPlusUrgente.joursRetard;
      const prenom = client.prenom || "";
      const nomEntreprise = company?.nom_entreprise || "";
      const emailEntreprise = company?.email || "";
      const telephoneEntreprise = company?.telephone || "";

      let message = `Bonjour ${prenom},\n\n`;

      // Message adapté selon le niveau de retard le plus élevé
      if (joursRetardMax <= 7) {
        message += `Nous vous rappelons que vous avez ${facturesAvecRetard.length} facture${facturesAvecRetard.length > 1 ? "s" : ""} en retard.\n\n`;
        message += `Détail des factures :\n`;
        facturesAvecRetard.forEach((f: any) => {
          message += `- Facture ${f.reference} : ${f.total_ttc?.toFixed(2) || "0.00"} € (${f.joursRetard} jour${f.joursRetard > 1 ? "s" : ""} de retard)\n`;
        });
        message += `\nIl s'agit probablement d'un simple oubli. Nous vous serions reconnaissants de bien vouloir procéder au règlement dans les plus brefs délais.\n\n`;
        message += `N'hésitez pas à nous contacter si vous rencontrez des difficultés ou si vous souhaitez mettre en place un échéancier.\n\n`;
      } else if (joursRetardMax <= 15) {
        message += `Vous avez ${facturesAvecRetard.length} facture${facturesAvecRetard.length > 1 ? "s" : ""} en retard.\n\n`;
        message += `Détail des factures :\n`;
        facturesAvecRetard.forEach((f: any) => {
          message += `- Facture ${f.reference} : ${f.total_ttc?.toFixed(2) || "0.00"} € (${f.joursRetard} jour${f.joursRetard > 1 ? "s" : ""} de retard)\n`;
        });
        message += `\nNous vous prions de bien vouloir régulariser cette situation dans les plus brefs délais.\n\n`;
        message += `Si vous avez déjà effectué le paiement, merci de nous en informer. Dans le cas contraire, nous vous remercions de procéder au règlement sans délai.\n\n`;
      } else if (joursRetardMax <= 30) {
        message += `Vous avez ${facturesAvecRetard.length} facture${facturesAvecRetard.length > 1 ? "s" : ""} en retard.\n\n`;
        message += `Détail des factures :\n`;
        facturesAvecRetard.forEach((f: any) => {
          message += `- Facture ${f.reference} : ${f.total_ttc?.toFixed(2) || "0.00"} € (${f.joursRetard} jour${f.joursRetard > 1 ? "s" : ""} de retard)\n`;
        });
        message += `\nMalgré nos précédents rappels, nous n'avons pas reçu le règlement de ces factures.\n\n`;
        message += `Nous vous demandons de procéder au règlement immédiatement. À défaut de paiement dans les 7 jours, nous nous verrons contraints d'engager une procédure de recouvrement.\n\n`;
        message += `Nous restons à votre disposition pour trouver une solution amiable.\n\n`;
      } else {
        message += `Vous avez ${facturesAvecRetard.length} facture${facturesAvecRetard.length > 1 ? "s" : ""} en retard.\n\n`;
        message += `Détail des factures :\n`;
        facturesAvecRetard.forEach((f: any) => {
          message += `- Facture ${f.reference} : ${f.total_ttc?.toFixed(2) || "0.00"} € (${f.joursRetard} jour${f.joursRetard > 1 ? "s" : ""} de retard)\n`;
        });
        const totalDu = facturesAvecRetard.reduce((sum: number, f: any) => sum + (f.total_ttc || 0), 0);
        message += `\nTotal dû : ${totalDu.toFixed(2)} €\n\n`;
        message += `Malgré nos multiples relances, le règlement de ces factures n'a toujours pas été effectué.\n\n`;
        message += `Cette situation ne peut plus durer. Nous vous demandons de régulariser ces factures dans un délai de 5 jours ouvrés.\n\n`;
        message += `Passé ce délai, nous nous verrons dans l'obligation de confier le recouvrement de ces créances à un organisme spécialisé, ce qui entraînera des frais supplémentaires à votre charge.\n\n`;
        message += `Nous espérons que vous comprendrez la nécessité de régulariser cette situation rapidement.\n\n`;
      }

      message += `Cordialement,\n`;
      message += `${nomEntreprise}\n`;
      message += `${emailEntreprise}\n`;
      message += `${telephoneEntreprise}`;

      const subject = encodeURIComponent(
        `Relance factures en retard${facturesAvecRetard.length > 1 ? ` (${facturesAvecRetard.length} factures)` : ""}`
      );
      const body = encodeURIComponent(message);

      window.location.href = `mailto:${client.email}?subject=${subject}&body=${body}`;

      toast({
        title: "Email de relance préparé",
        description: `Relance pour ${facturesAvecRetard.length} facture${facturesAvecRetard.length > 1 ? "s" : ""} en retard.`,
      });
    } catch (error: any) {
      console.error("Erreur relance client:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de préparer la relance.",
      });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Clients</h1>
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setEditingId(null);
            setFormData({
              nom: "",
              prenom: "",
              entreprise: "",
              email: "",
              telephone: "",
              adresse: "",
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Modifier le client" : "Ajouter un client"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) =>
                      setFormData({ ...formData, nom: e.target.value })
                    }
                    required
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
              {/* Champ entreprise masqué pour usage solo - conservé en base pour compatibilité */}
              <div className="space-y-2 hidden">
                <Label htmlFor="entreprise">Entreprise</Label>
                <Input
                  id="entreprise"
                  value={formData.entreprise}
                  onChange={(e) =>
                    setFormData({ ...formData, entreprise: e.target.value })
                  }
                />
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
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setFormData({ ...formData, telephone: formatted });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) =>
                    setFormData({ ...formData, adresse: e.target.value })
                  }
                />
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Modifier" : "Ajouter"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <Card key={client.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">
                  {client.prenom} {client.nom}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(client)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(client.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              {client.entreprise && (
                <p className="text-sm text-muted-foreground">
                  {client.entreprise}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {client.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.telephone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.telephone}</span>
                </div>
              )}
              {client.adresse && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="line-clamp-2">{client.adresse}</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => handleRelance(client)}
              >
                <Bell className="h-4 w-4 mr-2" />
                Relancer
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {clients.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Aucun client trouvé</p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un client
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
