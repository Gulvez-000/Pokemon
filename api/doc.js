import { sql } from '@vercel/postgres';
import { requireAuth } from '../lib/auth.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  const category = (req.query.category || '').trim();
  if (!category) return res.status(400).json({ error: 'Falta categoria' });

  const { rows } = await sql`SELECT * FROM docs WHERE category = ${category}`;
  if (!rows.length) return res.status(200).json({ exists: false });
  const d = rows[0];
  res.status(200).json({
    exists: true, text: d.doc_text, updatedAt: new Date(d.updated_at).getTime(), sources: d.sources
  });
}
