import { sql } from '@vercel/postgres';
import { sign } from '../lib/auth.js';
import { hashDni } from '../lib/crypto.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo no permitido' });
  const name = (req.body?.name || '').trim();
  const dni = (req.body?.dni || '').trim();
  if (!name || !dni) return res.status(400).json({ error: 'Faltan datos' });

  const { rows } = await sql`SELECT dni_hash, role FROM people WHERE name = ${name}`;
  if (!rows.length || rows[0].dni_hash !== hashDni(dni)) {
    return res.status(401).json({ error: 'DNI incorrecto' });
  }

  const token = sign(name);
  res.setHeader(
    'Set-Cookie',
    `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${process.env.VERCEL ? '; Secure' : ''}`
  );
  res.status(200).json({ ok: true, name, role: rows[0].role });
}
