// ============================================================
// TF Arrecada+ | Notification Service
// Gerenciamento de alertas e notificações para clientes
// ============================================================

import { supabase } from '../lib/supabase';
import type { Notification, NotificationType } from '../types';

export const notificationService = {
  /**
   * Busca todas as notificações de um cliente.
   */
  async getNotifications(clientId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar notificações:', error);
      return [];
    }

    return data as Notification[];
  },

  /**
   * Cria uma nova notificação para um cliente.
   */
  async createNotification(
    clientId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata: Record<string, any> = {}
  ): Promise<boolean> {
    const { error } = await supabase.from('notifications').insert({
      client_id: clientId,
      type,
      title,
      message,
      metadata,
    });

    if (error) {
      console.error('Erro ao criar notificação:', error);
      return false;
    }

    return true;
  },

  /**
   * Marca uma notificação como lida.
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return false;
    }

    return true;
  },

  /**
   * Marca todas as notificações de um cliente como lidas.
   */
  async markAllAsRead(clientId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('client_id', clientId)
      .eq('is_read', false);

    if (error) {
      console.error('Erro ao marcar todas notificações como lidas:', error);
      return false;
    }

    return true;
  },
};
