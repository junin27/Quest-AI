interface JwtHeader {
  alg: string;
  typ: string;
}

interface JwtPayload {
  userId: string;
  email: string;
  exp: number;
  iat: number;
}

const JWT_SECRET = 'quiz-app-local-hmac-sha256-secret-key-2026';

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return window.atob(base64);
}

async function signHmacSha256(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const secretKeyData = encoder.encode(secret);
  const dataToSign = encoder.encode(data);

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    secretKeyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    dataToSign
  );

  return arrayBufferToBase64Url(signature);
}

export async function generateAccessToken(userId: string, email: string): Promise<string> {
  const header: JwtHeader = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    userId,
    email,
    iat: now,
    exp: now + 15 * 60 // 15 minutes
  };

  const headerB64 = arrayBufferToBase64Url(new TextEncoder().encode(JSON.stringify(header)).buffer);
  const payloadB64 = arrayBufferToBase64Url(new TextEncoder().encode(JSON.stringify(payload)).buffer);
  const data = `${headerB64}.${payloadB64}`;
  const signatureB64 = await signHmacSha256(data, JWT_SECRET);

  return `${data}.${signatureB64}`;
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Token JWT inválido');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const data = `${headerB64}.${payloadB64}`;
  const expectedSignature = await signHmacSha256(data, JWT_SECRET);

  if (signatureB64 !== expectedSignature) {
    throw new Error('Assinatura do JWT inválida');
  }

  const payload: JwtPayload = JSON.parse(base64UrlDecode(payloadB64));
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp < now) {
    throw new Error('Token JWT expirado');
  }

  return payload;
}
