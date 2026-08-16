import { sql } from '@vercel/postgres';
import { requireAuth } from '../lib/auth.js';
import { callClaude, extractJson } from '../lib/claude.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo no permitido' });

  const id = parseInt(req.body?.id, 10);
  if (!id) return res.status(400).json({ error: 'Falta id' });

  const { rows } = await sql`SELECT * FROM entries WHERE id = ${id}`;
  const entry = rows[0];
  if (!entry) return res.status(404).json({ error: 'No existe' });

  const catRows = await sql`SELECT name FROM categories ORDER BY name`;
  const catNames = catRows.rows.map((r) => r.name);

  const prompt = `Analiza esta pieza periodistica o video para un archivo de investigacion compartido.
Link: ${entry.url}
Tipo: ${entry.type}
Notas del usuario: ${entry.notes || '(sin notas)'}

Categorias que ya existen en el archivo: ${catNames.join(', ')}

Busca informacion sobre esta pieza si es necesario. Luego responde UNICAMENTE con un objeto JSON, sin texto adicional, sin backticks, con esta forma exacta:
{"resumen":"una frase con el hecho central","mecanismos":["mecanismo retorico o de poder 1","mecanismo 2","mecanismo 3"],"framing":"una o dos frases sobre el angulo o encuadre dominante de la pieza, no el contenido literal","categorias":["categoria1","categoria2"]}

Para "categorias": elige 1 a 3 de la lista existente si realmente encajan. Solo propone una categoria nueva (en espanol, una o dos palabras) si el tema no encaja razonablemente en ninguna de las existentes. No inventes categorias de mas.
Los "mecanismos" son tacticas discursivas o estructurales (ej: apelacion al miedo, uso de fuentes anonimas, comparacion historica selectiva, dicotomia falsa, cifra descontextualizada), no un resumen de contenido.`;

  try {
    const text = await callClaude(prompt, true);
    const parsed = extractJson(text);
    const chosenCats = (parsed.categorias || []).map((c) => c.trim()).filter(Boolean);

    for (const c of chosenCats) {
      await sql`INSERT INTO categories (name) VALUES (${c}) ON CONFLICT DO NOTHING`;
    }

    const analysis = {
      resumen: parsed.resumen || '', mecanismos: parsed.mecanismos || [], framing: parsed.framing || ''
    };
    await sql`
      UPDATE entries SET analysis = ${JSON.stringify(analysis)}, categories = ${JSON.stringify(chosenCats)}
      WHERE id = ${id}`;

    res.status(200).json({ ok: true, analysis, categories: chosenCats });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
