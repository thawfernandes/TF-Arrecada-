// ============================================================
// TF Arrecada+ | Crypto Utility
// Utiliza funções RPC do Supabase para hash seguro de senhas no PostgreSQL
// ============================================================

import { supabase } from '../lib/supabase';

/**
 * Solicita ao banco de dados o hash bcrypt de uma senha.
 */
export async function hashPassword(password: string): Promise<string> {
  const { data, error } = await supabase.rpc('hash_password', {
    p_password: password,
  });

  if (error) {
    console.error('Erro ao gerar hash da senha:', error);
    throw new Error('Falha ao processar senha de forma segura.');
  }

  return data as string;
}

/**
 * Solicita ao banco de dados a verificação de uma senha com base no hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('verify_password', {
    p_password: password,
    p_hash: hash,
  });

  if (error) {
    console.error('Erro ao verificar senha:', error);
    return false;
  }

  return data as boolean;
}
