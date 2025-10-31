import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'conversions.json');

const app = express();
app.use(express.json());

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({}, null, 2), 'utf-8');
  }
}

async function readStore() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}

async function writeStore(obj) {
  await fs.writeFile(DATA_FILE, JSON.stringify(obj, null, 2), 'utf-8');
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/conversions', async (_req, res) => {
  const store = await readStore();
  res.json(store);
});

app.post('/api/conversions', async (req, res) => {
  const { text, morse } = req.body || {};
  if (typeof text !== 'string' || typeof morse !== 'string') {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const trimmed = text.trim();
  const store = await readStore();
  store[trimmed] = morse;
  await writeStore(store);
  res.status(201).json({ saved: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Morse backend listening on http://localhost:${PORT}`);
});
