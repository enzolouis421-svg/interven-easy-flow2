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
  const [isEcheanceAuto, setIsEcheanceAuto] = useState(false);

  // Fonction pour extraire le nombre de jours depuis les conditions de paiement
  const extractDaysFromPaymentConditions = (conditions: string): number | null => {
    if (!conditions) return null;
    
    const conditionsLower = conditions.toLowerCase();
    
    // Patterns courants à reconnaître
    const patterns = [
      /(\d+)\s*jour/i,           // "30 jours", "30 jour"
      /(\d+)\s*j\b/i,            // "30 j"
      /net\s*(\d+)/i,            // "net 30", "NET 45"
      /sous\s*(\d+)\s*jour/i,    // "sous 30 jours"
      /(\d+)\s*jours?\s*net/i,   // "30 jours net"
      /(\d+)\s*jours?\s*fin/i,   // "30 jours fin de mois"
    ];
    
    for (const pattern of patterns) {
      const match = conditions.match(pattern);
      if (match && match[1]) {
        const days = parseInt(match[1], 10);
        if (days > 0 && days <= 365) {
          return days;
        }
      }
    }
    
    // Valeurs par défaut selon le texte
    if (conditionsLower.includes('réception') || conditionsLower.includes('reception')) {
      return 0; // Paiement à réception
    }
    
    if (conditionsLower.includes('comptant') || conditionsLower.includes('immédiat') || conditionsLower.includes('immediat')) {
      return 0; // Paiement comptant
    }
    
    // Valeur par défaut si rien n'est trouvé
    return null;
  };

  useEffect(() => {
    loadClients();
    if (id) {
      loadFacture();
    } else if (devisId) {
      loadFromDevis();
    }
  }, [id, devisId]);

  // Calcul automatique de la date d'échéance
  useEffect(() => {
    // Ne calculer que si on crée une nouvelle facture (pas d'id) ou si la date d'échéance est vide
    if (id && dateEcheance && !isEcheanceAuto) {
      // Si on modifie une facture existante qui a déjà une date d'échéance non auto, ne pas la modifier
      return;
    }
    
    if (!dateEmission) return;
    
    const days = extractDaysFromPaymentConditions(conditionsPaiement);
    
    if (days !== null) {
      const emissionDate = new Date(dateEmission);
      emissionDate.setDate(emissionDate.getDate() + days);
      const newEcheance = emissionDate.toISOString().split('T')[0];
      if (dateEcheance !== newEcheance) {
        setDateEcheance(newEcheance);
        setIsEcheanceAuto(true);
      }
    } else {
      // Si on ne peut pas extraire les jours, utiliser 30 jours par défaut
      const emissionDate = new Date(dateEmission);
      emissionDate.setDate(emissionDate.getDate() + 30);
      const newEcheance = emissionDate.toISOString().split('T')[0];
      if (dateEcheance !== newEcheance) {
        setDateEcheance(newEcheance);
        setIsEcheanceAuto(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateEmission, conditionsPaiement, id]);

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
      setDateEmission(data.date_emission ? data.date_emission.split('T')[0] : new Date().toISOString().split('T')[0]);
      setDateEcheance(data.date_echeance ? data.date_echeance.split('T')[0] : "");
      setConditionsPaiement(data.conditions_paiement || "");
      setNotes(data.notes || "");
      setStatut(data.statut);
      setLignes(typeof data.lignes_prestation === 'string' 
        ? (() => {
            try {
              return JSON.parse(data.lignes_prestation);
            } catch {
              return [];
            }
          })()
        : ((data.lignes_prestation as unknown) as LignePrestation[] || []));
      // Si la facture existe déjà, la date d'échéance n'est pas auto
      setIsEcheanceAuto(false);
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
      const conditions = data.conditions_paiement || "Paiement à réception de facture";
      setConditionsPaiement(conditions);
      setNotes(data.notes || "");
      setLignes(typeof data.lignes_prestation === 'string'
        ? (() => {
            try {
              return JSON.parse(data.lignes_prestation);
            } catch {
              return [];
            }
          })()
        : ((data.lignes_prestation as unknown) as LignePrestation[] || []));
      
      // Generate reference
      const count = await supabase
        .from("factures")
        .select("id", { count: "exact", head: true });
      setReference(`FAC-${String((count.count || 0) + 1).padStart(5, '0')}`);
      
      // Calculer automatiquement la date d'échéance
      const emissionDate = new Date();
      const days = extractDaysFromPaymentConditions(conditions);
      const calculatedDays = days !== null ? days : 30; // 30 jours par défaut
      
      const echeanceDate = new Date(emissionDate);
      echeanceDate.setDate(echeanceDate.getDate() + calculatedDays);
      setDateEcheance(echeanceDate.toISOString().split('T')[0]);
      setIsEcheanceAuto(true);
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
    <div className="container mx-auto py-3 sm:py-6 space-y-3 sm:space-y-6 px-2 sm:px-0">
      <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="h-8 w-8 sm:h-10 sm:w-10 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold">
            {id ? "Modifier la facture" : "Nouvelle facture"}
          </h1>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-6">
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg">Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Référence *</Label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="FAC-00001"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Client *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="text-sm">
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
                <Label className="text-xs sm:text-sm">Date d'émission *</Label>
                <Input
                  type="date"
                  value={dateEmission}
                  onChange={(e) => setDateEmission(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs sm:text-sm">Date d'échéance</Label>
                  {isEcheanceAuto && extractDaysFromPaymentConditions(conditionsPaiement) !== null && (
                    <span className="text-xs text-muted-foreground">
                      (Auto)
                    </span>
                  )}
                </div>
                <Input
                  type="date"
                  value={dateEcheance}
                  onChange={(e) => {
                    setDateEcheance(e.target.value);
                    setIsEcheanceAuto(false); // L'utilisateur modifie manuellement
                  }}
                  className="text-sm"
                />
                {isEcheanceAuto && extractDaysFromPaymentConditions(conditionsPaiement) !== null && (
                  <p className="text-xs text-muted-foreground">
                    Basée sur : {dateEmission} + {extractDaysFromPaymentConditions(conditionsPaiement)} jour{extractDaysFromPaymentConditions(conditionsPaiement)! > 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Statut</Label>
                <Select value={statut} onValueChange={setStatut}>
                  <SelectTrigger className="text-sm">
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
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <CardTitle className="text-sm sm:text-base md:text-lg">Lignes de prestation</CardTitle>
              <Button onClick={addLigne} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Ajouter une ligne
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 pt-0">
            {/* Container avec scroll horizontal sur mobile */}
            <div className="overflow-x-auto -mx-2 sm:-mx-4 md:mx-0 px-2 sm:px-4 md:px-0">
              <div className="min-w-[600px] md:min-w-0 space-y-3 sm:space-y-4">
                {lignes.map((ligne, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 sm:gap-3 items-end border-b pb-3 sm:pb-4">
                    <div className="col-span-12 sm:col-span-5 space-y-2">
                      <Input
                        placeholder="Description"
                        value={ligne.description}
                        onChange={(e) => updateLigne(index, "description", e.target.value)}
                        className="text-xs sm:text-sm"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2 space-y-2">
                      <Input
                        type="number"
                        placeholder="Qté"
                        value={ligne.quantite}
                        onChange={(e) => updateLigne(index, "quantite", parseFloat(e.target.value) || 0)}
                        className="text-xs sm:text-sm"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2 space-y-2">
                      <Input
                        type="number"
                        placeholder="Prix HT"
                        value={ligne.prix_unitaire}
                        onChange={(e) => updateLigne(index, "prix_unitaire", parseFloat(e.target.value) || 0)}
                        className="text-xs sm:text-sm"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2 space-y-2">
                      <Input
                        type="number"
                        placeholder="TVA %"
                        value={ligne.tva}
                        onChange={(e) => updateLigne(index, "tva", parseFloat(e.target.value) || 0)}
                        className="text-xs sm:text-sm"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex items-end">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeLigne(index)}
                        disabled={lignes.length === 1}
                        className="h-8 w-8 sm:h-10 sm:w-10"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2 pt-3 sm:pt-4 border-t text-right">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Total HT:</span>
                <span className="font-medium">{totals.totalHT.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span>TVA:</span>
                <span className="font-medium">{totals.totalTVA.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-base sm:text-lg font-bold">
                <span>Total TTC:</span>
                <span>{totals.totalTTC.toFixed(2)} €</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg">Informations complémentaires</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 pt-0">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Conditions de paiement</Label>
              <Input
                value={conditionsPaiement}
                onChange={(e) => {
                  setConditionsPaiement(e.target.value);
                  // Réactiver le calcul auto si l'utilisateur change les conditions
                  if (!id || !dateEcheance) {
                    setIsEcheanceAuto(true);
                  }
                }}
                placeholder="Paiement à réception de facture, 30 jours, Net 45..."
                className="text-sm"
              />
              {extractDaysFromPaymentConditions(conditionsPaiement) !== null && (
                <p className="text-xs text-muted-foreground">
                  {extractDaysFromPaymentConditions(conditionsPaiement) === 0 
                    ? "Paiement immédiat détecté" 
                    : `${extractDaysFromPaymentConditions(conditionsPaiement)} jour${extractDaysFromPaymentConditions(conditionsPaiement)! > 1 ? "s" : ""} détecté${extractDaysFromPaymentConditions(conditionsPaiement)! > 1 ? "s" : ""}`}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes complémentaires..."
                rows={4}
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-end">
          <Button variant="outline" onClick={() => navigate(-1)} className="w-full sm:w-auto text-sm sm:text-base">
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto text-sm sm:text-base">
            {loading ? "Enregistrement..." : id ? "Mettre à jour" : "Créer la facture"}
          </Button>
        </div>
      </div>
    </div>
  );
}
