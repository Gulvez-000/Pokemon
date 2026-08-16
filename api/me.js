import { parseCookies, verify } from '../lib/auth.js';

export default async function handler(req, res) {
  const cookies = parseCookies(req);
  const name = verify(cookies.session);
  if (name) return res.status(200).json({ authed: true, name });
  res.status(200).json({ authed: false });
}
