import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Client {
  id: string;
  nom: string;
  entreprise?: string;
}

interface LignePrestation {
  description: string;
  quantite: number;
  prix_unitaire: number;
  tva: number;
}

export default function FactureDetail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id, devisId } = useParams();
  
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [reference, setReference] = useState("");
  const [clientId, setClientId] = useState("");
  const [dateEmission, setDateEmission] = useState(new Date().toISOString().split('T')[0]);
  const [dateEcheance, setDateEcheance] = useState("");
  const [conditionsPaiement, setConditionsPaiement] = useState("Paiement à réception de facture");
  const [notes, setNotes] = useState("");
  const [statut, setStatut] = useState("Non payée");
  const [lignes, setLignes] = useState<LignePrestation[]>([
    { description: "", quantite: 1, prix_unitaire: 0, tva: 20 }
  ]);

  useEffect(() => {
    loadClients();
    if (id) {
      loadFacture();
    } else if (devisId) {
      loadFromDevis();
    }
  }, [id, devisId]);

  const loadClients = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("clients")
      .select("id, nom, entreprise")
      .eq("user_id", user.id);

    if (!error && data) {
      setClients(data);
    }
  };

  const loadFacture = async () => {
    const { data, error } = await supabase
      .from("factures")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      setReference(data.reference);
      setClientId(data.client_id);
      setDateEmission(data.date_emission.split('T')[0]);
      setDateEcheance(data.date_echeance ? data.date_echeance.split('T')[0] : "");
      setConditionsPaiement(data.conditions_paiement || "");
      setNotes(data.notes || "");
      setStatut(data.statut);
      setLignes(typeof data.lignes_prestation === 'string' 
        ? JSON.parse(data.lignes_prestation)
        : ((data.lignes_prestation as unknown) as LignePrestation[] || []));
    }
  };

  const loadFromDevis = async () => {
    const { data, error } = await supabase
      .from("devis")
      .select("*")
      .eq("id", devisId)
      .single();

    if (!error && data) {
      setClientId(data.client_id);
      setConditionsPaiement(data.conditions_paiement || "Paiement à réception de facture");
      setNotes(data.notes || "");
      setLignes(typeof data.lignes_prestation === 'string'
        ? JSON.parse(data.lignes_prestation)
        : ((data.lignes_prestation as unknown) as LignePrestation[] || []));
      
      // Generate reference
      const count = await supabase
        .from("factures")
        .select("id", { count: "exact", head: true });
      setReference(`FAC-${String((count.count || 0) + 1).padStart(5, '0')}`);
    }
  };

  const calculateTotals = () => {
    let totalHT = 0;
    let totalTVA = 0;

    lignes.forEach(ligne => {
      const montantHT = ligne.quantite * ligne.prix_unitaire;
      totalHT += montantHT;
      totalTVA += montantHT * (ligne.tva / 100);
    });

    return {
      totalHT,
      totalTVA,
      totalTTC: totalHT + totalTVA
    };
  };

  const addLigne = () => {
    setLignes([...lignes, { description: "", quantite: 1, prix_unitaire: 0, tva: 20 }]);
  };

  const removeLigne = (index: number) => {
    setLignes(lignes.filter((_, i) => i !== index));
  };

  const updateLigne = (index: number, field: keyof LignePrestation, value: any) => {
    const newLignes = [...lignes];
    newLignes[index] = { ...newLignes[index], [field]: value };
    setLignes(newLignes);
  };

  const handleSubmit = async () => {
    if (!clientId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un client",
        variant: "destructive",
      });
      return;
    }

    if (!reference) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une référence",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const totals = calculateTotals();
    const client = clients.find(c => c.id === clientId);

    const factureData = {
      user_id: user.id,
      client_id: clientId,
      devis_id: devisId || null,
      reference,
      date_emission: new Date(dateEmission).toISOString(),
      date_echeance: dateEcheance ? new Date(dateEcheance).toISOString() : null,
      lignes_prestation: JSON.parse(JSON.stringify(lignes)),
      total_ht: totals.totalHT,
      total_tva: totals.totalTVA,
      total_ttc: totals.totalTTC,
      conditions_paiement: conditionsPaiement,
      notes,
      statut,
      client_nom: client ? `${client.nom}${client.entreprise ? ` - ${client.entreprise}` : ''}` : '',
    };

    if (id) {
      const { error } = await supabase
        .from("factures")
        .update(factureData)
        .eq("id", id);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour la facture",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Succès",
          description: "Facture mise à jour avec succès",
        });
        navigate(`/facture/preview/${id}`);
      }
    } else {
      const { data: newFacture, error } = await supabase
        .from("factures")
        .insert(factureData)
        .select()
        .single();

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de créer la facture",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Succès",
          description: "Facture créée avec succès",
        });
        navigate(`/facture/preview/${newFacture.id}`);
      }
    }

    setLoading(false);
  };

  const totals = calculateTotals();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold">
            {id ? "Modifier la facture" : "Nouvelle facture"}
          </h1>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Référence *</Label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="FAC-00001"
                />
              </div>
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.nom} {client.entreprise && `- ${client.entreprise}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date d'émission *</Label>
                <Input
                  type="date"
                  value={dateEmission}
                  onChange={(e) => setDateEmission(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Date d'échéance</Label>
                <Input
                  type="date"
                  value={dateEcheance}
                  onChange={(e) => setDateEcheance(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={statut} onValueChange={setStatut}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Non payée">Non payée</SelectItem>
                    <SelectItem value="Partiellement payée">Partiellement payée</SelectItem>
                    <SelectItem value="Payée">Payée</SelectItem>
                    <SelectItem value="En retard">En retard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lignes de prestation</CardTitle>
              <Button onClick={addLigne} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une ligne
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {lignes.map((ligne, index) => (
              <div key={index} className="flex gap-2 items-start border-b pb-4">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Description"
                    value={ligne.description}
                    onChange={(e) => updateLigne(index, "description", e.target.value)}
                  />
                </div>
                <div className="w-24 space-y-2">
                  <Input
                    type="number"
                    placeholder="Qté"
                    value={ligne.quantite}
                    onChange={(e) => updateLigne(index, "quantite", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="w-32 space-y-2">
                  <Input
                    type="number"
                    placeholder="Prix HT"
                    value={ligne.prix_unitaire}
                    onChange={(e) => updateLigne(index, "prix_unitaire", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="w-24 space-y-2">
                  <Input
                    type="number"
                    placeholder="TVA %"
                    value={ligne.tva}
                    onChange={(e) => updateLigne(index, "tva", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeLigne(index)}
                  disabled={lignes.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span>Total HT:</span>
                <span className="font-medium">{totals.totalHT.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>TVA:</span>
                <span className="font-medium">{totals.totalTVA.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total TTC:</span>
                <span>{totals.totalTTC.toFixed(2)} €</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations complémentaires</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Conditions de paiement</Label>
              <Input
                value={conditionsPaiement}
                onChange={(e) => setConditionsPaiement(e.target.value)}
                placeholder="Paiement à réception de facture"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes complémentaires..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-end">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Enregistrement..." : id ? "Mettre à jour" : "Créer la facture"}
          </Button>
        </div>
      </div>
    </div>
  );
}
