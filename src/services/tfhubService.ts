// ============================================================
// TF Arrecada+ | TF Hub Service
// Operações do painel de administração global da TF Hub (SaaS)
// ============================================================

import { supabase } from '../lib/supabase';
import { logService } from './logService';
import type { Client, ClientProfile, Campaign } from '../types';

export const tfhubService = {
  /**
   * Retorna a listagem de todos os clientes cadastrados.
   */
  async getAllClients(): Promise<(Client & { profiles?: ClientProfile })[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*, client_profiles(*)');

    if (error) {
      console.error('Erro ao listar todos os clientes:', error);
      return [];
    }

    return (data || []).map((client: any) => ({
      ...client,
      profiles: client.client_profiles?.[0] || undefined,
    }));
  },

  /**
   * Cria um novo cliente utilizando a RPC segura (com pgcrypto hash).
   */
  async createClient(
    username: string,
    password_hash: string, // Na verdade enviamos a senha limpa para a RPC criptografar
    nome: string,
    empresa: string,
    telefone: string,
    days = 30
  ): Promise<{ success: boolean; error?: string; clientId?: string }> {
    const { data, error } = await supabase.rpc('create_client_with_credentials', {
      p_username: username,
      p_password: password_hash,
      p_nome: nome,
      p_empresa: empresa,
      p_telefone: telefone,
      p_days: days,
    });

    if (error) {
      console.error('Erro ao chamar RPC create_client_with_credentials:', error);
      return { success: false, error: 'database_error' };
    }

    const res = data as any;
    if (!res.success) {
      return { success: false, error: res.error };
    }

    await logService.logActivity(
      'campaign_create',
      'clients',
      res.client_id,
      { username, nome, empresa },
      undefined, // Admin ID pode ser passado no contexto real
    );

    return { success: true, clientId: res.client_id };
  },

  /**
   * Bloqueia ou desbloqueia um cliente do sistema.
   */
  async updateClientStatus(clientId: string, status: 'active' | 'blocked'): Promise<boolean> {
    const { error } = await supabase
      .from('clients')
      .update({ status })
      .eq('id', clientId);

    if (error) {
      console.error('Erro ao alterar status do cliente:', error);
      return false;
    }

    await logService.logActivity(
      status === 'blocked' ? 'campaign_delete' : 'campaign_edit',
      'clients',
      clientId,
      { status }
    );
    return true;
  },

  /**
   * Renova a licença do cliente por uma quantidade de dias (chama RPC).
   */
  async renewLicense(clientId: string, days = 30): Promise<{ success: boolean; expiresAt?: string }> {
    const { data, error } = await supabase.rpc('renew_license', {
      p_client_id: clientId,
      p_days: days,
    });

    if (error) {
      console.error('Erro ao renovar licença do cliente:', error);
      return { success: false };
    }

    const res = data as any;
    if (!res.success) return { success: false };

    await logService.logActivity(
      'license_renew',
      'clients',
      clientId,
      { days, newExpiry: res.expires_at }
    );

    return { success: true, expiresAt: res.expires_at };
  },

  /**
   * Remove permanentemente um cliente e todos os seus dados.
   */
  async deleteClient(clientId: string): Promise<boolean> {
    const { error } = await supabase.from('clients').delete().eq('id', clientId);
    if (error) {
      console.error('Erro ao deletar cliente:', error);
      return false;
    }

    await logService.logActivity('campaign_delete', 'clients', clientId, {});
    return true;
  },

  /**
   * Retorna a listagem de todas as campanhas de todos os clientes.
   */
  async getAllCampaigns(): Promise<(Campaign & { clients?: { username: string } })[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*, clients(username)');

    if (error) {
      console.error('Erro ao listar todas as campanhas:', error);
      return [];
    }

    return data as any[];
  },

  /**
   * Coleta métricas completas para o Dashboard do TF Hub.
   */
  async getDashboardStats() {
    try {
      const [clientsRes, campaignsRes, numbersRes] = await Promise.all([
        supabase.from('clients').select('*, client_profiles(*)'),
        supabase.from('campaigns').select('*, clients(username)'),
        supabase.from('campaign_numbers').select('status, campaign_id, campaigns(price_per_number)'),
      ]);

      const clients = clientsRes.data || [];
      const campaigns = campaignsRes.data || [];
      const numbers = numbersRes.data || [];

      // Clientes ativos vs bloqueados
      const clientsActive = clients.filter((c) => c.status === 'active').length;
      const clientsBlocked = clients.filter((c) => c.status === 'blocked').length;

      // Licenças vencendo em até 7 dias
      const nowMs = Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const licensesExpiring = clients.filter((c) => {
        const expiresMs = new Date(c.expires_at).getTime();
        return c.status === 'active' && expiresMs > nowMs && (expiresMs - nowMs) <= sevenDaysMs;
      }).length;

      // Status das campanhas
      const campaignsActive = campaigns.filter((c) => c.status === 'active').length;
      const campaignsFinished = campaigns.filter((c) => c.status === 'finished').length;
      const totalCampaigns = campaigns.length;

      // Números vendidos e movimentação financeira
      const totalNumbersSold = numbers.filter((n) => n.status === 'paid').length;
      
      let totalValueMoved = 0;
      numbers.forEach((n) => {
        if (n.status === 'paid' && n.campaigns) {
          const camp = Array.isArray(n.campaigns) ? n.campaigns[0] : n.campaigns;
          totalValueMoved += Number((camp as any)?.price_per_number || 0);
        }
      });

      // Ordena e pega os últimos
      const lastClients = [...clients]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map((c: any) => ({
          id: c.id,
          username: c.username,
          company: c.client_profiles?.[0]?.empresa || 'N/A',
          created_at: c.created_at,
          status: c.status,
        }));

      const lastCampaigns = [...campaigns]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      return {
        clientsActive,
        clientsBlocked,
        licensesExpiring,
        campaignsActive,
        campaignsFinished,
        totalCampaigns,
        totalNumbersSold,
        totalValueMoved,
        lastClients,
        lastCampaigns,
      };
    } catch (err) {
      console.error('Erro ao gerar estatísticas do TF Hub:', err);
      return {
        clientsActive: 0,
        clientsBlocked: 0,
        licensesExpiring: 0,
        campaignsActive: 0,
        campaignsFinished: 0,
        totalCampaigns: 0,
        totalNumbersSold: 0,
        totalValueMoved: 0,
        lastClients: [],
        lastCampaigns: [],
      };
    }
  },
};
