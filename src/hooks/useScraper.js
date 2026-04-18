import { useState, useEffect } from 'react';

export const useScraper = () => {
  const [scraping, setScraping] = useState(false);
  const [serverOnline, setServerOnline] = useState(true); // Netlify siempre está "online"
  const [scraperLogs, setScraperLogs] = useState([]);

  const iniciarScraper = async (params) => {
    setScraping(true);
    setScraperLogs(["Iniciando extracción en la nube de Netlify..."]);
    
    try {
      const res = await fetch(`/.netlify/functions/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setScraperLogs(prev => [...prev, ...data.logs, `¡Éxito! Leads insertados: ${data.insertados}`]);
      } else {
        setScraperLogs(prev => [...prev, `Error: ${data.error || 'Fallo en la extracción'}`]);
      }
    } catch (err) {
      setScraperLogs(prev => [...prev, "Error de conexión con Netlify Functions."]);
    } finally {
      setScraping(false);
    }
  };

  const detenerScraper = async () => {
    // Las funciones serverless no se pueden "detener" una vez lanzadas,
    // pero podemos limpiar el estado local.
    setScraperLogs(prev => [...prev, "No es posible detener una operación en curso en Netlify, pero el sistema ignorará los resultados."]);
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
