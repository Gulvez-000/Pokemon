import { sql } from '@vercel/postgres';
import { requireAuth } from '../lib/auth.js';
import { callClaude } from '../lib/claude.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo no permitido' });

  const category = (req.body?.category || '').trim();
  if (!category) return res.status(400).json({ error: 'Falta categoria' });

  const { rows } = await sql`SELECT * FROM entries WHERE analysis IS NOT NULL`;
  const relevant = rows.filter((r) => (r.categories || []).includes(category));
  if (!relevant.length) return res.status(400).json({ error: 'Sin fuentes analizadas en esa categoria' });

  let material = '';
  relevant.forEach((r, i) => {
    const a = r.analysis || {};
    material += `Fuente ${i + 1} (${r.added_by}, ${r.url}):\n`;
    material += `Resumen: ${a.resumen || ''}\n`;
    material += `Mecanismos: ${(a.mecanismos || []).join('; ')}\n`;
    material += `Framing: ${a.framing || ''}\n\n`;
  });

  const prompt = `Eres quien mantiene un documento vivo de seguimiento sobre el tema "${category}" para dos investigadores.
Con base en estas fuentes ya analizadas, escribe un documento interno breve en markdown (sin backticks) con esta estructura:
## Framings dominantes
(patrones de encuadre que se repiten entre las fuentes)
## Mecanismos recurrentes
(tacticas discursivas que aparecen en mas de una fuente, agrupadas)
## Contradicciones o tensiones
(donde las fuentes se contradicen o compiten en su encuadre)
## Vacios
(que angulos faltan cubrir todavia)

Se conciso, en espanol, sin relleno. Usa el material de abajo:

${material}`;

  try {
    const text = (await callClaude(prompt, false)).trim();
    await sql`
      INSERT INTO docs (category, doc_text, updated_at, sources)
      VALUES (${category}, ${text}, NOW(), ${relevant.length})
      ON CONFLICT (category) DO UPDATE SET doc_text = ${text}, updated_at = NOW(), sources = ${relevant.length}`;
    res.status(200).json({ ok: true, text, sources: relevant.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
