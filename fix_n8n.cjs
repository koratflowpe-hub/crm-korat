const fs = require('fs');
const https = require('https');

const apiUrl = 'https://n8n.koratflow.agency/api/v1';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNjEyNDA3Zi0wY2Y5LTQ0NDktOThmYi1jZDdhODFmMTFhZmUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNTlmMGU4ZGEtYjU4Yi00ODA3LTk5MmQtNjNmZGYxYWM5YmJjIiwiaWF0IjoxNzcwNzQxMDM4fQ.lvFKb5WhiLRYNjA0l-LPTuc7f6_AT-mcFkPUpFjyXD4';

function request(url, method, payload = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json'
      }
    };
    if (payload) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(payload));
    }
    const req = https.request(url, options, (res) => {
      console.log(`Response: ${res.statusCode} for ${url}`);
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ statusCode: res.statusCode, data: JSON.parse(data) }));
    });
    req.on('error', reject);
    if (payload) req.write(JSON.stringify(payload));
    req.end();
  });
}

async function run() {
  try {
    console.log('Fetching workflow...');
    const resultGet = await request(apiUrl + '/workflows/qor5B4a5iefcZF9Wtu6JY', 'GET');
    const wf = resultGet.data; // The result IS the workflow object

    console.log('Updating nodes...');
    const getNode = wf.nodes.find(n => n.name === 'Get Existing Leads');
    if (getNode) {
      getNode.parameters.url = 'https://hywlytsbogbassecflbw.supabase.co/rest/v1/leads_salones?select=telefono';
    }

    const filterNode = wf.nodes.find(n => n.name === 'Filtrar y Limpiar');
    if (filterNode) {
      // We will replace the entire script to be safe and clean
      filterNode.parameters.jsCode = `
// 1. Recuperamos los datos del Webhook de forma segura
const webhookNode = $('Webhook CRM').first();
const webhook = webhookNode ? webhookNode.json.body : {};

// 2. Recuperamos los teléfonos existentes de Supabase
let existingPhones = new Set();
try {
  const existingLeadsData = $('Get Existing Leads').first().json;
  const leadsArray = Array.isArray(existingLeadsData) ? existingLeadsData : [existingLeadsData];
  
  leadsArray.forEach(lead => {
      if (lead.telefono) {
          let p = lead.telefono.replace(/\\D/g, "");
          // Si tiene 9 dígitos y empieza con 9, le ponemos el 51 para normalizar
          if (p.length === 9 && p.startsWith('9')) p = '51' + p;
          existingPhones.add(p);
      }
  });
} catch (e) {
  console.log("Error cargando teléfonos existentes:", e);
}

// 3. Obtenemos los lugares de TODOS los items
const allItems = $input.all();
let places = [];
for (const item of allItems) {
  if (item.json && item.json.places && Array.isArray(item.json.places)) {
    places.push(...item.json.places);
  } else if (item.json) {
    places.push(item.json);
  }
}

// 4. Parámetros de filtrado
const pureKeywordsRaw = webhook.pureKeywords || '';
const limit = parseInt(webhook.limit) || 15;
const testMode = webhook.testMode === true || webhook.testMode === 'true';

function normalizeStr(str) {
  return (str || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
}

const strictKeywords = pureKeywordsRaw.split(',')
  .map(t => normalizeStr(t.trim()))
  .filter(t => t.length > 0);

let validLeads = [];

// 5. Procesamiento
for (const place of places) {
  if (validLeads.length >= limit) break;
  
  const name = normalizeStr(place.displayName?.text || '');
  const primaryType = normalizeStr(place.primaryType || '');
  
  let isValid = (testMode || strictKeywords.length === 0);
  
  if (!isValid) {
    for (const term of strictKeywords) {
      if (name.includes(term) || primaryType.includes(term)) {
        isValid = true;
        break;
      }
    }
  }

  // 6. Verificación final y filtro de duplicados
  if (isValid && place.nationalPhoneNumber) {
    let telefono = place.nationalPhoneNumber.replace(/\\s/g, '');
    let cleanPhone = telefono.replace(/\\D/g, '');
    
    // Normalizamos el de Google también
    if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) cleanPhone = '51' + cleanPhone;

    // AQUI SALTAMOS SI YA EXISTE EN BASE DE DATOS
    if (existingPhones.has(cleanPhone)) {
        console.log("Omitiendo duplicado:", cleanPhone);
        continue;
    }

    validLeads.push({
      nombre_salon: place.displayName?.text || 'Desconocido',
      direccion: place.formattedAddress || 'Sin dirección',
      telefono: telefono,
      cleanPhone: cleanPhone,
      calificacion: place.rating || 0,
      total_resenas: place.userRatingCount || 0,
      sitioweb: place.websiteUri || null,
      ubicacion: webhook.ubicacion || 'Localización detectada',
      descripcion_google: place.editorialSummary?.text || '',
      categorias: (place.types || []).join(', ')
    });
  }
}

return validLeads.map(lead => ({ json: lead }));`.trim();
    }

    const codeJs1Node = wf.nodes.find(n => n.name === 'Code in JavaScript1');
    if (codeJs1Node) {
      codeJs1Node.parameters.jsCode = `
const webhookData = $('Webhook CRM').first().json.body;
const keywords = (webhookData.pureKeywords || "").split(',');

return keywords.map(kw => ({
  json: {
    ...webhookData,
    nicho: kw.trim()
  }
}));`.trim();
    }

    const cleanPayload = {
      name: wf.name,
      nodes: wf.nodes,
      connections: wf.connections,
      settings: {
        executionOrder: wf.settings.executionOrder || 'v1',
        timezone: 'America/Lima'
      }
    };

    console.log('Uploading fixed workflow...');
    const result = await request(apiUrl + '/workflows/qor5B4a5iefcZF9Wtu6JY', 'PUT', cleanPayload);
    console.log('Status:', result.statusCode);
  } catch (e) {
    console.error('Error:', e);
  }
}

run();
