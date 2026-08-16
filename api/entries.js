import { sql } from '@vercel/postgres';
import { requireAuth } from '../lib/auth.js';

function normalizeUrl(raw) {
  try {
    const u = new URL(raw.trim());
    u.hash = '';
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'igshid', 'ref', 'ref_src', 'si']
      .forEach((p) => u.searchParams.delete(p));
    let host = u.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtu.be') return 'youtube.com/watch?v=' + u.pathname.replace('/', '');
    const path = u.pathname.replace(/\/$/, '');
    const search = u.searchParams.toString();
    return host + path + (search ? '?' + search : '');
  } catch (e) {
    return raw.trim().toLowerCase().replace(/\/$/, '');
  }
}
function detectType(raw) {
  return /youtube\.com|youtu\.be/i.test(raw) ? 'video' : 'article';
}
function titleFromUrl(raw) {
  try { return new URL(raw.trim()).hostname.replace(/^www\./, ''); }
  catch (e) { return raw; }
}
function rowToEntry(r) {
  return {
    id: r.id, url: r.url, normalizedUrl: r.normalized_url, type: r.type,
    title: r.title, notes: r.notes, categories: r.categories || [],
    addedBy: r.added_by, addedAt: new Date(r.added_at).getTime(),
    analysis: r.analysis || null
  };
}

export default async function handler(req, res) {
  const name = requireAuth(req, res);
  if (!name) return;

  if (req.method === 'GET') {
    const { rows } = await sql`SELECT * FROM entries ORDER BY added_at DESC LIMIT 300`;
    return res.status(200).json({ entries: rows.map(rowToEntry) });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const action = body.action || 'create';

    if (action === 'create') {
      const rawUrl = (body.url || '').trim();
      const notes = (body.notes || '').trim();
      const cats = Array.isArray(body.categories) ? body.categories : [];
      if (!rawUrl) return res.status(400).json({ error: 'Falta el link' });
      const norm = normalizeUrl(rawUrl);

      const dup = await sql`SELECT added_by, added_at FROM entries WHERE normalized_url = ${norm} LIMIT 1`;
      if (dup.rows.length) {
        return res.status(409).json({
          error: 'duplicate', addedBy: dup.rows[0].added_by, addedAt: dup.rows[0].added_at
        });
      }

      const type = detectType(rawUrl);
      const title = titleFromUrl(rawUrl);
      const inserted = await sql`
        INSERT INTO entries (url, normalized_url, type, title, notes, categories, added_by)
        VALUES (${rawUrl}, ${norm}, ${type}, ${title}, ${notes}, ${JSON.stringify(cats)}, ${name})
        RETURNING id`;
      return res.status(200).json({ ok: true, id: inserted.rows[0].id });
    }

    if (action === 'update') {
      const id = parseInt(body.id, 10);
      if (!id) return res.status(400).json({ error: 'Falta id' });
      if (body.categories !== undefined) {
        await sql`UPDATE entries SET categories = ${JSON.stringify(body.categories)} WHERE id = ${id}`;
      }
      if (body.analysis !== undefined) {
        await sql`UPDATE entries SET analysis = ${JSON.stringify(body.analysis)} WHERE id = ${id}`;
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Accion desconocida' });
  }

  res.status(405).json({ error: 'Metodo no permitido' });
}
