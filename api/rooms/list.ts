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
  console.log('[API/Rooms/List] Handler started. Method:', req.method);
  
  if (handleCors(req, res)) {
    console.log('[API/Rooms/List] Cors handled preflight or blocked request');
    return;
  }
  if (handleRateLimit(req, res)) {
    console.warn('[API/Rooms/List] Rate limit blocked request');
    return;
  }

  if (req.method !== 'GET') {
    console.warn('[API/Rooms/List] Method not allowed:', req.method);
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    console.log('[API/Rooms/List] Extracting and validating token...');
    const userId = await validateToken(req.headers.authorization);
    console.log('[API/Rooms/List] Token is valid. User ID:', userId);

    // Buscar salas onde o usuário é membro e que não expiraram
    console.log('[API/Rooms/List] Querying Prisma for room members...');
    const members = await prisma.roomMember.findMany({
      where: {
        userId,
        room: {
          expiresAt: { gt: new Date() }
        }
      },
      include: {
        room: true
      }
    });
    console.log(`[API/Rooms/List] Prisma query completed. Found ${members.length} rooms.`);

    const rooms = members.map((m: any) => ({
      id: m.room.id,
      code: m.room.code,
      name: m.room.name,
      ownerId: m.room.ownerId,
      maxGuests: m.room.maxGuests,
      activeQuizId: m.room.activeQuizId,
      createdAt: m.room.createdAt,
      expiresAt: m.room.expiresAt
    }));

    console.log('[API/Rooms/List] Responding with rooms list. Length:', rooms.length);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(rooms));
  } catch (err: any) {
    console.error('[API/Rooms/List] Critical error occurred:', err.message || err, err);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message || 'Erro ao carregar salas do usuário.' }));
  }
}
