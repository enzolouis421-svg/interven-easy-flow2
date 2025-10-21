import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Save, FileDown, MapPin, X } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

interface Client {
  id: string;
  nom: string;
  prenom: string | null;
}

interface Intervention {
  titre: string;
  description: string;
  client_id: string;
  adresse: string;
  materiel_utilise: string;
  commentaire_technicien: string;
  statut: "a_faire" | "en_cours" | "termine";
  date_intervention: string;
  photos: string[];
  signature_url: string;
}

export default function InterventionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);

  const [formData, setFormData] = useState<Intervention>({
    titre: "",
    description: "",
    client_id: "",
    adresse: "",
    materiel_utilise: "",
    commentaire_technicien: "",
    statut: "a_faire",
    date_intervention: new Date().toISOString().slice(0, 16),
    photos: [],
    signature_url: "",
  });

  useEffect(() => {
    loadClients();
    if (id && id !== "new") {
      loadIntervention();
    }
  }, [id]);

  const loadClients = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("clients")
      .select("id, nom, prenom")
      .eq("user_id", user.id);

    if (!error && data) {
      setClients(data);
    }
  };

  const loadIntervention = async () => {
    if (!id || id === "new") return;

    const { data, error } = await supabase
      .from("interventions")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      setFormData({
        titre: data.titre || "",
        description: data.description || "",
        client_id: data.client_id || "",
        adresse: data.adresse || "",
        materiel_utilise: data.materiel_utilise || "",
        commentaire_technicien: data.commentaire_technicien || "",
        statut: data.statut || "a_faire",
        date_intervention: data.date_intervention
          ? new Date(data.date_intervention).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
        photos: data.photos || [],
        signature_url: data.signature_url || "",
      });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("intervention-photos")
        .upload(fileName, file);

      if (!uploadError) {
        const { data } = supabase.storage
          .from("intervention-photos")
          .getPublicUrl(fileName);
        uploadedUrls.push(data.publicUrl);
      }
    }

    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...uploadedUrls],
    }));
    setUploading(false);
    toast({
      title: "Photos ajoutées",
      description: `${uploadedUrls.length} photo(s) ajoutée(s)`,
    });
  };

  const saveSignature = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const canvas = signatureRef.current.getCanvas();
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((blob) => resolve(blob!), "image/png")
    );

    const fileName = `${user.id}/${Date.now()}.png`;
    const { error } = await supabase.storage
      .from("signatures")
      .upload(fileName, blob);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder la signature",
      });
      return null;
    }

    const { data } = supabase.storage.from("signatures").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Save signature if present
    let signatureUrl = formData.signature_url;
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const url = await saveSignature();
      if (url) signatureUrl = url;
    }

    const dataToSave = {
      ...formData,
      signature_url: signatureUrl,
      user_id: user.id,
    };

    let error;
    if (id && id !== "new") {
      ({ error } = await supabase
        .from("interventions")
        .update(dataToSave)
        .eq("id", id));
    } else {
      ({ error } = await supabase.from("interventions").insert(dataToSave));
    }

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } else {
      toast({
        title: "Succès",
        description: "Intervention enregistrée",
      });
      navigate("/interventions");
    }
    setLoading(false);
  };

  const openInMaps = () => {
    if (formData.adresse) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          formData.adresse
        )}`,
        "_blank"
      );
    }
  };

  const generatePDF = async () => {
    if (!id || id === "new") {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez d'abord enregistrer l'intervention",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("generate-pdf", {
        body: { type: "intervention", id },
      });

      if (error) throw error;

      // Ouvrir le HTML dans une nouvelle fenêtre pour l'imprimer en PDF
      if (data.html) {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(data.html);
          printWindow.document.close();
          
          // Attendre que le contenu soit chargé avant d'ouvrir la boîte de dialogue d'impression
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      }

      toast({
        title: "PDF généré",
        description: "Fenêtre d'impression ouverte. Vous pouvez maintenant enregistrer en PDF.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">
          {id === "new" ? "Nouvelle intervention" : "Modifier l'intervention"}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titre">Titre *</Label>
              <Input
                id="titre"
                value={formData.titre}
                onChange={(e) =>
                  setFormData({ ...formData, titre: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, client_id: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.prenom} {client.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <div className="flex gap-2">
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) =>
                    setFormData({ ...formData, adresse: e.target.value })
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={openInMaps}
                  disabled={!formData.adresse}
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description du problème</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date et heure</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={formData.date_intervention}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      date_intervention: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="statut">Statut</Label>
                <Select
                  value={formData.statut}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, statut: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a_faire">À faire</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="termine">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="materiel">Matériel utilisé</Label>
              <Textarea
                id="materiel"
                value={formData.materiel_utilise}
                onChange={(e) =>
                  setFormData({ ...formData, materiel_utilise: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commentaire">Commentaire du technicien</Label>
              <Textarea
                id="commentaire"
                value={formData.commentaire_technicien}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    commentaire_technicien: e.target.value,
                  })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Photos</Label>
              <div className="flex gap-4 items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("photo-upload")?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Upload..." : "Ajouter des photos"}
                </Button>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <span className="text-sm text-muted-foreground">
                  {formData.photos.length} photo(s)
                </span>
              </div>
              {formData.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {formData.photos.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={url}
                        alt={`Photo ${idx + 1}`}
                        className="rounded-lg object-cover aspect-square w-full"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            photos: prev.photos.filter((_, i) => i !== idx),
                          }));
                          toast({
                            title: "Photo supprimée",
                            description: "La photo a été supprimée",
                          });
                        }}
                      >
                        <Upload className="h-4 w-4 rotate-180" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Signature client</Label>
              <div className="border rounded-lg p-4 bg-white">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    className: "w-full h-32 border rounded",
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => signatureRef.current?.clear()}
                  className="mt-2"
                >
                  Effacer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 mt-6">
          <Button type="submit" disabled={loading} className="btn-gradient">
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
          {id && id !== "new" && (
            <Button type="button" variant="outline" onClick={generatePDF}>
              <FileDown className="h-4 w-4 mr-2" />
              Télécharger PDF
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
