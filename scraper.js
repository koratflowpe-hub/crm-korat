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

const SALON_SERVICES_KEYWORDS = [
    'manicura', 'pedicura', 'uñas', 'gel', 'acrilicas', 'semipermanente', 'esmaltado',
    'corte de cabello', 'peinado', 'tinte', 'mechas', 'balayage', 'iluminacion', 'babylights',
    'alisado', 'keratina', 'botox capilar', 'hidratacion', 'maquillaje', 'cejas', 'pestañas',
    'depilacion', 'microblading', 'micropigmentacion', 'faciales', 'masajes', 'limpieza facial',
    'spa', 'barberia', 'barba', 'extensiones', 'planchado', 'henna', 'lifting', 'permanente',
    'depilacion laser', 'cera', 'hilo', 'uñas esculpidas', 'polygel', 'soft gel'
];

function extractServices(text) {
    if (!text) return [];
    const normalizedText = normalizeStr(text);
    return SALON_SERVICES_KEYWORDS.filter(service => normalizedText.includes(normalizeStr(service)));
}

export async function runScraper({ 
    ubicacion = "", 
    palabrasClavesRaw = "salon de belleza, spa, barberia", 
    lat = -11.495, 
    lng = -77.208, 
    radius = 5000, 
    limit = 15, 
    pureKeywordsRaw = "salon,belleza,uñas,pestañas,cejas,cabello,alisado,nails,lash,brows,pedicura,manicura,extensiones,planchado,microblading,spa,barberia" 
}) {
    const strictKeywords = pureKeywordsRaw.split(',').map(t => normalizeStr(t.trim())).filter(t => t.length > 0);
    const keywords = palabrasClavesRaw.split(',').map(k => k.trim()).filter(k => k.length > 0);
    const SEARCH_QUERIES = keywords.map(kw => ubicacion ? `${kw} en ${ubicacion}` : kw);

    let logs = [];
    const log = (msg) => {
        const fullMsg = typeof msg === 'string' ? msg : JSON.stringify(msg);
        logs.push(fullMsg);
        console.log(fullMsg);
    };

    let insertados = 0;
    let omitidos = 0;

    log(`\n======================================================`);
    log(`🌐 Scrapeando Ojo de Águila: Lat ${lat}, Lng ${lng} R=${radius}m`);
    log(`🔐 Filtro Estricto (Sin tildes): [${strictKeywords.join(', ')}]`);
    log(`🎯 Límite Objetivo: ${limit} leads`);
    log(`======================================================\n`);

    for (const query of SEARCH_QUERIES) {
        if (insertados >= limit) {
             log(`\n🛑 Límite alcanzado (${limit}). Terminando búsqueda.`);
             break;
        }

        log(`\n🔍 Buscando: "${query}" ...`);
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
            log(`👉 ${places.length} candidatos crudos encontrados por Google. Filtrando basura...`);

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
                    log(`   [Rechazado] "${place.displayName?.text}" (No cumple filtro estricto de negocio)`);
                    continue;
                }

                let rawPhone = place.nationalPhoneNumber || place.internationalPhoneNumber || '';
                let telefono = rawPhone.replace(/\D/g, '');
                
                // Si es un celular peruano de 9 dígitos que empieza con 9, agregar prefijo 51
                if (telefono.length === 9 && telefono.startsWith('9')) {
                    telefono = '51' + telefono;
                }

                // Chequear DB en vivo (Leads Activos)
                const { data: dataLeads, error } = await supabase
                    .from('leads_salones')
                    .select('id')
                    .eq('telefono', telefono);
                    
                if (!error && dataLeads && dataLeads.length > 0) {
                    omitidos++;
                    log(`   ⏳ [Omitido] ${place.displayName?.text} (Ya está en el CRM)`);
                    continue;
                }

                // Chequear Blacklist (Rechazados en Modo Producción)
                const { data: dataBlacklist } = await supabase
                    .from('leads_rechazados')
                    .select('telefono')
                    .eq('telefono', telefono);
                
                if (dataBlacklist && dataBlacklist.length > 0) {
                    omitidos++;
                    log(`   ⛔ [Blacklist] ${place.displayName?.text} (Fue eliminado permanentemente antes)`);
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
                                log(`   📴 [Sin WhatsApp] "${place.displayName?.text}" (${cleanPhone}) -> DESCARTADO`);
                            }
                        }
                    } catch (err) {
                        log(`   ⚠️ No se pudo validar WA para ${cleanPhone} (Manteniendo por precaución)`);
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
                            const combinedText = extractedText.join('\n\n');
                            const detectedServices = extractServices(combinedText);
                            
                            info_rrss_text = combinedText;
                            if (detectedServices.length > 0) {
                                info_rrss_text += `\n\n✨ SERVICIOS DETECTADOS EN LA WEB: ${detectedServices.join(', ')}`;
                            }
                            log(`     🌟 ¡Redes y descripciones extraídas vía Serper.dev! (${detectedServices.length} servicios detectados)`);
                        }
                    } catch (e) {
                        log(`     ⚠️ API Serper inaccesible (${e.message}). Usando rastreo directo...`);
                    }
                }

                // 2. RASTREO DIRECTO DEL SITIO WEB (Fallback Maestro)
                if (lead.sitioweb && (!lead.url_instagram || !lead.url_facebook) && !lead.sitioweb.includes('facebook.com') && !lead.sitioweb.includes('instagram.com')) {
                    try {
                        log(`   🕸️  Rastreando sitio web oficial: ${lead.sitioweb}...`);
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
                                log(`     📸 ¡Instagram hallado en el sitio web!`);
                            }
                        }
                        if (!lead.url_facebook) {
                            const fbMatch = html.match(/href=["'](https?:\/\/(www\.)?(facebook\.com|fb\.com)\/[a-z0-9_\-\.]+)\/?["']/);
                            if (fbMatch) {
                                lead.url_facebook = fbMatch[1];
                                log(`     💙 ¡Facebook hallado en el sitio web!`);
                            }
                        }
                        }

                        // Extraer servicios también del sitio web real
                        const webServices = extractServices(html);
                        if (webServices.length > 0) {
                            const currentServices = extractServices(info_rrss_text || '');
                            const allServices = Array.from(new Set([...currentServices, ...webServices]));
                            
                            if (!info_rrss_text) info_rrss_text = "";
                            // Remover línea anterior de servicios si existe para actualizarla
                            info_rrss_text = info_rrss_text.split('\n\n✨ SERVICIOS DETECTADOS')[0];
                            info_rrss_text += `\n\n✨ SERVICIOS DETECTADOS EN LA WEB: ${allServices.join(', ')}`;
                        }
                    } catch (err) {
                        log(`     🔸 No se pudo acceder al sitio web para rastreo profundo.`);
                    }
                }

                lead.info_rrss = info_rrss_text;

                const { error: insErr } = await supabase.from('leads_salones').insert([lead]);
                if (insErr) {
                    log(`   ❌ [Error DB] ${lead.nombre_salon}: ${insErr.message}`);
                } else {
                    insertados++;
                    log(`   ✅ [LEAD CAPTURADO] ${insertados}/${limit} -> ${lead.nombre_salon}`);
                }
            } // Fin places
        } catch (error) {
            log(`❌ Error consultando Google Maps: ${error.response?.data || error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1200));
    } // Fin consultas

    log(`\n======================================================`);
    log(`🎉 RESUMEN FINAL OJO DE ÁGUILA:`);
    log(`   🔸 Leads Nuevos Perfectos Guardados: ${insertados}`);
    log(`   🔸 Leads Repetidos (Omitidos): ${omitidos}`);
    log(`======================================================\n`);

    // Guardar marca visual de que esta zona fue operada
    if (insertados > 0 || omitidos > 0) {
        await supabase.from('zonas_prospectadas').insert([{
            lat, 
            lng, 
            radius, 
            busqueda: `Limit:${limit} | KW: ${ubicacion}`
        }]);
    }

    return { success: true, insertados, omitidos, logs };
}

// Soporte para ejecución directa desde Node (usando import dinámico si es necesario para ESM)
if (process.argv[1] && process.argv[1].endsWith('scraper.js')) {
    runScraper({
        ubicacion: process.argv[2],
        palabrasClavesRaw: process.argv[3],
        lat: parseFloat(process.argv[4]),
        lng: parseFloat(process.argv[5]),
        radius: parseInt(process.argv[6]),
        limit: parseInt(process.argv[7]),
        pureKeywordsRaw: process.argv[8]
    }).then(console.log).catch(console.error);
}

