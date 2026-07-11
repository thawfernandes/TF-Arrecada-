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
      // Tentar obter IP se no client-side (opcional)
      let ipAddress = 'client-side';
      try {
        // Apenas um placeholder ou chamada rápida de ipify se necessário,
        // mas manter local e rápido para evitar chamadas lentas bloqueantes.
      } catch (e) {
        // Ignora falha de obter IP
      }

      const { error } = await supabase.from('activity_logs').insert({
        client_id: clientId || null,
        admin_id: adminId || null,
        action,
        entity_type: entityType || null,
        entity_id: entityId || null,
        details: details || {},
        ip_address: ipAddress,
      });

      if (error) {
        console.error('Falha ao gravar log de atividade:', error);
      }
    } catch (err) {
      console.error('Erro no logService.logActivity:', err);
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
