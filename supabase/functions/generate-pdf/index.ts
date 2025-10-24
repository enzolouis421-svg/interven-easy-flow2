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

      if (error) throw error;

      const htmlContent = generateInterventionHTML(data);

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
    } else if (type === 'facture') {
      const result = await supabase
        .from('factures')
        .select('*')
        .eq('id', id)
        .single();
      
      data = result.data;
      error = result.error;

      if (error) throw error;

      // Récupérer les paramètres entreprise
      if (data && data.user_id) {
        const { data: companyData } = await supabase
          .from('company_settings')
          .select('*')
          .eq('user_id', data.user_id)
          .single();
        
        data.company_settings = companyData;
      }

      const htmlContent = generateFactureHTML(data);

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

      // Récupérer les paramètres entreprise
      if (data && data.user_id) {
        const { data: companyData } = await supabase
          .from('company_settings')
          .select('*')
          .eq('user_id', data.user_id)
          .single();
        
        data.company_settings = companyData;
      }

      if (error) throw error;

      const htmlContent = generateDevisHTML(data);

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
    }

    return new Response(
      JSON.stringify({ error: 'Type non reconnu' }),
      {
        status: 400,
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

function generateFactureHTML(data: any) {
  const lignes = typeof data.lignes_prestation === 'string' 
    ? JSON.parse(data.lignes_prestation) 
    : (data.lignes_prestation || []);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          padding: 30px; 
          color: #111827;
          font-size: 10px;
        }
        .header { 
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          border-bottom: 3px solid #dc2626;
          padding-bottom: 20px;
        }
        .company-info {
          flex: 1;
        }
        .company-name {
          font-size: 16px;
          font-weight: bold;
          color: #dc2626;
          margin-bottom: 8px;
        }
        .facture-title {
          text-align: right;
          flex: 1;
        }
        .facture-title h1 {
          font-size: 28px;
          color: #dc2626;
          margin: 0 0 8px 0;
        }
        .reference {
          font-size: 13px;
          color: #6b7280;
        }
        .separator {
          height: 2px;
          background: #e5e7eb;
          margin: 25px 0;
        }
        .client-block {
          background: #f9fafb;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 25px;
        }
        .client-block h3 {
          font-size: 12px;
          color: #dc2626;
          margin: 0 0 8px 0;
        }
        .dates-block {
          display: flex;
          justify-content: space-between;
          margin-bottom: 25px;
          padding: 12px;
          background: #fef2f2;
          border-radius: 8px;
        }
        .date-item {
          flex: 1;
        }
        .date-label {
          font-size: 10px;
          color: #6b7280;
          margin-bottom: 4px;
        }
        .date-value {
          font-weight: bold;
          font-size: 11px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0;
        }
        th { 
          background: #f3f4f6;
          padding: 12px 8px;
          text-align: left;
          font-size: 11px;
          font-weight: bold;
          color: #374151;
          border: 1px solid #e5e7eb;
        }
        td { 
          border: 1px solid #e5e7eb; 
          padding: 8px; 
          font-size: 10px;
        }
        .total-section { 
          text-align: right; 
          margin-top: 25px;
          padding-right: 8px;
        }
        .total-line { 
          margin: 5px 0;
          font-size: 11px;
        }
        .grand-total { 
          font-size: 16px; 
          font-weight: bold;
          color: #dc2626;
          margin-top: 10px;
        }
        .conditions-section {
          margin-top: 30px;
          font-size: 10px;
        }
        .conditions-section h3 {
          font-size: 12px;
          color: #374151;
          margin-bottom: 8px;
        }
        .notes-block {
          background: #f9fafb;
          padding: 12px;
          border-radius: 8px;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <div class="company-name">${data.company_settings?.nom_entreprise || 'Votre Entreprise'}</div>
          <div>${data.company_settings?.siret ? 'SIRET: ' + data.company_settings.siret : ''}</div>
          <div>${data.company_settings?.adresse || ''}</div>
          <div>${data.company_settings?.code_postal || ''} ${data.company_settings?.ville || ''}</div>
          <div>${data.company_settings?.telephone || ''}</div>
          <div>${data.company_settings?.email || ''}</div>
        </div>
        <div class="facture-title">
          <h1>FACTURE</h1>
          <div class="reference">Réf: ${data.reference}</div>
        </div>
      </div>

      <div class="separator"></div>

      <div class="client-block">
        <h3>CLIENT</h3>
        <div><strong>${data.client_nom || ''}</strong></div>
      </div>

      <div class="dates-block">
        <div class="date-item">
          <div class="date-label">Date d'émission</div>
          <div class="date-value">${new Date(data.date_emission).toLocaleDateString('fr-FR')}</div>
        </div>
        ${data.date_echeance ? `
          <div class="date-item">
            <div class="date-label">Date d'échéance</div>
            <div class="date-value">${new Date(data.date_echeance).toLocaleDateString('fr-FR')}</div>
          </div>
        ` : ''}
        <div class="date-item">
          <div class="date-label">Statut</div>
          <div class="date-value">${data.statut}</div>
        </div>
      </div>

      <div class="separator"></div>

      <table>
        <thead>
          <tr>
            <th style="width: 45%">Description</th>
            <th style="width: 10%; text-align: center">Qté</th>
            <th style="width: 15%; text-align: right">Prix unit. HT</th>
            <th style="width: 10%; text-align: center">TVA</th>
            <th style="width: 20%; text-align: right">Total HT</th>
          </tr>
        </thead>
        <tbody>
          ${lignes.map((ligne: any) => `
            <tr>
              <td>${ligne.description}</td>
              <td style="text-align: center">${ligne.quantite}</td>
              <td style="text-align: right">${parseFloat(ligne.prix_unitaire).toFixed(2)} €</td>
              <td style="text-align: center">${ligne.tva}%</td>
              <td style="text-align: right">${(ligne.quantite * parseFloat(ligne.prix_unitaire)).toFixed(2)} €</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-section">
        <div class="total-line">Total HT: ${parseFloat(data.total_ht || 0).toFixed(2)} €</div>
        <div class="total-line">Total TVA: ${parseFloat(data.total_tva || 0).toFixed(2)} €</div>
        <div class="total-line grand-total">TOTAL TTC: ${parseFloat(data.total_ttc || 0).toFixed(2)} €</div>
      </div>

      <div class="separator"></div>

      <div class="conditions-section">
        <h3>Conditions de paiement</h3>
        <div>${data.conditions_paiement || 'Paiement à réception de facture'}</div>
        
        ${data.notes ? `
        <div class="notes-block">
          <strong>Notes:</strong><br/>
          ${data.notes}
        </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
}

function generateDevisHTML(data: any) {
  const lignes = typeof data.lignes_prestation === 'string' 
    ? JSON.parse(data.lignes_prestation) 
    : (data.lignes_prestation || []);
  
  const validiteDate = new Date(data.date_creation);
  validiteDate.setDate(validiteDate.getDate() + (data.validite_jours || 30));
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          padding: 30px; 
          color: #111827;
          font-size: 10px;
        }
        .header { 
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        .company-info {
          flex: 1;
        }
        .company-name {
          font-size: 16px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 8px;
        }
        .devis-title {
          text-align: right;
          flex: 1;
        }
        .devis-title h1 {
          font-size: 28px;
          color: #2563eb;
          margin: 0 0 8px 0;
        }
        .reference {
          font-size: 13px;
          color: #6b7280;
        }
        .separator {
          height: 2px;
          background: #e5e7eb;
          margin: 25px 0;
        }
        .client-block {
          background: #f9fafb;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 25px;
        }
        .client-block h3 {
          font-size: 12px;
          color: #2563eb;
          margin: 0 0 8px 0;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0;
        }
        th { 
          background: #f3f4f6;
          padding: 12px 8px;
          text-align: left;
          font-size: 11px;
          font-weight: bold;
          color: #374151;
          border: 1px solid #e5e7eb;
        }
        td { 
          border: 1px solid #e5e7eb; 
          padding: 8px; 
          font-size: 10px;
        }
        .total-section { 
          text-align: right; 
          margin-top: 25px;
          padding-right: 8px;
        }
        .total-line { 
          margin: 5px 0;
          font-size: 11px;
        }
        .grand-total { 
          font-size: 16px; 
          font-weight: bold;
          color: #2563eb;
          margin-top: 10px;
        }
        .conditions-section {
          margin-top: 30px;
          font-size: 10px;
        }
        .conditions-section h3 {
          font-size: 12px;
          color: #374151;
          margin-bottom: 8px;
        }
        .notes-block {
          background: #f9fafb;
          padding: 12px;
          border-radius: 8px;
          margin-top: 15px;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 50px;
          padding-top: 30px;
          border-top: 2px solid #e5e7eb;
        }
        .signature-box {
          flex: 1;
          text-align: center;
        }
        .signature-box h4 {
          font-size: 11px;
          margin-bottom: 40px;
          color: #6b7280;
        }
        .signature-line {
          border-bottom: 1px solid #374151;
          width: 200px;
          margin: 0 auto 8px auto;
        }
        .signature-label {
          font-size: 9px;
          color: #6b7280;
        }
        .bon-pour-accord {
          text-align: center;
          margin-top: 30px;
          font-style: italic;
          font-weight: bold;
          font-size: 11px;
          color: #374151;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <div class="company-name">${data.company_settings?.nom_entreprise || 'Votre Entreprise'}</div>
          <div>${data.company_settings?.siret ? 'SIRET: ' + data.company_settings.siret : ''}</div>
          <div>${data.company_settings?.adresse || ''}</div>
          <div>${data.company_settings?.code_postal || ''} ${data.company_settings?.ville || ''}</div>
          <div>${data.company_settings?.telephone || ''}</div>
          <div>${data.company_settings?.email || ''}</div>
        </div>
        <div class="devis-title">
          <h1>DEVIS</h1>
          <div class="reference">Réf: ${data.reference}</div>
          <div class="reference">Date: ${new Date(data.date_creation).toLocaleDateString('fr-FR')}</div>
        </div>
      </div>

      <div class="separator"></div>

      <div class="client-block">
        <h3>CLIENT</h3>
        ${data.clients?.entreprise ? `<div><strong>${data.clients.entreprise}</strong></div>` : ''}
        <div>${data.clients?.prenom || ''} ${data.clients?.nom || ''}</div>
        <div>${data.clients?.email || ''}</div>
        <div>${data.clients?.telephone || ''}</div>
        <div>${data.clients?.adresse || ''}</div>
      </div>

      <div class="separator"></div>

      <table>
        <thead>
          <tr>
            <th style="width: 45%">Description</th>
            <th style="width: 10%; text-align: center">Qté</th>
            <th style="width: 15%; text-align: right">Prix unit. HT</th>
            <th style="width: 10%; text-align: center">TVA</th>
            <th style="width: 20%; text-align: right">Total HT</th>
          </tr>
        </thead>
        <tbody>
          ${lignes.map((ligne: any) => `
            <tr>
              <td>${ligne.description}</td>
              <td style="text-align: center">${ligne.quantite}</td>
              <td style="text-align: right">${parseFloat(ligne.prix_unitaire).toFixed(2)} €</td>
              <td style="text-align: center">${ligne.tva}%</td>
              <td style="text-align: right">${(ligne.quantite * parseFloat(ligne.prix_unitaire)).toFixed(2)} €</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-section">
        <div class="total-line">Total HT: ${parseFloat(data.total_ht || 0).toFixed(2)} €</div>
        <div class="total-line">Total TVA: ${parseFloat(data.total_tva || 0).toFixed(2)} €</div>
        <div class="total-line grand-total">TOTAL TTC: ${parseFloat(data.total_ttc || 0).toFixed(2)} €</div>
      </div>

      <div class="separator"></div>

      <div class="conditions-section">
        <h3>Conditions et validité</h3>
        <div><strong>Validité du devis:</strong> ${data.validite_jours || 30} jours (jusqu'au ${validiteDate.toLocaleDateString('fr-FR')})</div>
        <div><strong>Conditions de paiement:</strong> ${data.conditions_paiement || 'Paiement à réception de facture'}</div>
        ${data.delai_realisation ? `<div><strong>Délai de réalisation:</strong> ${data.delai_realisation}</div>` : ''}
        
        ${data.notes ? `
        <div class="notes-block">
          <strong>Notes:</strong><br/>
          ${data.notes}
        </div>
        ` : ''}
      </div>

      <div class="signatures">
        <div class="signature-box">
          <h4>Signature de l'entreprise</h4>
          <div class="signature-line"></div>
          <div class="signature-label">${data.company_settings?.nom_entreprise || 'Votre Entreprise'}</div>
        </div>
        <div class="signature-box">
          <h4>Signature du client</h4>
          <div class="signature-line"></div>
          <div class="signature-label">${data.client_nom || 'Client'}</div>
        </div>
      </div>

      <div class="bon-pour-accord">
        Bon pour accord
      </div>
    </body>
    </html>
  `;
}
