import type { IncomingMessage, ServerResponse } from 'http';
import { handleCors } from '../_lib/corsMiddleware';
import { handleRateLimit } from '../_lib/rateLimitMiddleware';
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
  if (handleCors(req, res)) return;
  if (handleRateLimit(req, res)) return;

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // Parse body
  const { roomId, name } = req.body || {};
  if (!roomId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'ID da sala é obrigatório.' }));
    return;
  }

  try {
    // 1. Validar token
    const userId = await validateToken(req.headers.authorization);

    // 2. Verificar se a sala existe
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        expiresAt: { gt: new Date() }
      }
    });

    if (!room) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Sala não encontrada ou expirada.' }));
      return;
    }

    // 3. Apenas o dono pode atualizar o nome
    if (room.ownerId !== userId) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Apenas o dono da sala pode alterar o nome.' }));
      return;
    }

    // 4. Atualizar o nome da sala
    const updatedRoom = await prisma.room.update({
      where: {
        id: roomId
      },
      data: {
        name: name ? String(name).trim() : null
      }
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      id: updatedRoom.id,
      code: updatedRoom.code,
      name: updatedRoom.name,
      ownerId: updatedRoom.ownerId,
      maxGuests: updatedRoom.maxGuests,
      activeQuizId: updatedRoom.activeQuizId,
      createdAt: updatedRoom.createdAt,
      expiresAt: updatedRoom.expiresAt
    }));
  } catch (err: any) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message || 'Erro ao atualizar dados da sala.' }));
  }
}
