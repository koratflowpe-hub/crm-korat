import axios from 'axios';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import google from 'googlethis';

dotenv.config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!GOOGLE_MAPS_API_KEY || !SUPABASE_URL) {
    console.error("⚠️ Faltan API Keys en el archivo .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function normalizeStr(str) {
    return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

const ubicacion = process.argv[2] || "Huaral";
const palabrasClavesRaw = process.argv[3] || "salon de belleza, spa";
const lat = parseFloat(process.argv[4]) || -11.495;
const lng = parseFloat(process.argv[5]) || -77.208;
const radius = parseInt(process.argv[6]) || 5000;
const limit = parseInt(process.argv[7]) || 15;
const pureKeywordsRaw = process.argv[8] || "salon,belleza,uñas,pestañas,cejas,cabello,alisado,nails,lash,brows,pedicura,manicura,extensiones,planchado,microblading,spa";

const strictKeywords = pureKeywordsRaw.split(',').map(t => normalizeStr(t.trim())).filter(t => t.length > 0);
const keywords = palabrasClavesRaw.split(',').map(k => k.trim()).filter(k => k.length > 0);
const SEARCH_QUERIES = keywords.map(kw => `${kw} en ${ubicacion}`);

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPlaces() {
    let insertados = 0;
    let omitidos = 0;

    console.log(`\n======================================================`);
    console.log(`🌐 Scrapeando Ojo de Águila: Lat ${lat}, Lng ${lng} R=${radius}m`);
    console.log(`🔐 Filtro Estricto (Sin tildes): [${strictKeywords.join(', ')}]`);
    console.log(`🎯 Límite Objetivo: ${limit} leads`);
    console.log(`======================================================\n`);

    for (const query of SEARCH_QUERIES) {
        if (insertados >= limit) {
             console.log(`\n🛑 Límite alcanzado (${limit}). Terminando búsqueda.`);
             break;
        }

        console.log(`\n🔍 Buscando: "${query}" ...`);
        try {
            const response = await axios.post(
                'https://places.googleapis.com/v1/places:searchText',
                {
                    textQuery: query,
                    languageCode: "es",
                    locationBias: {
                        circle: {
                            center: { latitude: lat, longitude: lng },
                            radius: radius
                        }
                    }
                },
                {
                    headers: {
                        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.businessStatus,places.primaryType,places.websiteUri'
                    }
                }
            );

            const places = response.data.places || [];
            console.log(`👉 ${places.length} candidatos crudos encontrados por Google. Filtrando basura...`);

            for (const place of places) {
                if (insertados >= limit) break;
                if (!place.nationalPhoneNumber) continue;

                // Normalizar nombre y tipo para obviar tildes y mayúsculas
                const name = normalizeStr(place.displayName?.text);
                const primaryType = normalizeStr(place.primaryType);
                
                let isValid = false;
                for (const strictTerm of strictKeywords) {
                     if (name.includes(strictTerm) || primaryType.includes(strictTerm)) {
                         isValid = true; 
                         break;
                     }
                }

                if (!isValid) {
                    console.log(`   [Rechazado] "${place.displayName?.text}" (No cumple filtro estricto de negocio)`);
                    continue;
                }

                const telefono = place.nationalPhoneNumber;

                // Chequear DB en vivo (Leads Activos)
                const { data: dataLeads, error } = await supabase
                    .from('leads_salones')
                    .select('id')
                    .eq('telefono', telefono);
                    
                if (!error && dataLeads && dataLeads.length > 0) {
                    omitidos++;
                    console.log(`   ⏳ [Omitido] ${place.displayName?.text} (Ya está en el CRM)`);
                    continue;
                }

                // Chequear Blacklist (Rechazados en Modo Producción)
                const { data: dataBlacklist } = await supabase
                    .from('leads_rechazados')
                    .select('telefono')
                    .eq('telefono', telefono);
                
                if (dataBlacklist && dataBlacklist.length > 0) {
                    omitidos++;
                    console.log(`   ⛔ [Blacklist] ${place.displayName?.text} (Fue eliminado permanentemente antes)`);
                    continue;
                }

                // Parsear URL de Website o RRSS
                const url = place.websiteUri || null;
                let sitioweb = null;
                let url_instagram = null;
                let url_facebook = null;

                if (url) {
                    const lcUrl = url.toLowerCase();
                    if (lcUrl.includes('instagram.com')) {
                        url_instagram = url;
                    } else if (lcUrl.includes('facebook.com') || lcUrl.includes('fb.com')) {
                        url_facebook = url;
                    } else {
                        sitioweb = url;
                    }
                }

                // Si pasa todo, verificar WhatsApp (Evolution API)
                const evoUrl = process.env.EVOLUTION_API_URL;
                const evoInstance = process.env.EVOLUTION_API_INSTANCE;
                const evoApiKey = process.env.EVOLUTION_API_KEY;
                let hasWA = true; // Por defecto asumimos true si la API falla
                
                if (evoUrl && evoInstance && evoApiKey) {
                    let cleanPhone = telefono.replace(/\D/g, '');
                    if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
                        cleanPhone = '51' + cleanPhone;
                    }
                    try {
                        const waCheckUrl = `${evoUrl}/chat/whatsappNumbers/${encodeURIComponent(evoInstance)}`;
                        const waCheckRes = await axios.post(waCheckUrl, { numbers: [cleanPhone] }, {
                            headers: { 'Content-Type': 'application/json', 'apikey': evoApiKey },
                            timeout: 8000
                        });
                        const data = waCheckRes.data;
                        if (Array.isArray(data) && data.length > 0) {
                            if (!data[0].exists) {
                                hasWA = false;
                                console.log(`   📴 [Sin WhatsApp] "${place.displayName?.text}" (${cleanPhone}) -> DESCARTADO`);
                            }
                        }
                    } catch (err) {
                        console.log(`   ⚠️ No se pudo validar WA para ${cleanPhone} (Manteniendo por precaución)`);
                    }
                }

                if (!hasWA) continue; // Si se confirmó que no tiene WA, no lo guardamos

                // Si pasa todo, insertar
                const lead = {
                    nombre_salon: place.displayName?.text || 'Desconocido',
                    direccion: place.formattedAddress || 'Sin dirección',
                    telefono: telefono,
                    calificacion: place.rating || 0,
                    total_resenas: place.userRatingCount || 0,
                    sitioweb: sitioweb,
                    url_instagram: url_instagram,
                    url_facebook: url_facebook,
                    estado_contacto: 'Pendiente Análisis IA'
                };

                // ============================================
                // BÚSQUEDA PROFUNDA HÍBRIDA (API SERPER + WEB CRAWLING)
                // ============================================
                let info_rrss_text = null;
                const SERPER_KEY = process.env.SERPER_API_KEY;

                // 1. Intento por API (Serper.dev - Confiable 100%)
                if (SERPER_KEY) {
                    try {
                        const searchStr = `${lead.nombre_salon} ${ubicacion} instagram OR facebook`;
                        const resSearch = await axios.post(`https://google.serper.dev/search`, 
                        {
                            q: searchStr,
                            gl: 'pe',
                            hl: 'es',
                            num: 5
                        }, 
                        {
                            headers: {
                                'X-API-KEY': SERPER_KEY,
                                'Content-Type': 'application/json'
                            },
                            timeout: 5000
                        });
                        
                        const items = resSearch.data.organic || [];
                        let extractedText = [];

                        items.forEach(res => {
                            extractedText.push(`[${res.title}] ${res.snippet}`);
                            const lcUrl = res.link.toLowerCase();
                            if (!lead.url_instagram && lcUrl.includes('instagram.com')) lead.url_instagram = res.link;
                            if (!lead.url_facebook && (lcUrl.includes('facebook.com') || lcUrl.includes('fb.com'))) lead.url_facebook = res.link;
                        });
                        
                        if (extractedText.length > 0) {
                            info_rrss_text = extractedText.join('\n\n');
                            console.log(`     🌟 ¡Redes y descripciones extraídas vía Serper.dev!`);
                        }
                    } catch (e) {
                        console.log(`     ⚠️ API Serper inaccesible (${e.message}). Usando rastreo directo...`);
                    }
                }

                // 2. RASTREO DIRECTO DEL SITIO WEB (Fallback Maestro)
                if (lead.sitioweb && (!lead.url_instagram || !lead.url_facebook) && !lead.sitioweb.includes('facebook.com') && !lead.sitioweb.includes('instagram.com')) {
                    try {
                        console.log(`   🕸️  Rastreando sitio web oficial: ${lead.sitioweb}...`);
                        const webRes = await axios.get(lead.sitioweb, { 
                            timeout: 8000, 
                            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } 
                        });
                        const html = webRes.data.toLowerCase();
                        
                        // Regex para cazar redes sociales en el código fuente
                        if (!lead.url_instagram) {
                            const igMatch = html.match(/href=["'](https?:\/\/(www\.)?instagram\.com\/[a-z0-9_\-\.]+)\/?["']/);
                            if (igMatch) {
                                lead.url_instagram = igMatch[1];
                                console.log(`     📸 ¡Instagram hallado en el sitio web!`);
                            }
                        }
                        if (!lead.url_facebook) {
                            const fbMatch = html.match(/href=["'](https?:\/\/(www\.)?(facebook\.com|fb\.com)\/[a-z0-9_\-\.]+)\/?["']/);
                            if (fbMatch) {
                                lead.url_facebook = fbMatch[1];
                                console.log(`     💙 ¡Facebook hallado en el sitio web!`);
                            }
                        }
                    } catch (err) {
                        console.log(`     🔸 No se pudo acceder al sitio web para rastreo profundo.`);
                    }
                }

                lead.info_rrss = info_rrss_text;

                const { error: insErr } = await supabase.from('leads_salones').insert([lead]);
                if (insErr) {
                    console.error(`   ❌ [Error DB] ${lead.nombre_salon}:`, insErr.message);
                } else {
                    insertados++;
                    console.log(`   ✅ [LEAD CAPTURADO] ${insertados}/${limit} -> ${lead.nombre_salon}`);
                }
            } // Fin places
        } catch (error) {
            console.error(`❌ Error consultando Google Maps:`, error.response?.data || error.message);
        }
        await delay(1200);
    } // Fin consultas

    console.log(`\n======================================================`);
    console.log(`🎉 RESUMEN FINAL OJO DE ÁGUILA:`);
    console.log(`   🔸 Leads Nuevos Perfectos Guardados: ${insertados}`);
    console.log(`   🔸 Leads Repetidos (Omitidos): ${omitidos}`);
    console.log(`======================================================\n`);

    // Guardar marca visual de que esta zona fue operada
    if (insertados > 0 || omitidos > 0) {
        await supabase.from('zonas_prospectadas').insert([{
            lat, 
            lng, 
            radius, 
            busqueda: `Limit:${limit} | KW: ${ubicacion}`
        }]);
    }
}

fetchPlaces();
