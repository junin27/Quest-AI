import type { IncomingMessage, ServerResponse } from 'http';
import { prisma } from '../_lib/prisma';
import { validateToken } from '../_lib/authMiddleware';

interface VercelRequest extends IncomingMessage {
  body: any;
  query: any;
  cookies: any;
}

interface VercelResponse extends ServerResponse {
  send: (body: any) => VercelResponse;
  json: (jsonBody: any) => VercelResponse;
  status: (statusCode: number) => VercelResponse;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  const origin = req.headers.origin || '';
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const {
    quizId,
    roomId,
    questionsTotal,
    questionsCorrect,
    percentageCorrect,
    totalScore,
    timeSpent,
    answers
  } = req.body || {};

  if (!quizId || questionsTotal === undefined || questionsCorrect === undefined || percentageCorrect === undefined || totalScore === undefined || timeSpent === undefined || !answers) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Parâmetros obrigatórios ausentes.' }));
    return;
  }

  try {
    const userId = await validateToken(req.headers.authorization);

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        roomId: roomId || null,
        questionsTotal: Number(questionsTotal),
        questionsCorrect: Number(questionsCorrect),
        percentageCorrect: Number(percentageCorrect),
        totalScore: Number(totalScore),
        timeSpent: Number(timeSpent),
        answers
      }
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(attempt));
  } catch (err: any) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message || 'Erro ao registrar tentativa.' }));
  }
}
