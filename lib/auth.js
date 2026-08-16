import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'cambia-esto';

export function sign(name) {
  const h = crypto.createHmac('sha256', SECRET).update(name).digest('hex');
  return Buffer.from(name, 'utf8').toString('base64') + '.' + h;
}

export function verify(token) {
  if (!token) return null;
  const dotIdx = token.lastIndexOf('.');
  if (dotIdx === -1) return null;
  const b64 = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  const name = Buffer.from(b64, 'base64').toString('utf8');
  const expected = crypto.createHmac('sha256', SECRET).update(name).digest('hex');
  if (sig !== expected) return null;
  return name;
}

export function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1));
  });
  return out;
}

export function requireAuth(req, res) {
  const cookies = parseCookies(req);
  const name = verify(cookies.session);
  if (!name) {
    res.status(401).json({ error: 'No autorizado' });
    return null;
  }
  return name;
}
