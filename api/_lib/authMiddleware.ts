import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Inicializa um cliente Supabase específico para validação de tokens
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Valida o token JWT contido no cabeçalho Authorization e retorna o ID do usuário autenticado.
 * Lança um erro se o token for inválido, ausente ou expirado.
 */
export async function validateToken(authHeader: string | undefined): Promise<string> {
  console.log('[Auth] Validating token...');
  if (!authHeader) {
    console.error('[Auth] Authorization header is missing');
    throw new Error('Acesso negado: Cabeçalho de autorização inválido ou ausente.');
  }
  if (!authHeader.startsWith('Bearer ')) {
    console.error('[Auth] Authorization header does not start with Bearer. Value:', authHeader);
    throw new Error('Acesso negado: Cabeçalho de autorização inválido ou ausente.');
  }

  const token = authHeader.substring(7);
  console.log('[Auth] Token length:', token.length);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('[Auth] Supabase auth.getUser returned error:', error);
      throw new Error('Sessão inválida ou expirada.');
    }

    if (!user) {
      console.error('[Auth] Supabase auth.getUser returned no user object');
      throw new Error('Sessão inválida ou expirada.');
    }

    console.log('[Auth] Token successfully validated. User ID:', user.id);
    return user.id;
  } catch (err: any) {
    console.error('[Auth] Exception caught during token validation:', err.message || err);
    throw err;
  }
}
