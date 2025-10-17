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
import { ArrowLeft, Plus, Trash2, Save, FileDown } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

interface Client {
  id: string;
  nom: string;
  prenom: string | null;
  entreprise: string | null;
}

interface LigneDevis {
  description: string;
  quantite: number;
  prix_unitaire: number;
}

export default function DevisDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);
  const [companySettings, setCompanySettings] = useState<any>(null);

  const [formData, setFormData] = useState({
    client_id: "",
    numero_devis: `DEV-${Date.now()}`,
    date_devis: new Date().toISOString().slice(0, 10),
    date_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    statut: "brouillon",
    lignes: [] as LigneDevis[],
    tva: 20,
    conditions: "",
    notes: "",
    signature_url: "",
  });

  useEffect(() => {
    loadClients();
    loadCompanySettings();
    if (id && id !== "new") {
      loadDevis();
    }
  }, [id]);

  useEffect(() => {
    calculateTotals();
  }, [formData.lignes, formData.tva]);

  const loadClients = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("clients")
      .select("id, nom, prenom, entreprise")
      .eq("user_id", user.id);

    if (!error && data) {
      setClients(data);
    }
  };

  const loadCompanySettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("company_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setCompanySettings(data);
      setFormData(prev => ({
        ...prev,
        conditions: data.conditions_generales || prev.conditions
      }));
    }
  };

  const loadDevis = async () => {
    if (!id || id === "new") return;

    const { data, error } = await supabase
      .from("devis")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      setFormData({
        client_id: data.client_id || "",
        numero_devis: data.numero_devis || "",
        date_devis: data.date_devis ? new Date(data.date_devis).toISOString().slice(0, 10) : "",
        date_validite: data.date_validite ? new Date(data.date_validite).toISOString().slice(0, 10) : "",
        statut: data.statut || "brouillon",
        lignes: typeof data.lignes === 'string' ? JSON.parse(data.lignes) : (data.lignes || []),
        tva: Number(data.tva) || 20,
        conditions: data.conditions || "",
        notes: data.notes || "",
        signature_url: data.signature_url || "",
      });
    }
  };

  const calculateTotals = () => {
    const totalHT = formData.lignes.reduce(
      (sum, ligne) => sum + (ligne.quantite * ligne.prix_unitaire),
      0
    );
    return {
      totalHT,
      totalTTC: totalHT * (1 + formData.tva / 100)
    };
  };

  const addLigne = () => {
    setFormData({
      ...formData,
      lignes: [...formData.lignes, { description: "", quantite: 1, prix_unitaire: 0 }],
    });
  };

  const removeLigne = (index: number) => {
    setFormData({
      ...formData,
      lignes: formData.lignes.filter((_, i) => i !== index),
    });
  };

  const updateLigne = (index: number, field: keyof LigneDevis, value: any) => {
    const newLignes = [...formData.lignes];
    newLignes[index] = { ...newLignes[index], [field]: value };
    setFormData({ ...formData, lignes: newLignes });
  };

  const saveSignature = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) return null;

    const canvas = signatureRef.current.getCanvas();
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), "image/png");
    });

    const fileName = `signature-devis-${Date.now()}.png`;
    const { data, error } = await supabase.storage
      .from("signatures")
      .upload(fileName, blob);

    if (error) {
      console.error("Error uploading signature:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("signatures")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let signatureUrl = formData.signature_url;
      if (signatureRef.current && !signatureRef.current.isEmpty()) {
        const url = await saveSignature();
        if (url) signatureUrl = url;
      }

      const totals = calculateTotals();
      const devisData = {
        ...formData,
        user_id: user.id,
        signature_url: signatureUrl,
        lignes: JSON.stringify(formData.lignes),
        total_ht: totals.totalHT,
        total_ttc: totals.totalTTC,
      };

      if (id && id !== "new") {
        const { error } = await supabase
          .from("devis")
          .update(devisData)
          .eq("id", id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("devis").insert(devisData);
        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: "Devis enregistré avec succès",
      });
      navigate("/devis");
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

  const generatePDF = async () => {
    if (!id || id === "new") {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez d'abord enregistrer le devis",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("generate-pdf", {
        body: { type: "devis", id },
      });

      if (error) throw error;

      toast({
        title: "PDF généré",
        description: "Le PDF a été généré avec succès",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/devis")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">
          {id === "new" ? "Nouveau devis" : "Modifier le devis"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero_devis">Numéro de devis *</Label>
                <Input
                  id="numero_devis"
                  value={formData.numero_devis}
                  onChange={(e) =>
                    setFormData({ ...formData, numero_devis: e.target.value })
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
                        {client.entreprise || `${client.prenom} ${client.nom}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_devis">Date du devis *</Label>
                <Input
                  id="date_devis"
                  type="date"
                  value={formData.date_devis}
                  onChange={(e) =>
                    setFormData({ ...formData, date_devis: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_validite">Date de validité</Label>
                <Input
                  id="date_validite"
                  type="date"
                  value={formData.date_validite}
                  onChange={(e) =>
                    setFormData({ ...formData, date_validite: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="statut">Statut</Label>
                <Select
                  value={formData.statut}
                  onValueChange={(value) =>
                    setFormData({ ...formData, statut: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brouillon">Brouillon</SelectItem>
                    <SelectItem value="envoye">Envoyé</SelectItem>
                    <SelectItem value="accepte">Accepté</SelectItem>
                    <SelectItem value="refuse">Refusé</SelectItem>
                    <SelectItem value="expire">Expiré</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lignes du devis</CardTitle>
              <Button type="button" onClick={addLigne} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une ligne
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.lignes.map((ligne, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-start">
                <div className="col-span-5 space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={ligne.description}
                    onChange={(e) =>
                      updateLigne(index, "description", e.target.value)
                    }
                    placeholder="Description du service/produit"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Quantité</Label>
                  <Input
                    type="number"
                    min="1"
                    value={ligne.quantite}
                    onChange={(e) =>
                      updateLigne(index, "quantite", parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Prix HT</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ligne.prix_unitaire}
                    onChange={(e) =>
                      updateLigne(index, "prix_unitaire", parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Total HT</Label>
                  <Input
                    value={(ligne.quantite * ligne.prix_unitaire).toFixed(2)}
                    disabled
                  />
                </div>
                <div className="col-span-1 flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLigne(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            
            {formData.lignes.length > 0 && (
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-end items-center gap-4">
                  <span className="font-medium">Total HT:</span>
                  <span className="text-xl">{totals.totalHT.toFixed(2)} €</span>
                </div>
                <div className="flex justify-end items-center gap-4">
                  <span className="font-medium">TVA ({formData.tva}%):</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.tva}
                    onChange={(e) =>
                      setFormData({ ...formData, tva: parseFloat(e.target.value) || 0 })
                    }
                    className="w-24 text-right"
                  />
                </div>
                <div className="flex justify-end items-center gap-4">
                  <span className="text-xl font-bold">Total TTC:</span>
                  <span className="text-2xl font-bold text-primary">
                    {totals.totalTTC.toFixed(2)} €
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conditions et notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="conditions">Conditions générales</Label>
              <Textarea
                id="conditions"
                value={formData.conditions}
                onChange={(e) =>
                  setFormData({ ...formData, conditions: e.target.value })
                }
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signature du client</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  className: "w-full h-40",
                }}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => signatureRef.current?.clear()}
              className="mt-2"
            >
              Effacer
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
          {id && id !== "new" && (
            <Button type="button" variant="outline" onClick={generatePDF}>
              <FileDown className="h-4 w-4 mr-2" />
              Générer PDF
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/devis")}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}