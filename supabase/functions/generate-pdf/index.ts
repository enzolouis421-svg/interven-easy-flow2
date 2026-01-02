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
    
    // Configuration Supabase intégrée
    const supabaseUrl = 'https://hixyhddxmadhujyxbwqh.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpeHloZGR4bWFkaHVqeXhid3FoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk3MjEwMSwiZXhwIjoyMDgxNTQ4MTAxfQ.iRjF8j8dnCCPeItZfeK_h1NLlc9mhPbJcFUz3nx73qc';
    const supabase = createClient(supabaseUrl, supabaseKey);

    let data, error;
    
    if (type === 'intervention') {
      const result = await supabase
        .from('interventions')
        .select(`
          *,
          clients(nom, prenom, email, telephone, adresse, entreprise, code_postal, ville),
          techniciens(nom, prenom, email, telephone)
        `)
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

      // Récupérer les informations client
      if (data && data.client_id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('*')
          .eq('id', data.client_id)
          .single();
        
        data.clients = clientData;
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
  const safe = (str: any) => String(str || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const formatDate = (date: string) => date ? new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const statusLabels: any = { a_faire: "À faire", en_cours: "En cours", termine: "Terminée" };
  const statusLabel = statusLabels[data.statut] || data.statut;
  const photos = typeof data.photos === 'string' ? JSON.parse(data.photos) : (data.photos || []);
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { margin: 20mm; size: A4; }
    body { font-family: Arial, sans-serif; padding: 0; color: #111827; background: #fff; font-size: 11px; }
    .container { width: 100%; max-width: 100%; margin: 0; background: white; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
    .company-info { flex: 1; max-width: 50%; }
    .company-logo { height: 50px; margin-bottom: 12px; max-width: 100%; }
    .company-name { font-size: 16px; font-weight: bold; margin-bottom: 4px; word-wrap: break-word; }
    .company-details { font-size: 10px; color: #6b7280; line-height: 1.4; }
    .intervention-title { text-align: right; flex: 1; max-width: 50%; }
    .intervention-title h1 { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 6px; }
    .intervention-meta { font-size: 10px; color: #6b7280; }
    .intervention-meta span { font-weight: 600; }
    .client-section { margin-bottom: 20px; }
    .client-section h3 { font-weight: bold; font-size: 14px; margin-bottom: 6px; }
    .client-block { background: #f9fafb; padding: 12px; border-radius: 6px; }
    .client-name { font-weight: 600; margin-bottom: 4px; font-size: 12px; word-wrap: break-word; }
    .client-details { font-size: 10px; color: #6b7280; line-height: 1.4; }
    .content-section { margin-bottom: 18px; page-break-inside: avoid; }
    .content-section h3 { font-weight: bold; font-size: 14px; margin-bottom: 6px; }
    .content-text { color: #374151; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word; font-size: 11px; }
    .photos-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 12px; }
    .photo-item { width: 100%; max-width: 100%; height: auto; max-height: 150px; object-fit: contain; border-radius: 6px; border: 1px solid #e5e7eb; background: #f9fafb; }
    .signature-section { margin-top: 24px; padding-top: 20px; border-top: 2px solid #e5e7eb; page-break-inside: avoid; }
    .signature-section h3 { font-weight: bold; font-size: 14px; margin-bottom: 12px; }
    .signature-box { border: 2px solid #d1d5db; border-radius: 6px; padding: 12px; display: inline-block; background: #f9fafb; max-width: 100%; }
    .signature-img { max-height: 120px; max-width: 100%; height: auto; }
    .signature-note { font-size: 9px; color: #6b7280; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="company-info">
        ${data.company_settings?.logo_url ? `<img src="${safe(data.company_settings.logo_url)}" alt="Logo" class="company-logo" />` : ''}
        <div class="company-name">${safe(data.company_settings?.nom_entreprise || 'Votre Entreprise')}</div>
        <div class="company-details">
          ${data.company_settings?.adresse ? `<div>${safe(data.company_settings.adresse)}</div>` : ''}
          ${data.company_settings?.code_postal && data.company_settings?.ville ? `<div>${safe(data.company_settings.code_postal)} ${safe(data.company_settings.ville)}</div>` : ''}
          ${data.company_settings?.siret ? `<div>SIRET: ${safe(data.company_settings.siret)}</div>` : ''}
          ${data.company_settings?.telephone ? `<div>${safe(data.company_settings.telephone)}</div>` : ''}
          ${data.company_settings?.email ? `<div>${safe(data.company_settings.email)}</div>` : ''}
        </div>
      </div>
      <div class="intervention-title">
        <h1>INTERVENTION</h1>
        <div class="intervention-meta">
          <div><span>Date:</span> ${formatDate(data.date_intervention)}</div>
          <div><span>Statut:</span> ${safe(statusLabel)}</div>
        </div>
      </div>
    </div>
    
    ${data.clients ? `
    <div class="client-section">
      <h3>Client</h3>
      <div class="client-block">
        <div class="client-name">${safe(data.clients.entreprise || `${data.clients.prenom || ''} ${data.clients.nom || ''}`.trim())}</div>
        <div class="client-details">
          ${data.clients.adresse ? `<div>${safe(data.clients.adresse)}</div>` : ''}
          ${data.clients.code_postal && data.clients.ville ? `<div>${safe(data.clients.code_postal)} ${safe(data.clients.ville)}</div>` : ''}
          ${data.clients.email ? `<div>${safe(data.clients.email)}</div>` : ''}
          ${data.clients.telephone ? `<div>${safe(data.clients.telephone)}</div>` : ''}
        </div>
      </div>
    </div>
    ` : ''}
    
    <div class="content-section">
      <h3>Titre</h3>
      <div class="content-text">${safe(data.titre)}</div>
    </div>
    
    ${data.adresse ? `
    <div class="content-section">
      <h3>Adresse d'intervention</h3>
      <div class="content-text">${safe(data.adresse)}</div>
    </div>
    ` : ''}
    
    ${data.description ? `
    <div class="content-section">
      <h3>Description du problème</h3>
      <div class="content-text">${safe(data.description)}</div>
    </div>
    ` : ''}
    
    ${data.materiel_utilise ? `
    <div class="content-section">
      <h3>Matériel utilisé</h3>
      <div class="content-text">${safe(data.materiel_utilise)}</div>
    </div>
    ` : ''}
    
    ${data.commentaire_technicien ? `
    <div class="content-section">
      <h3>Commentaire du technicien</h3>
      <div class="content-text">${safe(data.commentaire_technicien)}</div>
    </div>
    ` : ''}
    
    ${photos && photos.length > 0 ? `
    <div class="content-section">
      <h3>Photos</h3>
      <div class="photos-grid">
        ${photos.map((url: string) => `<img src="${safe(url)}" alt="Photo" class="photo-item" />`).join('')}
      </div>
    </div>
    ` : ''}
    
    ${data.signature_url ? `
    <div class="signature-section">
      <h3>Signature client</h3>
      <div class="signature-box">
        <img src="${safe(data.signature_url)}" alt="Signature client" class="signature-img" />
      </div>
      <div class="signature-note">Signature électronique conforme au règlement eIDAS</div>
    </div>
    ` : ''}
  </div>
</body>
</html>`;
}

function generateFactureHTML(data: any) {
  const lignes = typeof data.lignes_prestation === 'string' 
    ? JSON.parse(data.lignes_prestation) 
    : (data.lignes_prestation || []);
  const safe = (str: any) => String(str || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const formatDate = (date: string) => date ? new Date(date).toLocaleDateString('fr-FR') : '';
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { margin: 20mm; size: A4; }
    body { font-family: Arial, sans-serif; padding: 0; color: #111827; background: #fff; font-size: 11px; }
    .container { width: 100%; max-width: 100%; margin: 0; background: white; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .facture-title h1 { font-size: 24px; font-weight: bold; margin-bottom: 4px; }
    .facture-ref { font-size: 11px; color: #6b7280; }
    .company-info { text-align: right; max-width: 50%; }
    .company-name { font-weight: bold; margin-bottom: 4px; font-size: 14px; word-wrap: break-word; }
    .company-details { font-size: 10px; color: #6b7280; line-height: 1.4; }
    .client-section { margin-bottom: 20px; }
    .client-label { font-weight: 600; margin-bottom: 6px; font-size: 12px; }
    .client-block { background: #f3f4f6; padding: 12px; border-radius: 6px; }
    .client-name { font-weight: 500; margin-bottom: 4px; font-size: 11px; word-wrap: break-word; }
    .client-details { font-size: 10px; color: #6b7280; line-height: 1.4; }
    .dates-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .date-item { }
    .date-label { font-size: 10px; color: #6b7280; margin-bottom: 4px; }
    .date-value { font-weight: 500; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; page-break-inside: auto; }
    thead { border-bottom: 2px solid #e5e7eb; display: table-header-group; }
    tbody { display: table-row-group; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    th { text-align: left; padding: 8px 6px; font-weight: 600; font-size: 10px; }
    th.text-right { text-align: right; }
    th.text-center { text-align: center; }
    td { padding: 8px 6px; border-bottom: 1px solid #e5e7eb; font-size: 10px; word-wrap: break-word; }
    td.text-right { text-align: right; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 20px; page-break-inside: avoid; }
    .totals-box { width: 200px; }
    .total-line { display: flex; justify-between; padding: 6px 0; font-size: 11px; }
    .total-line.border-top { border-top: 2px solid #e5e7eb; padding-top: 12px; margin-top: 6px; }
    .total-line.bold { font-weight: bold; font-size: 14px; }
    .section { margin-bottom: 18px; page-break-inside: avoid; }
    .section-label { font-weight: 600; margin-bottom: 6px; font-size: 12px; }
    .section-text { font-size: 10px; color: #6b7280; line-height: 1.5; white-space: pre-line; word-wrap: break-word; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1 class="facture-title">FACTURE</h1>
        <div class="facture-ref">${safe(data.reference)}</div>
      </div>
      ${data.company_settings ? `
      <div class="company-info">
        <div class="company-name">${safe(data.company_settings.nom_entreprise)}</div>
        <div class="company-details">
          ${data.company_settings.adresse ? `<div>${safe(data.company_settings.adresse)}</div>` : ''}
          ${data.company_settings.code_postal && data.company_settings.ville ? `<div>${safe(data.company_settings.code_postal)} ${safe(data.company_settings.ville)}</div>` : ''}
          ${data.company_settings.siret ? `<div>SIRET: ${safe(data.company_settings.siret)}</div>` : ''}
          ${data.company_settings.email ? `<div>${safe(data.company_settings.email)}</div>` : ''}
          ${data.company_settings.telephone ? `<div>${safe(data.company_settings.telephone)}</div>` : ''}
        </div>
      </div>
      ` : ''}
    </div>
    
    ${data.clients ? `
    <div class="client-section">
      <div class="client-label">Client</div>
      <div class="client-block">
        <div class="client-name">${safe(data.clients.nom || data.client_nom)}</div>
        <div class="client-details">
          ${data.clients.entreprise ? `<div>${safe(data.clients.entreprise)}</div>` : ''}
          ${data.clients.adresse ? `<div>${safe(data.clients.adresse)}</div>` : ''}
          ${data.clients.code_postal && data.clients.ville ? `<div>${safe(data.clients.code_postal)} ${safe(data.clients.ville)}</div>` : ''}
          ${data.clients.email ? `<div>${safe(data.clients.email)}</div>` : ''}
          ${data.clients.telephone ? `<div>${safe(data.clients.telephone)}</div>` : ''}
        </div>
      </div>
    </div>
    ` : ''}
    
    <div class="dates-grid">
      <div class="date-item">
        <div class="date-label">Date d'émission</div>
        <div class="date-value">${formatDate(data.date_emission)}</div>
      </div>
      ${data.date_echeance ? `
      <div class="date-item">
        <div class="date-label">Date d'échéance</div>
        <div class="date-value">${formatDate(data.date_echeance)}</div>
      </div>
      ` : ''}
      <div class="date-item">
        <div class="date-label">Statut</div>
        <div class="date-value">${safe(data.statut)}</div>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Qté</th>
          <th class="text-right">Prix HT</th>
          <th class="text-right">TVA</th>
          <th class="text-right">Total HT</th>
        </tr>
      </thead>
      <tbody>
        ${lignes.map((ligne: any) => `<tr><td>${safe(ligne.description)}</td><td class="text-right">${ligne.quantite}</td><td class="text-right">${parseFloat(String(ligne.prix_unitaire)).toFixed(2)} €</td><td class="text-right">${ligne.tva}%</td><td class="text-right">${(ligne.quantite * parseFloat(String(ligne.prix_unitaire))).toFixed(2)} €</td></tr>`).join('')}
      </tbody>
    </table>
    
    <div class="totals">
      <div class="totals-box">
        <div class="total-line">
          <span>Total HT:</span>
          <span>${parseFloat(String(data.total_ht || 0)).toFixed(2)} €</span>
        </div>
        <div class="total-line">
          <span>TVA:</span>
          <span>${parseFloat(String(data.total_tva || 0)).toFixed(2)} €</span>
        </div>
        <div class="total-line border-top bold">
          <span>Total TTC:</span>
          <span>${parseFloat(String(data.total_ttc || 0)).toFixed(2)} €</span>
        </div>
      </div>
    </div>
    
    ${data.conditions_paiement ? `
    <div class="section">
      <div class="section-label">Conditions de paiement</div>
      <div class="section-text">${safe(data.conditions_paiement)}</div>
    </div>
    ` : ''}
    
    ${data.notes ? `
    <div class="section">
      <div class="section-label">Notes</div>
      <div class="section-text">${safe(data.notes)}</div>
    </div>
    ` : ''}
  </div>
</body>
</html>`;
}

function generateDevisHTML(data: any) {
  const lignes = typeof data.lignes_prestation === 'string' 
    ? JSON.parse(data.lignes_prestation) 
    : (data.lignes_prestation || []);
  const validiteDate = new Date(data.date_creation);
  validiteDate.setDate(validiteDate.getDate() + (data.validite_jours || 30));
  const safe = (str: any) => String(str || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const formatDate = (date: string) => date ? new Date(date).toLocaleDateString('fr-FR') : '';
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { margin: 20mm; size: A4; }
    body { font-family: Arial, sans-serif; padding: 0; color: #111827; background: #fff; font-size: 11px; }
    .container { width: 100%; max-width: 100%; margin: 0; background: white; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
    .company-info { flex: 1; max-width: 50%; }
    .company-logo { height: 50px; margin-bottom: 12px; max-width: 100%; }
    .company-name { font-size: 16px; font-weight: bold; margin-bottom: 4px; word-wrap: break-word; }
    .company-details { font-size: 10px; color: #6b7280; line-height: 1.4; }
    .devis-title { text-align: right; flex: 1; max-width: 50%; }
    .devis-title h1 { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 6px; }
    .devis-meta { font-size: 10px; color: #6b7280; }
    .devis-meta span { font-weight: 600; }
    .client-section { margin-bottom: 20px; }
    .client-section h3 { font-weight: bold; font-size: 14px; margin-bottom: 6px; }
    .client-block { background: #f9fafb; padding: 12px; border-radius: 6px; }
    .client-name { font-weight: 600; margin-bottom: 4px; font-size: 12px; word-wrap: break-word; }
    .client-details { font-size: 10px; color: #6b7280; line-height: 1.4; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; page-break-inside: auto; }
    thead { background: rgba(37, 99, 235, 0.1); display: table-header-group; }
    tbody { display: table-row-group; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    th { border: 1px solid #d1d5db; padding: 8px 6px; text-align: left; font-weight: 600; font-size: 10px; }
    th.text-center { text-align: center; }
    th.text-right { text-align: right; }
    td { border: 1px solid #d1d5db; padding: 8px 6px; font-size: 10px; word-wrap: break-word; }
    td.text-center { text-align: center; }
    td.text-right { text-align: right; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 20px; page-break-inside: avoid; }
    .totals-box { width: 200px; }
    .total-line { display: flex; justify-between; padding: 6px 0; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
    .total-line.bg-primary { background: rgba(37, 99, 235, 0.1); padding: 10px; border-radius: 4px; border: none; margin-top: 6px; }
    .total-line.bold { font-weight: bold; font-size: 14px; color: #2563eb; }
    .conditions-section { margin-top: 20px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 10px; page-break-inside: avoid; }
    .conditions-section p { margin-bottom: 6px; }
    .conditions-section strong { font-weight: 600; }
    .signatures-section { margin-top: 32px; padding-top: 24px; border-top: 2px solid #e5e7eb; page-break-inside: avoid; }
    .signatures-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 24px; }
    .signature-box { text-align: center; }
    .signature-label { font-weight: 600; margin-bottom: 12px; font-size: 11px; }
    .signature-image { border: 2px solid #d1d5db; border-radius: 6px; padding: 6px; height: 100px; display: flex; align-items: center; justify-content: center; background: #f9fafb; margin-bottom: 12px; }
    .signature-img { max-height: 100%; max-width: 100%; height: auto; }
    .signature-placeholder { color: #9ca3af; font-size: 10px; }
    .signature-date { margin-top: 12px; }
    .signature-date-label { font-weight: 600; margin-bottom: 6px; font-size: 10px; }
    .signature-date-line { border-bottom: 2px solid #374151; width: 140px; margin: 0 auto; padding-bottom: 4px; }
    .bon-pour-accord { text-align: center; margin-top: 24px; font-style: italic; font-weight: bold; font-size: 12px; color: #374151; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="company-info">
        ${data.company_settings?.logo_url ? `<img src="${safe(data.company_settings.logo_url)}" alt="Logo" class="company-logo" />` : ''}
        <div class="company-name">${safe(data.company_settings?.nom_entreprise || 'Votre Entreprise')}</div>
        <div class="company-details">
          ${data.company_settings?.adresse ? `<div>${safe(data.company_settings.adresse)}</div>` : ''}
          ${data.company_settings?.code_postal && data.company_settings?.ville ? `<div>${safe(data.company_settings.code_postal)} ${safe(data.company_settings.ville)}</div>` : ''}
          ${data.company_settings?.siret ? `<div>SIRET: ${safe(data.company_settings.siret)}</div>` : ''}
          ${data.company_settings?.telephone ? `<div>${safe(data.company_settings.telephone)}</div>` : ''}
          ${data.company_settings?.email ? `<div>${safe(data.company_settings.email)}</div>` : ''}
        </div>
      </div>
      <div class="devis-title">
        <h1>DEVIS</h1>
        <div class="devis-meta">
          <div><span>N°:</span> ${safe(data.reference)}</div>
          <div><span>Date:</span> ${formatDate(data.date_creation)}</div>
          <div><span>Valide jusqu'au:</span> ${validiteDate.toLocaleDateString('fr-FR')}</div>
        </div>
      </div>
    </div>
    
    <div class="client-section">
      <h3>Client</h3>
      <div class="client-block">
        <div class="client-name">${safe(data.clients?.entreprise || `${data.clients?.prenom || ''} ${data.clients?.nom || ''}`.trim())}</div>
        <div class="client-details">
          ${data.clients?.adresse ? `<div>${safe(data.clients.adresse)}</div>` : ''}
          ${data.clients?.code_postal && data.clients?.ville ? `<div>${safe(data.clients.code_postal)} ${safe(data.clients.ville)}</div>` : ''}
          ${data.clients?.email ? `<div>${safe(data.clients.email)}</div>` : ''}
          ${data.clients?.telephone ? `<div>${safe(data.clients.telephone)}</div>` : ''}
        </div>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-center">Qté</th>
          <th class="text-right">P.U. HT</th>
          <th class="text-center">TVA</th>
          <th class="text-right">Total HT</th>
        </tr>
      </thead>
      <tbody>
        ${lignes.map((ligne: any) => `<tr><td>${safe(ligne.description)}</td><td class="text-center">${ligne.quantite}</td><td class="text-right">${parseFloat(String(ligne.prix_unitaire)).toFixed(2)} €</td><td class="text-center">${ligne.tva}%</td><td class="text-right">${(ligne.quantite * parseFloat(String(ligne.prix_unitaire))).toFixed(2)} €</td></tr>`).join('')}
      </tbody>
    </table>
    
    <div class="totals">
      <div class="totals-box">
        <div class="total-line">
          <span style="font-weight: 600;">Total HT:</span>
          <span>${parseFloat(String(data.total_ht || 0)).toFixed(2)} €</span>
        </div>
        <div class="total-line">
          <span style="font-weight: 600;">Total TVA:</span>
          <span>${parseFloat(String(data.total_tva || 0)).toFixed(2)} €</span>
        </div>
        <div class="total-line bg-primary bold">
          <span>TOTAL TTC:</span>
          <span style="color: #2563eb;">${parseFloat(String(data.total_ttc || 0)).toFixed(2)} €</span>
        </div>
      </div>
    </div>
    
    <div class="conditions-section">
      ${data.delai_realisation ? `<p><strong>Délai de réalisation:</strong> ${safe(data.delai_realisation)}</p>` : ''}
      <p><strong>Conditions de paiement:</strong> ${safe(data.conditions_paiement || 'Paiement à réception de facture')}</p>
      ${data.notes ? `<p style="margin-top: 12px;"><strong>Notes:</strong><br/>${safe(data.notes)}</p>` : ''}
    </div>
    
    <div class="signatures-section">
      <div class="signatures-grid">
        <div class="signature-box">
          <div class="signature-label">Signature de l'entreprise</div>
          <div class="signature-image">
            ${data.company_signature_url ? `<img src="${safe(data.company_signature_url)}" alt="Signature entreprise" class="signature-img" />` : `<div class="signature-placeholder">Signature en attente</div>`}
          </div>
          <div class="signature-date">
            <div class="signature-date-label">Date:</div>
            <div class="signature-date-line">${data.date_signature ? formatDate(data.date_signature) : '___/___/_____'}</div>
          </div>
        </div>
        <div class="signature-box">
          <div class="signature-label">Signature du client</div>
          <div class="signature-image">
            ${data.client_signature_url ? `<img src="${safe(data.client_signature_url)}" alt="Signature client" class="signature-img" />` : `<div class="signature-placeholder">Signature en attente</div>`}
          </div>
          <div class="signature-date">
            <div class="signature-date-label">Date:</div>
            <div class="signature-date-line">${data.date_signature ? formatDate(data.date_signature) : '___/___/_____'}</div>
          </div>
        </div>
      </div>
      <div class="bon-pour-accord">Bon pour accord</div>
    </div>
  </div>
</body>
</html>`;
}
