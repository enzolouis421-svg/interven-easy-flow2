import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload } from "lucide-react";

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nom_entreprise: "",
    siret: "",
    adresse: "",
    code_postal: "",
    ville: "",
    telephone: "",
    email: "",
    logo_url: "",
    conditions_generales: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("company_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!error && data) {
      setFormData({
        nom_entreprise: data.nom_entreprise || "",
        siret: data.siret || "",
        adresse: data.adresse || "",
        code_postal: data.code_postal || "",
        ville: data.ville || "",
        telephone: data.telephone || "",
        email: data.email || "",
        logo_url: data.logo_url || "",
        conditions_generales: data.conditions_generales || "",
      });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploading(true);
    const file = e.target.files[0];
    const fileName = `logo-${Date.now()}.${file.name.split(".").pop()}`;

    try {
      const { data, error } = await supabase.storage
        .from("intervention-photos")
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("intervention-photos")
        .getPublicUrl(fileName);

      setFormData({ ...formData, logo_url: urlData.publicUrl });

      toast({
        title: "Logo chargé",
        description: "Le logo a été chargé avec succès",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const { data: existing } = await supabase
        .from("company_settings")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("company_settings")
          .update({ ...formData, user_id: user.id })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("company_settings")
          .insert({ ...formData, user_id: user.id });

        if (error) throw error;
      }

      toast({
        title: "Paramètres enregistrés",
        description: "Vos paramètres ont été enregistrés avec succès",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Paramètres de l'entreprise</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations de l'entreprise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom_entreprise">Nom de l'entreprise *</Label>
              <Input
                id="nom_entreprise"
                value={formData.nom_entreprise}
                onChange={(e) =>
                  setFormData({ ...formData, nom_entreprise: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siret">SIRET</Label>
              <Input
                id="siret"
                value={formData.siret}
                onChange={(e) =>
                  setFormData({ ...formData, siret: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo</Label>
              <div className="flex items-center gap-4">
                {formData.logo_url && (
                  <img
                    src={formData.logo_url}
                    alt="Logo"
                    className="h-16 w-16 object-contain border rounded"
                  />
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("logo-upload")?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Chargement..." : "Charger un logo"}
                </Button>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coordonnées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code_postal">Code postal</Label>
                <Input
                  id="code_postal"
                  value={formData.code_postal}
                  onChange={(e) =>
                    setFormData({ ...formData, code_postal: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ville">Ville</Label>
                <Input
                  id="ville"
                  value={formData.ville}
                  onChange={(e) =>
                    setFormData({ ...formData, ville: e.target.value })
                  }
                />
              </div>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conditions générales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="conditions_generales">
                Conditions générales de vente
              </Label>
              <Textarea
                id="conditions_generales"
                value={formData.conditions_generales}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    conditions_generales: e.target.value,
                  })
                }
                rows={6}
                placeholder="Ces conditions seront automatiquement ajoutées à vos devis..."
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          Enregistrer les paramètres
        </Button>
      </form>
    </div>
  );
}