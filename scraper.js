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
                // BÚSQUEDA PROFUNDA ORGÁNICA (API OFICIAL)
                // ============================================
                let info_rrss_text = null;
                const GOOGLE_CX = process.env.GOOGLE_CUSTOM_SEARCH_CX;

                if (GOOGLE_CX) {
                    try {
                        console.log(`   🕵️‍♂️ Buscando contexto orgánico oficial para: ${lead.nombre_salon}...`);
                        const searchStr = `"${lead.nombre_salon}" ${ubicacion} instagram OR facebook`;
                        const resSearch = await axios.get(`https://www.googleapis.com/customsearch/v1`, {
                            params: {
                                key: GOOGLE_MAPS_API_KEY,
                                cx: GOOGLE_CX,
                                q: searchStr,
                                num: 3,
                                hl: 'es'
                            }
                        });

                        const items = resSearch.data.items || [];
                        if (items.length > 0) {
                            let extractedText = [];
                            for (const res of items) {
                                extractedText.push(`[${res.title}] ${res.snippet}`);
                                
                                const lcUrl = res.link.toLowerCase();
                                if (!lead.url_instagram && lcUrl.includes('instagram.com')) lead.url_instagram = res.link;
                                if (!lead.url_facebook && (lcUrl.includes('facebook.com') || lcUrl.includes('fb.com'))) lead.url_facebook = res.link;
                            }
                            info_rrss_text = extractedText.join('\n\n');
                            console.log(`     🌟 ¡Redes y descripciones orgánicas capturadas!`);
                        } else {
                            console.log(`     🔸 Sin resultados claros de RRSS orgánicas oficiales.`);
                        }
                    } catch (error) {
                        console.log(`     ⚠️ Error en búsqueda profunda oficial: ${error.response?.data?.error?.message || error.message}`);
                    }
                } else {
                    console.log(`     ⚠️ Búsqueda profunda omitida: Falta GOOGLE_CUSTOM_SEARCH_CX en .env`);
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
