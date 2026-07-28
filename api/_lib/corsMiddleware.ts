import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Configura os cabeçalhos de CORS e responde antecipadamente a requisições do tipo OPTIONS.
 * Retorna true se a requisição foi finalizada (OPTIONS), caso contrário retorna false.
 */
export function handleCors(req: IncomingMessage, res: ServerResponse): boolean {
  const origin = req.headers.origin || '';
  console.log(`[CORS] Request Origin: "${origin}"`);
  
  // Obter origens permitidas da variável de ambiente
  let allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : [];

  // Fallback para desenvolvimento local caso ALLOWED_ORIGINS não esteja no .env
  if (process.env.NODE_ENV !== 'production' || !process.env.ALLOWED_ORIGINS) {
    const localDevOrigins = [
      'http://localhost:5173', 'http://127.0.0.1:5173',
      'http://localhost:3000', 'http://127.0.0.1:3000'
    ];
    allowedOrigins = [...allowedOrigins, ...localDevOrigins];
  }
  console.log('[CORS] Allowed Origins List:', allowedOrigins);

  const isAllowed = origin && allowedOrigins.includes(origin);
  console.log(`[CORS] Origin is ${isAllowed ? 'ALLOWED' : 'BLOCKED'}`);

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return true;
  }
  
  return false;
}
