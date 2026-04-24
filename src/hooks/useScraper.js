import { useState, useEffect, useRef } from 'react';

export const useScraper = () => {
  const [scraping, setScraping] = useState(false);
  const [serverOnline, setServerOnline] = useState(true); // El servicio de n8n siempre está "online"
  const [scraperLogs, setScraperLogs] = useState([]);
  const isFetchingRef = useRef(false);

  const iniciarScraper = async (params, onFinish) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setScraping(true);
    setScraperLogs(["Iniciando extracción en la nube de n8n..."]);
    
    // Usamos el rewrite de Vercel en producción para evitar errores de CORS
    // Si no está definido, usamos la ruta relativa que maneja vercel.json
    let scraperUrl = import.meta.env.VITE_SCRAPER_URL || '/api/scraper';
    
    // Defensa: Si Vercel tiene un .env viejo con localhost, lo forzamos a usar la ruta relativa en prod
    if (window.location.hostname !== 'localhost' && scraperUrl.includes('localhost')) {
      scraperUrl = '/api/scraper';
    }
    
    console.log("🚀 Enviando petición de scraping a:", scraperUrl);

    try {
      const res = await fetch(scraperUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // n8n no devuelve 'logs' por defecto, así que creamos una respuesta amigable
        const logs = Array.isArray(data.logs) ? data.logs : ["Proceso iniciado con éxito en n8n Cloud."];
        setScraperLogs(prev => [...prev, ...logs, "Los leads aparecerán en el CRM conforme se procesen."]);
        if (onFinish) onFinish();
      } else {
        setScraperLogs(prev => [...prev, `Error: ${data.error || 'Fallo en la comunicación con n8n'}`]);
      }
    } catch (err) {
      setScraperLogs(prev => [...prev, "Error de conexión con el servidor de n8n."]);
    } finally {
      isFetchingRef.current = false;
      setScraping(false);
    }
  };

  const detenerScraper = async () => {
    // Las funciones serverless no se pueden "detener" una vez lanzadas,
    // pero podemos limpiar el estado local.
    setScraperLogs(prev => [...prev, "No es posible detener una operación en curso en n8n, pero el sistema ignorará los resultados."]);
    setScraping(false);
  };

  return {
    scraping,
    serverOnline,
    scraperLogs,
    iniciarScraper,
    detenerScraper,
    setScraperLogs
  };
};
