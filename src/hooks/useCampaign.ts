// ============================================================
// TF Arrecada+ | useCampaign Hook
// Consulta dados da campanha em tempo real via Supabase Subscriptions
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { campaignService } from '../services/campaignService';
import { supabase } from '../lib/supabase';
import type { Campaign } from '../types';

export function useCampaign(shareCodeOrSlug: string | undefined, enableRealtime = false) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!shareCodeOrSlug) {
      setLoading(false);
      return;
    }

    try {
      // 1. Encontrar a campanha básica pelo código/slug
      const baseCampaign = await campaignService.getCampaignByShareCode(shareCodeOrSlug);
      if (baseCampaign) {
        // 2. Carregar os detalhes completos (números e organizadores)
        const fullCampaign = await campaignService.getCampaignDetails(baseCampaign.id);
        setCampaign(fullCampaign);
      } else {
        setCampaign(null);
      }
    } catch (err) {
      console.error('Erro ao recarregar dados da campanha:', err);
    } finally {
      setLoading(false);
    }
  }, [shareCodeOrSlug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Supabase Realtime Subscriptions
  useEffect(() => {
    if (!enableRealtime || !campaign?.id) return;

    // Escuta qualquer mudança em campaign_numbers vinculados a esta campanha
    const channel = supabase
      .channel(`campaign_numbers_changes_${campaign.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_numbers',
          filter: `campaign_id=eq.${campaign.id}`,
        },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enableRealtime, campaign?.id, refresh]);

  return { campaign, loading, refresh };
}
