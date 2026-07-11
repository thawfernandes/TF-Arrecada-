// ============================================================
// TF Arrecada+ | Log Service
// Gerenciamento de auditoria e logs de atividade do sistema
// ============================================================

import { supabase } from '../lib/supabase';
import type { LogAction } from '../types';

export const logService = {
  /**
   * Registra uma atividade no banco de dados.
   */
  async logActivity(
    action: LogAction,
    entityType?: string,
    entityId?: string,
    details?: Record<string, any>,
    clientId?: string,
    adminId?: string
  ): Promise<void> {
    try {
      // Usar RPC SECURITY DEFINER para bypassar RLS (anon key não tem acesso direto)
      const { error } = await supabase.rpc('log_activity_rpc', {
        p_action: action,
        p_entity_type: entityType || null,
        p_entity_id: entityId || null,
        p_details: details || {},
        p_client_id: clientId || null,
        p_admin_id: adminId || null,
        p_ip_address: 'client-side',
      });

      if (error) {
        // Log silencioso — não interrompe o fluxo principal
        console.warn('Log de atividade não registrado:', error.message);
      }
    } catch (err) {
      console.warn('Erro no logService.logActivity:', err);
    }
  },


  /**
   * Busca os logs de um cliente específico.
   */
  async getClientLogs(clientId: string, limit = 50) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar logs do cliente:', error);
      return [];
    }

    return data;
  },

  /**
   * Busca todos os logs do sistema (exclusivo para TF Hub admin).
   */
  async getAllLogs(limit = 100) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*, clients(username), tfhub_admins(name)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar todos os logs:', error);
      return [];
    }

    return data;
  },
};
