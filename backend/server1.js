
import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const SUPABASE_URL = process.env.SUPABASE_URL;

app.get('/api/moments', async (req,res)=>{
  const { rows } = await pool.query('SELECT * FROM v_public_moments_with_media ORDER BY z ASC');
  const data = rows.map(m => ({
    ...m,
    media: (m.media || []).map(md => ({
      type: md.type,
      url: `${SUPABASE_URL}/storage/v1/object/public/${md.bucket}/${md.path}`,
      width: md.width,
      height: md.height,
      duration: md.duration
    }))
  }));
  res.json(data);
});

app.listen(3000,()=>console.log('✅ Timeline API running on :3000'));
