export async function callClaude(prompt, useWebSearch) {
  const body = {
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  };
  if (useWebSearch) {
    body.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
  }
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });
  const data = await resp.json();
  if (data.error) throw new Error(data.error.message || 'Error de la API');
  return (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}

export function extractJson(text) {
  const clean = text.replace(/```json|```/g, '').trim();
  const first = clean.indexOf('{');
  const last = clean.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('Respuesta sin JSON');
  return JSON.parse(clean.slice(first, last + 1));
}
