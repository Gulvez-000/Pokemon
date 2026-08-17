import { sql } from '@vercel/postgres';
import { sign } from '../lib/auth.js';
import { hashDni } from '../lib/crypto.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo no permitido' });
  const name = (req.body?.name || '').trim();
  const dni = (req.body?.dni || '').trim();
  if (!name || !dni) return res.status(400).json({ error: 'Completa nombre y DNI.' });

  const existing = await sql`SELECT name FROM people WHERE name = ${name}`;
  if (existing.rows.length) return res.status(409).json({ error: 'Ese nombre ya existe. Si eres tu, inicia sesion.' });

  const countRes = await sql`SELECT COUNT(*)::int AS c FROM people`;
  const role = countRes.rows[0].c === 0 ? 'admin' : 'member';

  await sql`INSERT INTO people (name, dni_hash, role) VALUES (${name}, ${hashDni(dni)}, ${role})`;

  const token = sign(name);
  res.setHeader(
    'Set-Cookie',
    `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${process.env.VERCEL ? '; Secure' : ''}`
  );
  res.status(200).json({ ok: true, name, role });
}
