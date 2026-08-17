import { sql } from '@vercel/postgres';
import { requireAuth } from '../lib/auth.js';

async function getRole(name) {
  const { rows } = await sql`SELECT role FROM people WHERE name = ${name}`;
  return rows[0]?.role;
}

export default async function handler(req, res) {
  const me = requireAuth(req, res);
  if (!me) return;

  if (req.method === 'GET') {
    const { rows } = await sql`SELECT name, role FROM people ORDER BY name`;
    return res.status(200).json({ people: rows });
  }

  if (req.method === 'POST') {
    const { action, name } = req.body || {};
    const myRole = await getRole(me);
    if (myRole !== 'admin') return res.status(403).json({ error: 'Solo un admin puede hacer esto.' });
    if (!name) return res.status(400).json({ error: 'Falta el nombre' });
    if (name === me) return res.status(400).json({ error: 'No puedes modificarte a ti mismo.' });

    if (action === 'remove') {
      await sql`DELETE FROM people WHERE name = ${name}`;
      return res.status(200).json({ ok: true });
    }
    if (action === 'toggle-role') {
      const target = await sql`SELECT role FROM people WHERE name = ${name}`;
      if (!target.rows.length) return res.status(404).json({ error: 'No existe' });
      const newRole = target.rows[0].role === 'admin' ? 'member' : 'admin';
      await sql`UPDATE people SET role = ${newRole} WHERE name = ${name}`;
      return res.status(200).json({ ok: true, role: newRole });
    }
    return res.status(400).json({ error: 'Accion desconocida' });
  }

  res.status(405).json({ error: 'Metodo no permitido' });
}
