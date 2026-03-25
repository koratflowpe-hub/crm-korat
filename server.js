import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

let activeScraperProcess = null;

app.post('/api/scrape', (req, res) => {
    if (activeScraperProcess) {
        return res.status(400).json({ error: "Ya hay un proceso de scraping ejecutándose." });
    }

    // Nombres un poco más explícitos
    const { 
        ubicacion, palabrasClaves, 
        lat, lng, radius, limit, pureKeywords 
    } = req.body;
    
    console.log(`[Recepción] Petición de Scraper para área: ${ubicacion}`);
    console.log(`[Recepción] Coordenadas: ${lat}, ${lng} | Radio: ${radius}m`);
    console.log(`[Recepción] Límite: ${limit} leads`);
    console.log(`[Recepción] Palabras Obligatorias: ${pureKeywords}`);

    const args = [
        'scraper.js',
        ubicacion || '',
        palabrasClaves || '',
        lat || '',
        lng || '',
        radius || '',
        limit || '',
        pureKeywords || ''
    ];

    const scraperProcess = spawn('node', args, {
        cwd: process.cwd(),
        env: process.env
    });

    activeScraperProcess = scraperProcess;

    scraperProcess.stdout.on('data', (data) => {
        console.log(`[Scraper]: ${data}`);
    });

    scraperProcess.stderr.on('data', (data) => {
        console.error(`[Scraper Error]: ${data}`);
    });

    scraperProcess.on('close', (code) => {
        console.log(`[Scraper] finalizó con código ${code}`);
        activeScraperProcess = null;
    });

    res.json({ message: "Scraper iniciado correctamente", pid: scraperProcess.pid });
});

app.post('/api/scrape/stop', (req, res) => {
    if (activeScraperProcess) {
        activeScraperProcess.kill();
        activeScraperProcess = null;
        res.json({ message: "Scraper detenido" });
    } else {
        res.status(400).json({ error: "No hay ningún scraper corriendo" });
    }
});

app.get('/api/scrape/status', (req, res) => {
    res.json({ isRunning: activeScraperProcess !== null });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://127.0.0.1:${PORT}`);
});
