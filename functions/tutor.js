// Cloudflare Pages Function — Adaptive Policy Tutor (concepto disruptivo 5.1).
//
// Endpoint POST /tutor que recibe { levelId, config, solution, reasonCode } y
// devuelve { explanation } en español: una explicación pedagógica del error del
// jugador citando el comportamiento de PAN-OS 11.x.
//
// Despliegue (separado del SPA estático):
//   1. npm create cloudflare@latest  (o Pages Functions en un repo aparte)
//   2. npm i @anthropic-ai/sdk
//   3. Configurar el secret:  wrangler secret put ANTHROPIC_API_KEY
//   4. En el frontend, definir VITE_TUTOR_URL apuntando a esta función.
//
// El juego funciona SIN este worker: PolicyTutor cae al modo offline si
// VITE_TUTOR_URL no está configurada o el worker falla.

import Anthropic from '@anthropic-ai/sdk';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SYSTEM = `Eres un instructor experto en Palo Alto Networks NGFW (PCNSE), PAN-OS 11.x.
Un estudiante configuró una política de firewall incorrecta en un simulador educativo.
Recibirás la configuración que envió, la solución correcta y un código de razón del fallo.
Explica en español claro, en 2-3 frases, POR QUÉ su configuración falla y QUÉ debe corregir,
citando el comportamiento real y documentado de PAN-OS 11.x. No uses códigos de error como
texto; explica el concepto. No saludes ni te despidas: ve directo a la explicación.`;

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { levelId, config, solution, reasonCode } = body ?? {};

    const userPrompt = `Nivel ${levelId}. Código de fallo: ${reasonCode}.
Configuración del estudiante: ${JSON.stringify(config)}
Solución correcta: ${JSON.stringify(solution)}
Explica el error y la corrección.`;

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-haiku-4-5', // baja latencia para un tutor interactivo
      max_tokens: 400,
      system: SYSTEM,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const explanation = message.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    return new Response(JSON.stringify({ explanation }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }
}

export function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
