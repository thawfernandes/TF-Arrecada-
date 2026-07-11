// ============================================================
// TF Arrecada+ | Auth Context
// Provedor global de estado de autenticação e licenças (SaaS)
// ============================================================

import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import type { Client, ClientProfile, ClientSettings, TFHubAdmin, AuthSession } from '../types';

interface AuthContextType {
  client: Client | null;
  profile: ClientProfile | null;
  settings: ClientSettings | null;
  admin: TFHubAdmin | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  licenseStatus: 'active' | 'expired' | 'blocked' | null;
  isLoading: boolean;
  loginClient: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAdmin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<Client | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [settings, setSettings] = useState<ClientSettings | null>(null);
  const [admin, setAdmin] = useState<TFHubAdmin | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!session;
  const isAdmin = !!admin;
  const licenseStatus = client?.license_status || null;

  // Restaurar sessão inicial do localStorage
  useEffect(() => {
    async function initAuth() {
      try {
        const clientSession = authService.getClientSession();
        if (clientSession) {
          // Validação server-side em background para evitar falsificação
          const check = await authService.validateLicenseServerSide(clientSession.client.id);
          if (check.isValid) {
            setSession(clientSession.session);
            setClient({ ...clientSession.client, license_status: check.status, expires_at: check.expiresAt });
            setProfile(clientSession.profile);
            setSettings(clientSession.settings);
          } else {
            // Licença expirada/bloqueada, atualizar status localmente
            setSession(clientSession.session);
            setClient({ ...clientSession.client, license_status: check.status, expires_at: check.expiresAt });
            setProfile(clientSession.profile);
            setSettings(clientSession.settings);
          }
        } else {
          const adminSession = authService.getAdminSession();
          if (adminSession) {
            setSession(adminSession.session);
            setAdmin(adminSession.admin);
          }
        }
      } catch (err) {
        console.error('Falha ao inicializar autenticação:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  /**
   * Realiza login como cliente.
   */
  const loginClient = async (username: string, password: string) => {
    setIsLoading(true);
    const res = await authService.signInClient(username, password);
    setIsLoading(false);

    if (res.success && res.session) {
      setSession(res.session);
      setClient(res.client || null);
      setProfile(res.profile || null);
      setSettings(res.settings || null);
      setAdmin(null);
      return { success: true };
    }

    return { success: false, error: res.error };
  };

  /**
   * Realiza login como administrador do TF Hub.
   */
  const loginAdmin = async (username: string, password: string) => {
    setIsLoading(true);
    const res = await authService.signInAdmin(username, password);
    setIsLoading(false);

    if (res.success && res.session) {
      setSession(res.session);
      setAdmin(res.admin || null);
      setClient(null);
      setProfile(null);
      setSettings(null);
      return { success: true };
    }

    return { success: false, error: res.error };
  };

  /**
   * Desloga a sessão atual.
   */
  const logout = async () => {
    setIsLoading(true);
    if (admin) {
      await authService.signOutAdmin(admin.id);
    } else if (client) {
      await authService.signOutClient(client.id);
    }
    setSession(null);
    setClient(null);
    setProfile(null);
    setSettings(null);
    setAdmin(null);
    setIsLoading(false);
  };

  /**
   * Recarrega os dados do cliente e da sessão.
   */
  const refreshSession = async () => {
    if (!client) return;
    const check = await authService.validateLicenseServerSide(client.id);
    setClient((prev) => prev ? { ...prev, license_status: check.status, expires_at: check.expiresAt } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        client,
        profile,
        settings,
        admin,
        session,
        isAuthenticated,
        isAdmin,
        licenseStatus,
        isLoading,
        loginClient,
        loginAdmin,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
