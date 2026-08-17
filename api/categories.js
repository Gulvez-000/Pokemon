import { sql } from '@vercel/postgres';
import { requireAuth } from '../lib/auth.js';

export default async function handler(req, res) {
  const me = requireAuth(req, res);
  if (!me) return;

  if (req.method === 'GET') {
    const { rows } = await sql`SELECT name FROM categories ORDER BY name`;
    return res.status(200).json({ categories: rows.map((r) => r.name) });
  }

  if (req.method === 'POST') {
    const name = (req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Falta el nombre' });
    await sql`INSERT INTO categories (name) VALUES (${name}) ON CONFLICT DO NOTHING`;
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const name = (req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Falta el nombre' });
    const { rows } = await sql`SELECT role FROM people WHERE name = ${me}`;
    if (rows[0]?.role !== 'admin') return res.status(403).json({ error: 'Solo un admin puede borrar temas.' });
    await sql`DELETE FROM categories WHERE name = ${name}`;
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Metodo no permitido' });
}
