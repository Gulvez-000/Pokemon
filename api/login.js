import { sign } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo no permitido' });
  const { name, password } = req.body || {};
  if (password !== process.env.SITE_PASSWORD) {
    return res.status(401).json({ error: 'Clave incorrecta' });
  }
  const cleanName = (name || '').trim();
  if (!cleanName) return res.status(400).json({ error: 'Falta el nombre' });

  const token = sign(cleanName);
  res.setHeader(
    'Set-Cookie',
    `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${process.env.VERCEL ? '; Secure' : ''}`
  );
  res.status(200).json({ ok: true, name: cleanName });
}
