// Calibration Worker (EGC-10) — start / submit / result (architecture §2).
//
// El submit puntúa SERVER-SIDE con la clave de respuestas (espejo de
// `src/lib/calibration-scoring.ts`; el backend no puede importar de src/, así que la clave se
// inlinea aquí — ver decisión en el execution record). El resultado fija el learning path del
// usuario y marca la calibración como completada.
import { D1Helper } from '../../_db';
import { json, error, uuid, type Env, type PagesContext } from '../../_shared';

const ANTI_TAP_MIN_AVG_MS = 4000;
const INTERMEDIATE_THRESHOLD = 4;

// Clave verbatim del banco (calibration-test-design §2 / src/lib/calibration-questions.ts).
const ANSWER_KEY: Record<string, { correct: string; topic: string }> = {
  q1: { correct: 'B', topic: 'zones' },
  q2: { correct: 'A', topic: 'app-id' },
  q3: { correct: 'C', topic: 'policy-order' },
  q4: { correct: 'B', topic: 'nat-type' },
  q5: { correct: 'B', topic: 'zones' },
  q6: { correct: 'D', topic: 'security-profiles' },
};
const TOPICS = ['zones', 'app-id', 'nat-type', 'policy-order', 'security-profiles'];

interface SubmittedAnswer {
  questionId: string;
  selectedOptionId: string;
  timeSpentMs: number;
}

function lastSegment(url: string): string {
  const segments = new URL(url).pathname.split('/').filter(Boolean);
  return segments[segments.length - 1] ?? '';
}

function scoreAnswers(answers: SubmittedAnswer[]) {
  const tally: Record<string, { correct: number; count: number }> = {};
  for (const t of TOPICS) tally[t] = { correct: 0, count: 0 };

  let correct = 0;
  let timeSum = 0;
  for (const [id, key] of Object.entries(ANSWER_KEY)) {
    const answer = answers.find((a) => a.questionId === id);
    const ok = answer?.selectedOptionId === key.correct;
    tally[key.topic].count += 1;
    if (ok) {
      correct += 1;
      tally[key.topic].correct += 1;
    }
    timeSum += answer?.timeSpentMs ?? 0;
  }

  const total = Object.keys(ANSWER_KEY).length;
  const avgTimeMs = total > 0 ? Math.round(timeSum / total) : 0;
  const forcedBeginner = avgTimeMs < ANTI_TAP_MIN_AVG_MS;
  const learningPath = !forcedBeginner && correct >= INTERMEDIATE_THRESHOLD ? 'intermediate' : 'beginner';
  const topicScores: Record<string, number> = {};
  for (const t of TOPICS) topicScores[t] = tally[t].count > 0 ? tally[t].correct / tally[t].count : 0;

  return {
    score: correct,
    total,
    avgTimeMs,
    forcedBeginner,
    learningPath,
    recommendedStartLevel: learningPath === 'intermediate' ? 11 : 1,
    topicScores,
    durationMs: timeSum,
  };
}

function start(request: Request): Response {
  // El cliente renderiza desde su banco local (offline-first); el servidor sólo abre sesión.
  return json(
    {
      sessionId: uuid(),
      questions: [],
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    },
    request,
    200
  );
}

async function submit(request: Request, db: D1Helper, userId: string): Promise<Response> {
  let answers: SubmittedAnswer[] = [];
  try {
    const body = (await request.json()) as { answers?: SubmittedAnswer[] };
    answers = Array.isArray(body?.answers) ? body.answers : [];
  } catch {
    return error(request, 422, 'Cuerpo inválido', 'VALIDATION');
  }
  if (answers.length < Object.keys(ANSWER_KEY).length) {
    return error(request, 422, 'Respuestas incompletas', 'VALIDATION');
  }

  const result = scoreAnswers(answers);
  const completedAt = new Date().toISOString();
  await db.upsertCalibrationResult({
    userId,
    completedAt,
    learningPath: result.learningPath,
    topicScores: JSON.stringify(result.topicScores),
    recommendedStartLevel: result.recommendedStartLevel,
    durationMs: result.durationMs,
  });
  await db.setLearningPath(userId, result.learningPath);

  return json(
    {
      userId,
      completedAt,
      learningPath: result.learningPath,
      topicScores: result.topicScores,
      recommendedStartLevel: result.recommendedStartLevel,
      durationMs: result.durationMs,
    },
    request,
    200
  );
}

async function result(request: Request, db: D1Helper, userId: string): Promise<Response> {
  const row = await db.getCalibrationResult(userId);
  if (!row) return json({ done: false }, request, 200);
  return json(
    {
      userId: row.userId,
      completedAt: row.completedAt,
      learningPath: row.learningPath,
      topicScores: JSON.parse(row.topicScores),
      recommendedStartLevel: row.recommendedStartLevel,
      durationMs: row.durationMs,
    },
    request,
    200
  );
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const userId = typeof context.data.userId === 'string' ? context.data.userId : '';
  if (!userId) return error(request, 401, 'No autenticado', 'UNAUTHENTICATED');

  const db = new D1Helper((env as Env).DB);
  const action = lastSegment(request.url);

  if (request.method === 'POST' && action === 'start') return start(request);
  if (request.method === 'POST' && action === 'submit') return submit(request, db, userId);
  if (request.method === 'GET' && action === 'result') return result(request, db, userId);
  return error(request, 405, 'Método no permitido', 'METHOD_NOT_ALLOWED');
}
