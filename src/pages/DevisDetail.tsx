import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, FileText, ArrowLeft, Pen } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Client {
  id: string;
  nom: string;
  prenom: string;
  entreprise: string | null;
}

interface LignePrestation {
  id: string;
  description: string;
  quantite: number;
  prix_unitaire: number;
  tva: number;
}

export default function DevisDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [signatureType, setSignatureType] = useState<"client" | "company">("client");
  const signaturePadRef = useState<SignatureCanvas | null>(null)[0];

  const [clients, setClients] = useState<Client[]>([]);
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [devis, setDevis] = useState({
    client_id: "",
    reference: "",
    date_creation: new Date().toISOString().split("T")[0],
    validite_jours: 30,
    lignes_prestation: [
      { id: crypto.randomUUID(), description: "", quantite: 1, prix_unitaire: 0, tva: 20 },
    ] as LignePrestation[],
    total_ht: 0,
    total_tva: 0,
    total_ttc: 0,
    montant: 0,
    conditions_paiement: "Paiement à réception de facture",
    delai_realisation: "",
    notes: "",
    statut: "En attente",
    pret_envoi: false,
    client_signature_url: "",
    company_signature_url: "",
    date_signature: null,
  });

  useEffect(() => {
    loadClients();
    loadCompanySettings();
    if (id && id !== "new") {
      loadDevis();
    } else {
      // Générer une référence automatique
      const today = new Date();
      const reference = `DEV-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
      setDevis((prev) => ({ ...prev, reference }));
    }
  }, [id]);

  useEffect(() => {
    calculateTotals();
  }, [devis.lignes_prestation]);

  const loadClients = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("clients")
      .select("*")
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
    }
  };

  const loadDevis = async () => {
    const { data, error } = await supabase
      .from("devis")
      .select("*, clients(nom)")
      .eq("id", id)
      .single();

    if (!error && data) {
      setDevis({
        ...data,
        date_creation: data.date_creation.split("T")[0],
        lignes_prestation: typeof data.lignes_prestation === 'string' 
          ? JSON.parse(data.lignes_prestation) 
          : (data.lignes_prestation || []),
      });
    }
  };

  const calculateTotals = () => {
    let total_ht = 0;
    let total_tva = 0;

    devis.lignes_prestation.forEach((ligne) => {
      const montant_ht = ligne.quantite * ligne.prix_unitaire;
      const montant_tva = montant_ht * (ligne.tva / 100);
      total_ht += montant_ht;
      total_tva += montant_tva;
    });

    const total_ttc = total_ht + total_tva;
    setDevis((prev) => ({ ...prev, total_ht, total_tva, total_ttc, montant: total_ttc }));
  };

  const addLigne = () => {
    setDevis((prev) => ({
      ...prev,
      lignes_prestation: [
        ...prev.lignes_prestation,
        { id: crypto.randomUUID(), description: "", quantite: 1, prix_unitaire: 0, tva: 20 },
      ],
    }));
  };

  const removeLigne = (index: number) => {
    if (devis.lignes_prestation.length <= 1) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le devis doit contenir au moins une ligne",
      });
      return;
    }
    setDevis((prev) => ({
      ...prev,
      lignes_prestation: prev.lignes_prestation.filter((_, i) => i !== index),
    }));
  };

  const updateLigne = (index: number, field: keyof LignePrestation, value: any) => {
    setDevis((prev) => ({
      ...prev,
      lignes_prestation: prev.lignes_prestation.map((ligne, i) =>
        i === index ? { ...ligne, [field]: value } : ligne
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!devis.client_id) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez sélectionner un client" });
      return;
    }

    if (devis.lignes_prestation.length === 0) {
      toast({ variant: "destructive", title: "Erreur", description: "Le devis doit contenir au moins une ligne" });
      return;
    }

    const invalidLine = devis.lignes_prestation.find(
      (l) => !l.description || l.quantite <= 0 || l.prix_unitaire <= 0
    );
    if (invalidLine) {
      toast({ variant: "destructive", title: "Erreur", description: "Toutes les lignes doivent être complètes et avoir des valeurs positives" });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer le nom du client
      const client = clients.find((c) => c.id === devis.client_id);
      const client_nom = client ? (client.entreprise || `${client.prenom} ${client.nom}`) : "";

      const devisData = {
        ...devis,
        user_id: user.id,
        client_nom,
        lignes_prestation: JSON.stringify(devis.lignes_prestation),
      };

      if (id && id !== "new") {
        const { error } = await supabase.from("devis").update(devisData).eq("id", id);
        if (error) throw error;
        toast({ title: "Devis modifié", description: "Le devis a été modifié avec succès" });
      } else {
        const { error } = await supabase.from("devis").insert([devisData]);
        if (error) throw error;
        toast({ title: "Devis créé", description: "Le devis a été créé avec succès" });
      }

      navigate("/interventions-devis");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const generatePDF = async () => {
    if (!id || id === "new") {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez d'abord enregistrer le devis" });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("generate-pdf", {
        body: { type: "devis", id },
      });

      if (error) throw error;
      toast({ title: "Téléchargement réussi", description: "Le devis a été téléchargé au format PDF" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const handleSaveSignature = async () => {
    if (!signaturePadRef || signaturePadRef.isEmpty()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez signer avant de sauvegarder",
      });
      return;
    }

    try {
      const signatureData = signaturePadRef.toDataURL();
      const blob = await (await fetch(signatureData)).blob();
      const fileName = `signature-${signatureType}-${Date.now()}.png`;

      const { data, error } = await supabase.storage
        .from("signatures")
        .upload(fileName, blob);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("signatures")
        .getPublicUrl(fileName);

      const updateField = signatureType === "client" ? "client_signature_url" : "company_signature_url";
      const updateData = {
        [updateField]: urlData.publicUrl,
        date_signature: new Date().toISOString(),
      };

      if (id && id !== "new") {
        const { error: updateError } = await supabase
          .from("devis")
          .update(updateData)
          .eq("id", id);

        if (updateError) throw updateError;
      }

      setDevis((prev: any) => ({ ...prev, ...updateData }));
      setSignatureDialogOpen(false);

      toast({
        title: "Signature enregistrée",
        description: "La signature a été enregistrée avec succès",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const openSignatureDialog = (type: "client" | "company") => {
    setSignatureType(type);
    setSignatureDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Référence</Label>
                <Input value={devis.reference} disabled />
              </div>
              <div>
                <Label>Client *</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={devis.client_id}
                  onChange={(e) => setDevis({ ...devis, client_id: e.target.value })}
                  required
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.entreprise || `${client.prenom} ${client.nom}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Date de création</Label>
                <Input
                  type="date"
                  value={devis.date_creation}
                  onChange={(e) => setDevis({ ...devis, date_creation: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Validité (jours)</Label>
                <Input
                  type="number"
                  value={devis.validite_jours}
                  onChange={(e) => setDevis({ ...devis, validite_jours: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Délai de réalisation</Label>
                <Input
                  value={devis.delai_realisation}
                  onChange={(e) => setDevis({ ...devis, delai_realisation: e.target.value })}
                  placeholder="Ex: 2 semaines"
                />
              </div>
              <div>
                <Label>Statut</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={devis.statut}
                  onChange={(e) => setDevis({ ...devis, statut: e.target.value })}
                >
                  <option value="En attente">En attente</option>
                  <option value="Envoyé">Envoyé</option>
                  <option value="Accepté">Accepté</option>
                  <option value="Refusé">Refusé</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pret_envoi"
                checked={devis.pret_envoi}
                onChange={(e) => setDevis({ ...devis, pret_envoi: e.target.checked })}
              />
              <Label htmlFor="pret_envoi">Prêt à l'envoi</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lignes de prestation</CardTitle>
              <Button type="button" onClick={addLigne}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une ligne
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {devis.lignes_prestation.map((ligne, index) => (
                <div key={ligne.id} className="grid grid-cols-12 gap-4 items-end p-4 border rounded">
                  <div className="col-span-4">
                    <Label>Description *</Label>
                    <Textarea
                      value={ligne.description}
                      onChange={(e) => updateLigne(index, "description", e.target.value)}
                      placeholder="Description de la prestation"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Quantité *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={ligne.quantite}
                      onChange={(e) => updateLigne(index, "quantite", parseFloat(e.target.value))}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Prix unit. HT *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={ligne.prix_unitaire}
                      onChange={(e) => updateLigne(index, "prix_unitaire", parseFloat(e.target.value))}
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>TVA %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={ligne.tva}
                      onChange={(e) => updateLigne(index, "tva", parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Total HT</Label>
                    <Input
                      type="text"
                      value={(ligne.quantite * ligne.prix_unitaire).toFixed(2) + " €"}
                      disabled
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeLigne(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2 text-right border-t pt-4">
              <div className="text-lg">Total HT: {devis.total_ht.toFixed(2)} €</div>
              <div className="text-lg">Total TVA: {devis.total_tva.toFixed(2)} €</div>
              <div className="text-2xl font-bold text-primary">
                TOTAL TTC: {devis.total_ttc.toFixed(2)} €
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conditions et notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Conditions de paiement</Label>
              <Input
                value={devis.conditions_paiement}
                onChange={(e) => setDevis({ ...devis, conditions_paiement: e.target.value })}
              />
            </div>
            <div>
              <Label>Notes additionnelles</Label>
              <Textarea
                value={devis.notes}
                onChange={(e) => setDevis({ ...devis, notes: e.target.value })}
                rows={3}
                placeholder="Notes additionnelles"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signatures électroniques</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Signature du client</Label>
              {devis.client_signature_url ? (
                <div className="border-2 rounded-lg p-4 mt-2">
                  <img src={devis.client_signature_url} alt="Signature client" className="max-h-32" />
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => openSignatureDialog("client")}
                >
                  <Pen className="h-4 w-4 mr-2" />
                  Signer (Client)
                </Button>
              )}
            </div>
            <div>
              <Label>Signature de l'entreprise</Label>
              {devis.company_signature_url ? (
                <div className="border-2 rounded-lg p-4 mt-2">
                  <img src={devis.company_signature_url} alt="Signature entreprise" className="max-h-32" />
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => openSignatureDialog("company")}
                >
                  <Pen className="h-4 w-4 mr-2" />
                  Signer (Entreprise)
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit">Enregistrer</Button>
          {id && id !== "new" && (
            <Button type="button" variant="outline" onClick={generatePDF}>
              <FileText className="h-4 w-4 mr-2" />
              Télécharger PDF
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Annuler
          </Button>
        </div>
      </form>

      {/* Signature Dialog */}
      <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Signature {signatureType === "client" ? "du client" : "de l'entreprise"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg">
              <SignatureCanvas
                ref={(ref) => {
                  if (ref) {
                    // @ts-ignore
                    signaturePadRef = ref;
                  }
                }}
                canvasProps={{
                  className: "w-full h-64",
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => signaturePadRef?.clear()}
                className="flex-1"
              >
                Effacer
              </Button>
              <Button
                type="button"
                onClick={handleSaveSignature}
                className="flex-1"
              >
                Enregistrer la signature
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
