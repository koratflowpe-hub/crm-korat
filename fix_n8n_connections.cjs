const fs = require('fs');

try {
  const fileContent = fs.readFileSync('C:/Users/Martin/.gemini/antigravity/brain/69af2bc3-36fd-4bef-86f2-d8ba39f544eb/.system_generated/steps/185/output.txt', 'utf8');
  const wf = JSON.parse(fileContent).data;

  // 1. Modificar Conexiones
  wf.connections['Webhook CRM'] = {
    main: [
      [
        { node: 'Get Existing Leads', type: 'main', index: 0 },
        { node: 'Get Rejected Leads', type: 'main', index: 0 },
        { node: 'Code in JavaScript1', type: 'main', index: 0 }
      ]
    ]
  };

  wf.connections['Get Existing Leads'] = { main: [[]] };
  wf.connections['Get Rejected Leads'] = { main: [[]] };

  // 2. Modificar nodo Filtrar y Limpiar
  const filtrarNode = wf.nodes.find(n => n.name === 'Filtrar y Limpiar');
  if (filtrarNode) {
    filtrarNode.parameters.jsCode = `// 1. Obtener listas de los nodos de Supabase
const existingItems = $('Get Existing Leads').all();
const rejectedItems = $('Get Rejected Leads').all();

let blacklistedPhones = new Set();
let blacklistedNames = new Set();

function processList(items) {
  items.forEach(item => {
    const lead = item.json;
    if (lead.telefono) {
      let p = lead.telefono.replace(/\\D/g, '');
      if (p.length === 9 && p.startsWith('9')) p = '51' + p;
      blacklistedPhones.add(p);
    }
    if (lead.nombre_salon) {
      blacklistedNames.add(lead.nombre_salon.toLowerCase().trim());
    }
  });
}

processList(existingItems);
processList(rejectedItems);

console.log(\`🛡️ Escudo Activo: Bloqueando \${blacklistedPhones.size} teléfonos y \${blacklistedNames.size} nombres conocidos.\`);

// 2. Datos del Webhook y Google
const webhookNode = $('Webhook CRM').first();
const webhook = webhookNode ? webhookNode.json.body : {};
const placesItems = $input.all();
let places = [];

placesItems.forEach(item => {
  if (item.json.places && Array.isArray(item.json.places)) places.push(...item.json.places);
  else if (item.json) places.push(item.json);
});

const limit = parseInt(webhook.limit) || 15;
const testMode = webhook.testMode === true || webhook.testMode === 'true';

const pureKeywordsRaw = webhook.pureKeywords || '';
function normalizeStr(str) {
  return (str || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
}
const strictKeywords = pureKeywordsRaw.split(',')
  .map(t => normalizeStr(t.trim()))
  .filter(t => t.length > 0);

let validLeads = [];

for (const place of places) {
  if (validLeads.length >= limit) break;
  
  const nombreOriginal = place.displayName?.text || 'Desconocido';
  const nombreLower = nombreOriginal.toLowerCase().trim();
  const nameNorm = normalizeStr(nombreOriginal);
  const primaryType = normalizeStr(place.primaryType || '');
  
  let isValid = (testMode || strictKeywords.length === 0);
  if (!isValid) {
    for (const term of strictKeywords) {
      if (nameNorm.includes(term) || primaryType.includes(term)) { isValid = true; break; }
    }
  }
  if (!isValid) continue;

  const telOriginal = place.nationalPhoneNumber || '';
  if (!telOriginal) continue;

  let cleanPhone = telOriginal.replace(/\\D/g, '');
  if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) cleanPhone = '51' + cleanPhone;

  // BLOQUEO CRÍTICO
  if (blacklistedPhones.has(cleanPhone)) {
    console.log(\`🚫 Bloqueado por Teléfono: \${cleanPhone}\`);
    continue;
  }
  
  if (blacklistedNames.has(nombreLower)) {
    console.log(\`🚫 Bloqueado por Nombre: \${nombreOriginal}\`);
    continue;
  }

  // Evitar duplicados en el mismo batch
  blacklistedPhones.add(cleanPhone);

  validLeads.push({
    nombre_salon: nombreOriginal,
    direccion: place.formattedAddress || 'Sin dirección',
    telefono: telOriginal,
    cleanPhone: cleanPhone,
    calificacion: place.rating || 0,
    total_resenas: place.userRatingCount || 0,
    sitioweb: place.websiteUri || null,
    ubicacion: webhook.ubicacion || 'Localización detectada',
    descripcion_google: place.editorialSummary?.text || '',
    categorias: (place.types || []).join(', ')
  });
}

return validLeads.map(l => ({ json: l }));`;
  }

  // Modificar settings para Execute Once
  const getExisting = wf.nodes.find(n => n.name === 'Get Existing Leads');
  if (getExisting) {
    getExisting.settings = getExisting.settings || {};
    getExisting.settings.executeOnce = true;
  }
  const getRejected = wf.nodes.find(n => n.name === 'Get Rejected Leads');
  if (getRejected) {
    getRejected.settings = getRejected.settings || {};
    getRejected.settings.executeOnce = true;
    getRejected.parameters.url = 'https://hywlytsbogbassecflbw.supabase.co/rest/v1/leads_rechazados?select=telefono,nombre_salon&limit=10000';
  }

  fs.writeFileSync('C:/Users/Martin/Documents/Korat-Flow-Agencia/CRM-KoratFlow/fixed-workflow.json', JSON.stringify(wf, null, 2));
  console.log('Fixed workflow written successfully.');
} catch(e) {
  console.error(e);
}
