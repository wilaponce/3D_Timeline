
import 'dotenv/config'
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '../frontend');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(frontendDir));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const SUPABASE_URL = process.env.SUPABASE_URL;

console.log('[INFO] DATABASE_URL host:',
    process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]
    );

// Simple log helpers
const log = {
  info: (msg, meta) =>
    console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, meta || ''),
  warn: (msg, meta) =>
    console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, meta || ''),
  error: (msg, meta) =>
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, meta || '')
};

// Request logger
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    log.info(`${req.method} ${req.originalUrl} ${res.statusCode}`, {
      durationMs: Date.now() - start
    });
  });

  next();
});

app.get('/api/moments', async (req, res) => {
  try {
    log.info('Fetching moments');

    const { rows } = await pool.query(
      'SELECT * FROM v_public_moments_with_media ORDER BY z ASC'
    );

    const data = rows.map(m => ({
      ...m,
      media: (m.media || []).map(md => ({
        type: md.type,
        url: `${SUPABASE_URL}/storage/v1/object/public/${md.bucket}/${md.path}`
      }))
    }));

    if (data.length === 0) {
      log.warn('No moments returned');
    } else {
      log.info('Moments fetched', { count: data.length });
    }

    res.json(data);
  } catch (err) {
    log.error('Failed to fetch moments', {
      message: err.message,
      stack: err.stack
    });

    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// Database connection check
(async () => {
  try {
    await pool.query('select 1');
    log.info('Database connected');
  } catch (err) {
    log.error('Database connection failed', err);
  }
})();

app.listen(3000, () => {
  log.info('✅ API running on :3000');
});
