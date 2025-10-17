import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, id } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let data, error;
    
    if (type === 'intervention') {
      const result = await supabase
        .from('interventions')
        .select(`
          *,
          clients(nom, prenom, email, telephone, adresse),
          techniciens(nom, prenom, email, telephone)
        `)
        .eq('id', id)
        .single();
      
      data = result.data;
      error = result.error;
    } else if (type === 'devis') {
      const result = await supabase
        .from('devis')
        .select(`
          *,
          clients(nom, prenom, email, telephone, adresse, entreprise)
        `)
        .eq('id', id)
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) throw error;

    // Generate HTML content
    const htmlContent = type === 'intervention' 
      ? generateInterventionHTML(data)
      : generateDevisHTML(data);

    // For now, return HTML. In production, use a PDF generation library
    return new Response(
      JSON.stringify({ 
        success: true,
        html: htmlContent,
        message: "PDF généré avec succès"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-pdf:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateInterventionHTML(data: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin: 20px 0; }
        .label { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Rapport d'Intervention</h1>
        <p>N° ${data.id}</p>
      </div>
      
      <div class="section">
        <p><span class="label">Titre:</span> ${data.titre}</p>
        <p><span class="label">Date:</span> ${new Date(data.date_intervention).toLocaleDateString('fr-FR')}</p>
        <p><span class="label">Statut:</span> ${data.statut}</p>
      </div>
      
      <div class="section">
        <h2>Client</h2>
        <p>${data.clients?.prenom} ${data.clients?.nom}</p>
        <p>${data.clients?.email || ''}</p>
        <p>${data.clients?.telephone || ''}</p>
        <p>${data.adresse}</p>
      </div>
      
      <div class="section">
        <h2>Description</h2>
        <p>${data.description || ''}</p>
      </div>
      
      <div class="section">
        <h2>Matériel utilisé</h2>
        <p>${data.materiel_utilise || 'Aucun'}</p>
      </div>
      
      <div class="section">
        <h2>Commentaires</h2>
        <p>${data.commentaire_technicien || 'Aucun commentaire'}</p>
      </div>
      
      ${data.signature_url ? `
      <div class="section">
        <h2>Signature du client</h2>
        <img src="${data.signature_url}" style="max-width: 300px;" />
      </div>
      ` : ''}
    </body>
    </html>
  `;
}

function generateDevisHTML(data: any) {
  const lignes = JSON.parse(data.lignes || '[]');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .label { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f4f4f4; }
        .total-section { text-align: right; margin-top: 20px; }
        .total-line { margin: 5px 0; }
        .grand-total { font-size: 1.2em; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>DEVIS</h1>
        <p>N° ${data.numero_devis}</p>
        <p>Date: ${new Date(data.date_devis).toLocaleDateString('fr-FR')}</p>
        ${data.date_validite ? `<p>Valide jusqu'au: ${new Date(data.date_validite).toLocaleDateString('fr-FR')}</p>` : ''}
      </div>
      
      <div class="section">
        <h2>Client</h2>
        <p><strong>${data.clients?.entreprise || ''}</strong></p>
        <p>${data.clients?.prenom} ${data.clients?.nom}</p>
        <p>${data.clients?.email || ''}</p>
        <p>${data.clients?.telephone || ''}</p>
        <p>${data.clients?.adresse || ''}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantité</th>
            <th>Prix Unitaire HT</th>
            <th>Total HT</th>
          </tr>
        </thead>
        <tbody>
          ${lignes.map((ligne: any) => `
            <tr>
              <td>${ligne.description}</td>
              <td>${ligne.quantite}</td>
              <td>${parseFloat(ligne.prix_unitaire).toFixed(2)} €</td>
              <td>${(ligne.quantite * parseFloat(ligne.prix_unitaire)).toFixed(2)} €</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="total-section">
        <div class="total-line">Total HT: ${parseFloat(data.total_ht).toFixed(2)} €</div>
        <div class="total-line">TVA (${data.tva}%): ${(parseFloat(data.total_ht) * parseFloat(data.tva) / 100).toFixed(2)} €</div>
        <div class="total-line grand-total">Total TTC: ${parseFloat(data.total_ttc).toFixed(2)} €</div>
      </div>
      
      ${data.conditions ? `
      <div class="section">
        <h3>Conditions</h3>
        <p>${data.conditions}</p>
      </div>
      ` : ''}
      
      ${data.notes ? `
      <div class="section">
        <h3>Notes</h3>
        <p>${data.notes}</p>
      </div>
      ` : ''}
      
      ${data.signature_url ? `
      <div class="section">
        <h3>Signature du client</h3>
        <img src="${data.signature_url}" style="max-width: 300px;" />
      </div>
      ` : ''}
    </body>
    </html>
  `;
}