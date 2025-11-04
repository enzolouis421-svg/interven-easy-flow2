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
          clients(nom, prenom, email, telephone, adresse, code_postal, ville, entreprise)
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
  const statusLabels = {
    a_faire: "À faire",
    en_cours: "En cours",
    termine: "Terminée"
  };
  
  const formatDate = (date: string) => {
    if (!date) return 'Non définie';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Intervention - ${data.titre || 'Sans titre'} - ${formatDate(data.date_intervention)}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          size: A4;
          margin: 0;
        }
        
        body { 
          font-family: Arial, sans-serif;
          color: #000;
          background: white;
          padding: 0;
          margin: 0;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 48px;
          background: white;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          padding-bottom: 32px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .company-info {
          flex: 1;
        }
        
        .company-logo {
          height: 64px;
          margin-bottom: 16px;
        }
        
        .company-name {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .company-details {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
        }
        
        .intervention-info {
          text-align: right;
          flex: 1;
        }
        
        .intervention-title {
          font-size: 32px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 8px;
        }
        
        .intervention-meta {
          font-size: 14px;
          line-height: 1.6;
        }
        
        .intervention-meta strong {
          color: #374151;
        }
        
        .section {
          margin-bottom: 24px;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 8px;
          color: #111827;
        }
        
        .client-box {
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.6;
        }
        
        .client-box strong {
          font-size: 16px;
          display: block;
          margin-bottom: 4px;
        }
        
        .content-text {
          color: #374151;
          font-size: 14px;
          line-height: 1.8;
          white-space: pre-wrap;
        }
        
        .photos-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 16px;
        }
        
        .photo-item {
          width: 100%;
          height: 192px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        
        .signature-section {
          margin-top: 32px;
          padding-top: 32px;
          border-top: 2px solid #e5e7eb;
        }
        
        .signature-box {
          border: 2px solid #d1d5db;
          border-radius: 8px;
          padding: 16px;
          display: inline-block;
          background: #f9fafb;
        }
        
        .signature-image {
          max-height: 128px;
          max-width: 400px;
        }
        
        .signature-label {
          font-size: 12px;
          color: #6b7280;
          margin-top: 8px;
          font-family: Georgia, 'Times New Roman', serif;
          font-style: italic;
        }
        
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .container {
            padding: 20px;
          }
          
          @page {
            margin: 20mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="company-info">
            ${data.company_settings?.logo_url ? `
              <img src="${data.company_settings.logo_url}" alt="Logo" class="company-logo" />
            ` : ''}
            <div class="company-name">${data.company_settings?.nom_entreprise || 'Entreprise'}</div>
            <div class="company-details">
              ${data.company_settings?.adresse || ''}<br/>
              ${data.company_settings?.code_postal || ''} ${data.company_settings?.ville || ''}<br/>
              ${data.company_settings?.siret ? 'SIRET: ' + data.company_settings.siret + '<br/>' : ''}
              ${data.company_settings?.telephone || ''}<br/>
              ${data.company_settings?.email || ''}
            </div>
          </div>
          <div class="intervention-info">
            <div class="intervention-title">INTERVENTION</div>
            <div class="intervention-meta">
              <strong>Date:</strong> ${formatDate(data.date_intervention)}<br/>
              <strong>Statut:</strong> ${statusLabels[data.statut as keyof typeof statusLabels] || data.statut}
            </div>
          </div>
        </div>

        <!-- Client Info -->
        ${data.clients ? `
        <div class="section">
          <div class="section-title">Client</div>
          <div class="client-box">
            <strong>${data.clients.entreprise || `${data.clients.prenom || ''} ${data.clients.nom || ''}`}</strong>
            ${data.clients.adresse ? data.clients.adresse + '<br/>' : ''}
            ${data.clients.code_postal || data.clients.ville ? `${data.clients.code_postal || ''} ${data.clients.ville || ''}<br/>` : ''}
            ${data.clients.email ? data.clients.email + '<br/>' : ''}
            ${data.clients.telephone ? data.clients.telephone : ''}
          </div>
        </div>
        ` : ''}

        <!-- Intervention Details -->
        <div class="section">
          <div class="section-title">Titre</div>
          <div class="content-text">${data.titre || 'Sans titre'}</div>
        </div>

        ${data.adresse ? `
        <div class="section">
          <div class="section-title">Adresse d'intervention</div>
          <div class="content-text">${data.adresse}</div>
        </div>
        ` : ''}

        ${data.description ? `
        <div class="section">
          <div class="section-title">Description du problème</div>
          <div class="content-text">${data.description}</div>
        </div>
        ` : ''}

        ${data.materiel_utilise ? `
        <div class="section">
          <div class="section-title">Matériel utilisé</div>
          <div class="content-text">${data.materiel_utilise}</div>
        </div>
        ` : ''}

        ${data.commentaire_technicien ? `
        <div class="section">
          <div class="section-title">Commentaire du technicien</div>
          <div class="content-text">${data.commentaire_technicien}</div>
        </div>
        ` : ''}

        ${data.photos && data.photos.length > 0 ? `
        <div class="section">
          <div class="section-title">Photos</div>
          <div class="photos-grid">
            ${data.photos.map((url: string) => `
              <img src="${url}" alt="Photo intervention" class="photo-item" />
            `).join('')}
          </div>
        </div>
        ` : ''}

        ${data.signature_url ? `
        <div class="signature-section">
          <div class="section-title">Signature client</div>
          <div class="signature-box">
            <img src="${data.signature_url}" alt="Signature client" class="signature-image" />
          </div>
          <div class="signature-label">
            Signature électronique conforme au règlement eIDAS (UE) n°910/2014 sur l'identification électronique et les services de confiance
          </div>
        </div>
        ` : ''}
      </div>
      
      <script>
        // Déclencher l'impression automatiquement et définir le nom de fichier
        window.onload = function() {
          document.title = 'Intervention_${data.titre?.replace(/[^a-zA-Z0-9]/g, '_')}_${formatDate(data.date_intervention).replace(/[^a-zA-Z0-9]/g, '_')}';
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
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
      <title>Facture_${data.reference?.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date(data.date_emission).toLocaleDateString('fr-FR').replace(/\//g, '-')}</title>
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
        
        <div style="margin-top: 12px; padding: 12px; background: #fef2f2; border-left: 3px solid #dc2626; border-radius: 4px;">
          <strong style="color: #dc2626;">Pénalités de retard:</strong><br/>
          En cas de non-paiement sous un mois à compter de la date d'échéance, des pénalités de retard seront appliquées conformément aux dispositions légales en vigueur.
        </div>
        
        ${data.notes ? `
        <div class="notes-block">
          <strong>Notes:</strong><br/>
          ${data.notes}
        </div>
        ` : ''}
      </div>
      
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
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
      <title>Devis_${data.reference?.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date(data.date_creation).toLocaleDateString('fr-FR').replace(/\//g, '-')}</title>
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
          font-family: Georgia, 'Times New Roman', serif;
          font-style: italic;
        }
        .bon-pour-accord {
          text-align: center;
          margin-top: 30px;
          font-style: italic;
          font-weight: bold;
          font-size: 11px;
          color: #374151;
        }
        .legal-notice {
          font-size: 8px;
          color: #6b7280;
          text-align: center;
          margin-top: 15px;
          font-style: italic;
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
          ${data.company_signature_url ? `
            <img src="${data.company_signature_url}" alt="Signature entreprise" style="max-height: 80px; margin: 10px auto;" />
          ` : `
            <div class="signature-line"></div>
          `}
          <div class="signature-label">${data.company_settings?.nom_entreprise || 'Votre Entreprise'}</div>
        </div>
        <div class="signature-box">
          <h4>Signature du client</h4>
          ${data.client_signature_url ? `
            <img src="${data.client_signature_url}" alt="Signature client" style="max-height: 80px; margin: 10px auto;" />
          ` : `
            <div class="signature-line"></div>
          `}
          <div class="signature-label">${data.client_nom || 'Client'}</div>
          ${data.date_signature ? `
            <div style="margin-top: 8px; font-size: 9px; color: #6b7280;">
              Signé le ${new Date(data.date_signature).toLocaleDateString('fr-FR')}
            </div>
          ` : ''}
        </div>
      </div>

      <div class="bon-pour-accord">
        Bon pour accord
      </div>
      
      <div class="legal-notice">
        Signature électronique conforme au règlement eIDAS (UE) n°910/2014 sur l'identification électronique et les services de confiance
      </div>
      
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;
}
