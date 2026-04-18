import { runScraper } from '../../scraper.js';

export const handler = async (event, context) => {
    // Solo permitir POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Método no permitido. Usa POST.' })
        };
    }

    try {
        const params = JSON.parse(event.body || '{}');
        
        // Ejecutar el scraper
        const result = await runScraper({
            ubicacion: params.ubicacion,
            palabrasClavesRaw: params.palabrasClaves,
            lat: parseFloat(params.lat),
            lng: parseFloat(params.lng),
            radius: parseInt(params.radius),
            limit: parseInt(params.limit),
            pureKeywordsRaw: params.pureKeywords
        });

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(result)
        };
    } catch (error) {
        console.error('Error en la función de scraping:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Error interno en el motor de extracción',
                details: error.message 
            })
        };
    }
};
