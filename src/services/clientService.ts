// ============================================================
// TF Arrecada+ | Client Service
// Gerenciamento de perfil, configurações e onboarding do cliente
// ============================================================

import { supabase } from '../lib/supabase';
import { logService } from './logService';
import type { ClientProfile, ClientSettings } from '../types';

export const clientService = {
  /**
   * Obtém o perfil de um cliente.
   */
  async getProfile(clientId: string): Promise<ClientProfile | null> {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (error) {
      console.error('Erro ao obter perfil do cliente:', error);
      return null;
    }

    return data as ClientProfile;
  },

  /**
   * Atualiza o perfil de um cliente.
   */
  async updateProfile(clientId: string, profile: Partial<ClientProfile>): Promise<boolean> {
    const { error } = await supabase
      .from('client_profiles')
      .update({
        ...profile,
        updated_at: new Date().toISOString(),
      })
      .eq('client_id', clientId);

    if (error) {
      console.error('Erro ao atualizar perfil do cliente:', error);
      return false;
    }

    await logService.logActivity('campaign_edit', 'client_profiles', clientId, { profile }, clientId);
    return true;
  },

  /**
   * Obtém as configurações (settings) de um cliente.
   */
  async getSettings(clientId: string): Promise<ClientSettings | null> {
    const { data, error } = await supabase
      .from('client_settings')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (error) {
      console.error('Erro ao obter configurações do cliente:', error);
      return null;
    }

    return data as ClientSettings;
  },

  /**
   * Atualiza as configurações (settings) de um cliente.
   */
  async updateSettings(clientId: string, settings: Partial<ClientSettings>): Promise<boolean> {
    const { error } = await supabase
      .from('client_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq('client_id', clientId);

    if (error) {
      console.error('Erro ao atualizar configurações do cliente:', error);
      return false;
    }

    // Se a chave PIX mudou, registrar log específico
    if (settings.pix_key) {
      await logService.logActivity('pix_change', 'client_settings', clientId, { pixKey: settings.pix_key }, clientId);
    } else {
      await logService.logActivity('campaign_edit', 'client_settings', clientId, { settings }, clientId);
    }
    
    return true;
  },

  /**
   * Completa o onboarding do cliente.
   */
  async completeOnboarding(clientId: string): Promise<boolean> {
    const { error } = await supabase
      .from('clients')
      .update({ onboarding_completed: true })
      .eq('id', clientId);

    if (error) {
      console.error('Erro ao marcar onboarding como concluído:', error);
      return false;
    }

    await logService.logActivity('campaign_edit', 'clients', clientId, { onboarding_completed: true }, clientId);
    return true;
  },
};
