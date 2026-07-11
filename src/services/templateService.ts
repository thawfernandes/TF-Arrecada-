// ============================================================
// TF Arrecada+ | Template Service
// Gerenciamento de templates de mensagens (WhatsApp, PIX, etc.)
// ============================================================

import { supabase } from '../lib/supabase';
import { logService } from './logService';
import type { MessageTemplate } from '../types';

export const templateService = {
  /**
   * Busca todos os templates de um cliente.
   */
  async getTemplates(clientId: string): Promise<MessageTemplate[]> {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('client_id', clientId)
      .order('type');

    if (error) {
      console.error('Erro ao buscar templates do cliente:', error);
      return [];
    }

    return data as MessageTemplate[];
  },

  /**
   * Atualiza o conteúdo de um template de mensagem.
   */
  async updateTemplate(clientId: string, templateId: string, content: string): Promise<boolean> {
    const { data: updated, error } = await supabase
      .from('message_templates')
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)
      .eq('client_id', clientId)
      .select()
      .single();

    if (error || !updated) {
      console.error('Erro ao atualizar template de mensagem:', error);
      return false;
    }

    await logService.logActivity('campaign_edit', 'message_templates', templateId, { type: updated.type }, clientId);
    return true;
  },

  /**
   * Formata dinamicamente uma mensagem substituindo tags.
   */
  formatMessage(
    templateContent: string,
    variables: {
      number?: string | number;
      value?: string | number;
      pix_key?: string;
      timeout?: string | number;
      campaign_name?: string;
      buyer_name?: string;
    }
  ): string {
    let formatted = templateContent;
    if (variables.number !== undefined) formatted = formatted.replace(/{number}/g, String(variables.number));
    if (variables.value !== undefined) formatted = formatted.replace(/{value}/g, String(variables.value));
    if (variables.pix_key !== undefined) formatted = formatted.replace(/{pix_key}/g, String(variables.pix_key));
    if (variables.timeout !== undefined) formatted = formatted.replace(/{timeout}/g, String(variables.timeout));
    if (variables.campaign_name !== undefined) formatted = formatted.replace(/{campaign_name}/g, String(variables.campaign_name));
    if (variables.buyer_name !== undefined) formatted = formatted.replace(/{buyer_name}/g, String(variables.buyer_name));
    return formatted;
  },
};
