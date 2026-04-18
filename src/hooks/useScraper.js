import { useState, useEffect } from 'react';

export const useScraper = (scraperUrl) => {
  const [scraping, setScraping] = useState(false);
  const [serverOnline, setServerOnline] = useState(false);
  const [scraperLogs, setScraperLogs] = useState([]);

  useEffect(() => {
    checkScraperStatus();
    const interval = setInterval(checkScraperStatus, 3000);
    return () => clearInterval(interval);
  }, [scraperUrl]);

  const checkScraperStatus = async () => {
    try {
      const res = await fetch(`${scraperUrl}/api/scrape/status`);
      const data = await res.json();
      setServerOnline(true);
      setScraping(data.isRunning);
    } catch (err) {
      setServerOnline(false);
      setScraping(false);
    }
  };

  const iniciarScraper = async (params) => {
    try {
      const res = await fetch(`${scraperUrl}/api/scrape/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (data.success) {
        setScraping(true);
        setScraperLogs(["Proceso iniciado exitosamente..."]);
      }
    } catch (err) {
      alert("Error al conectar con el motor de extracción.");
    }
  };

  const detenerScraper = async () => {
    try {
      await fetch(`${scraperUrl}/api/scrape/stop`, { method: 'POST' });
      setScraping(false);
      setScraperLogs(prev => [...prev, "Proceso detenido por el usuario."]);
    } catch (err) {
      alert("Error al detener el proceso.");
    }
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
