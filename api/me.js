import { sql } from '@vercel/postgres';
import { parseCookies, verify } from '../lib/auth.js';

export default async function handler(req, res) {
  const cookies = parseCookies(req);
  const name = verify(cookies.session);
  if (!name) return res.status(200).json({ authed: false });

  const { rows } = await sql`SELECT role FROM people WHERE name = ${name}`;
  if (!rows.length) return res.status(200).json({ authed: false });

  res.status(200).json({ authed: true, name, role: rows[0].role });
}
