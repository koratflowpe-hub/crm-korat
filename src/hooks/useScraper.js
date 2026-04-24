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
    
    // Usamos SIEMPRE la ruta relativa. Esto garantiza que pase por el proxy de Vite en local
    // y por los rewrites de vercel.json en producción, ignorando cualquier variable de entorno vieja.
    const scraperUrl = '/api/scraper';
    
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
