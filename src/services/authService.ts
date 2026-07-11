// ============================================================
// TF Arrecada+ | Auth Service
// Autenticação própria de clientes e administradores do TF Hub
// ============================================================

import { supabase } from '../lib/supabase';
import { logService } from './logService';
import type { Client, ClientProfile, ClientSettings, TFHubAdmin, AuthSession } from '../types';

const CLIENT_SESSION_KEY = 'tf_arrecada_client_session';
const ADMIN_SESSION_KEY = 'tf_arrecada_admin_session';

export const authService = {
  /**
   * Realiza login do cliente usando username e senha.
   * Valida status e licença no banco de dados.
   */
  async signInClient(username: string, password: string): Promise<{
    success: boolean;
    error?: string;
    client?: Client;
    profile?: ClientProfile;
    settings?: ClientSettings;
    session?: AuthSession;
  }> {
    try {
      const { data, error } = await supabase.rpc('authenticate_client', {
        p_username: username,
        p_password: password,
      });

      if (error) {
        console.error('Erro na RPC de autenticação:', error);
        return { success: false, error: 'database_error' };
      }

      const res = data as any;
      if (!res.success) {
        return { success: false, error: res.error };
      }

      // Criar a sessão
      const session: AuthSession = {
        token: res.client.id,
        isAdmin: false,
        username: res.client.username,
        name: res.profile?.nome || res.client.username,
        expiresAt: new Date(res.client.expires_at).getTime(),
      };

      // Salvar no localStorage (cache rápido)
      localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify({
        session,
        client: res.client,
        profile: res.profile,
        settings: res.settings
      }));

      // Gravar log de atividade
      await logService.logActivity('login', 'client', res.client.id, { username }, res.client.id);

      return {
        success: true,
        client: res.client,
        profile: res.profile,
        settings: res.settings,
        session,
      };
    } catch (err) {
      console.error('Erro no signInClient:', err);
      return { success: false, error: 'system_error' };
    }
  },

  /**
   * Realiza login do admin TF Hub.
   */
  async signInAdmin(username: string, password: string): Promise<{
    success: boolean;
    error?: string;
    admin?: TFHubAdmin;
    session?: AuthSession;
  }> {
    try {
      const { data, error } = await supabase.rpc('authenticate_tfhub_admin', {
        p_username: username,
        p_password: password,
      });

      if (error) {
        console.error('Erro na RPC de autenticação admin:', error);
        return { success: false, error: 'database_error' };
      }

      const res = data as any;
      if (!res.success) {
        return { success: false, error: res.error };
      }

      const session: AuthSession = {
        token: res.admin.id,
        isAdmin: true,
        username: res.admin.username,
        name: res.admin.name,
        expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 horas de sessão admin
      };

      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
        session,
        admin: res.admin
      }));

      // Registrar log de atividade
      await logService.logActivity('login', 'tfhub_admin', res.admin.id, { username }, undefined, res.admin.id);

      return {
        success: true,
        admin: res.admin,
        session,
      };
    } catch (err) {
      console.error('Erro no signInAdmin:', err);
      return { success: false, error: 'system_error' };
    }
  },

  /**
   * Desloga o cliente.
   */
  async signOutClient(clientId: string): Promise<void> {
    const sessionData = localStorage.getItem(CLIENT_SESSION_KEY);
    if (sessionData) {
      try {
        await logService.logActivity('logout', 'client', clientId, {}, clientId);
      } catch (e) {}
    }
    localStorage.removeItem(CLIENT_SESSION_KEY);
  },

  /**
   * Desloga o admin TF Hub.
   */
  async signOutAdmin(adminId: string): Promise<void> {
    const sessionData = localStorage.getItem(ADMIN_SESSION_KEY);
    if (sessionData) {
      try {
        await logService.logActivity('logout', 'tfhub_admin', adminId, {}, undefined, adminId);
      } catch (e) {}
    }
    localStorage.removeItem(ADMIN_SESSION_KEY);
  },

  /**
   * Recupera a sessão ativa do cliente.
   */
  getClientSession(): {
    session: AuthSession;
    client: Client;
    profile: ClientProfile;
    settings: ClientSettings;
  } | null {
    const data = localStorage.getItem(CLIENT_SESSION_KEY);
    if (!data) return null;
    try {
      const parsed = JSON.parse(data);
      if (parsed.session.expiresAt < Date.now()) {
        localStorage.removeItem(CLIENT_SESSION_KEY);
        return null;
      }
      return parsed;
    } catch (e) {
      return null;
    }
  },

  /**
   * Recupera a sessão ativa do admin TF Hub.
   */
  getAdminSession(): {
    session: AuthSession;
    admin: TFHubAdmin;
  } | null {
    const data = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!data) return null;
    try {
      const parsed = JSON.parse(data);
      if (parsed.session.expiresAt < Date.now()) {
        localStorage.removeItem(ADMIN_SESSION_KEY);
        return null;
      }
      return parsed;
    } catch (e) {
      return null;
    }
  },

  /**
   * Valida a licença do cliente diretamente no banco de dados.
   * Evita fraudes de alteração de horário local.
   */
  async validateLicenseServerSide(clientId: string): Promise<{
    isValid: boolean;
    status: 'active' | 'expired' | 'blocked';
    expiresAt: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('status, license_status, expires_at')
        .eq('id', clientId)
        .single();

      if (error || !data) {
        return { isValid: false, status: 'blocked', expiresAt: '' };
      }

      const isExpired = new Date(data.expires_at).getTime() < Date.now();
      const isBlocked = data.status === 'blocked' || data.license_status === 'blocked';

      if (isExpired && data.license_status !== 'expired') {
        // Atualiza no banco
        await supabase
          .from('clients')
          .update({ license_status: 'expired' })
          .eq('id', clientId);
      }

      return {
        isValid: !isExpired && !isBlocked,
        status: isBlocked ? 'blocked' : (isExpired ? 'expired' : 'active'),
        expiresAt: data.expires_at,
      };
    } catch (err) {
      console.error('Erro ao validar licença server-side:', err);
      return { isValid: false, status: 'blocked', expiresAt: '' };
    }
  }
};
