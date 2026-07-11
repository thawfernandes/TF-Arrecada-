// ============================================================
// TF Arrecada+ | Campaign Service v3
// CRUD de campanhas via Supabase, integração de status,
// reservas pré-calculadas e auditoria automática de logs.
// ============================================================

import { supabase } from '../lib/supabase';
import { logService } from './logService';
import type {
  Campaign,
  CampaignNumber,
  CampaignStatus,
  CampaignStats,
  MyNumberResult,
  Buyer,
} from '../types';

export const campaignService = {
  /**
   * Converte o nome da campanha em um slug amigável.
   */
  generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 30);
    const rand = Math.random().toString(36).substring(2, 7);
    return `${base}-${rand}`;
  },

  /**
   * Busca as campanhas de um cliente.
   */
  async getCampaigns(clientId: string): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar campanhas do cliente:', error);
      return [];
    }

    return data as Campaign[];
  },

  /**
   * Busca uma campanha pública via share_code ou slug.
   * Prioriza share_code conforme requisitos da reestruturação V2.
   */
  async getCampaignByShareCode(shareCode: string): Promise<Campaign | null> {
    // 1. Tentar buscar por share_code
    let query = supabase.from('campaigns').select('*').eq('share_code', shareCode);
    let { data, error } = await query.single();

    if (error || !data) {
      // 2. Fallback: tentar buscar por slug para links antigos funcionarem
      const slugQuery = supabase.from('campaigns').select('*').eq('slug', shareCode);
      const res = await slugQuery.single();
      if (res.error || !res.data) return null;
      data = res.data;
    }

    return data as Campaign;
  },

  /**
   * Busca detalhes completos de uma campanha (incluindo organizadores e números).
   */
  async getCampaignDetails(campaignId: string): Promise<Campaign | null> {
    const { data: campaign, error: cError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (cError || !campaign) return null;

    const [orgsRes, numsRes, settingsRes] = await Promise.all([
      supabase.from('organizers').select('*').eq('campaign_id', campaignId),
      supabase
        .from('campaign_numbers')
        .select('*, buyers(*)')
        .eq('campaign_id', campaignId)
        .order('number', { ascending: true }),
      supabase.from('client_settings').select('*').eq('client_id', campaign.client_id).maybeSingle(),
    ]);

    return {
      ...(campaign as Campaign),
      organizers: orgsRes.data || [],
      client_settings: settingsRes.data || undefined,
      numbers: (numsRes.data || []).map((n) => ({
        id: n.id,
        campaign_id: n.campaign_id,
        number: n.number,
        status: n.status,
        reserved_at: n.reserved_at,
        reservation_expires_at: n.reservation_expires_at,
        paid_at: n.paid_at,
        buyer: n.buyers?.[0] || undefined, // Relacionamento 1:1 via array
      })),
    };
  },

  /**
   * Cria uma nova campanha e gera todos os seus números em lote.
   */
  async createCampaign(
    clientId: string,
    data: {
      name: string;
      image_url?: string;
      description: string;
      price_per_number: number;
      total_numbers: number;
      pix_key: string;
      draw_type: 'specific_date' | 'after_all_sold';
      draw_date?: string;
      rules?: string;
      reservation_timeout_minutes: number;
      organizers: { name: string; phone: string; whatsapp: string; role: string; is_primary: boolean }[];
    }
  ): Promise<Campaign | null> {
    try {
      const slug = this.generateSlug(data.name);

      // 1. Inserir campanha
      const { data: campaign, error: cError } = await supabase
        .from('campaigns')
        .insert({
          client_id: clientId,
          slug,
          name: data.name,
          image_url: data.image_url,
          description: data.description,
          price_per_number: data.price_per_number,
          total_numbers: data.total_numbers,
          pix_key: data.pix_key,
          draw_type: data.draw_type,
          draw_date: data.draw_date || null,
          rules: data.rules,
          reservation_timeout_minutes: data.reservation_timeout_minutes,
          status: 'draft', // Sempre inicia como draft
        })
        .select()
        .single();

      if (cError || !campaign) {
        console.error('Erro ao criar campanha no banco:', cError);
        return null;
      }

      // 2. Inserir organizadores
      if (data.organizers.length > 0) {
        const orgsToInsert = data.organizers.map((o) => ({
          campaign_id: campaign.id,
          name: o.name,
          phone: o.phone,
          whatsapp: o.whatsapp,
          role: o.role,
          is_primary: o.is_primary,
        }));
        await supabase.from('organizers').insert(orgsToInsert);
      }

      // 3. Gerar números da rifa em lote
      const numbersToInsert = Array.from({ length: data.total_numbers }, (_, i) => ({
        campaign_id: campaign.id,
        number: i + 1,
        status: 'available',
      }));

      // Inserção em lotes de 1000 para evitar limites do Supabase/Postgres
      const batchSize = 1000;
      for (let i = 0; i < numbersToInsert.length; i += batchSize) {
        const batch = numbersToInsert.slice(i, i + batchSize);
        const { error: nError } = await supabase.from('campaign_numbers').insert(batch);
        if (nError) {
          console.error(`Erro ao inserir lote de números (${i} a ${i + batch.length}):`, nError);
          // Opcional: deletar campanha se falhar a criação dos números para manter consistência
        }
      }

      // 4. Log de auditoria
      await logService.logActivity(
        'campaign_create',
        'campaigns',
        campaign.id,
        { name: campaign.name, total_numbers: campaign.total_numbers },
        clientId
      );

      return campaign as Campaign;
    } catch (err) {
      console.error('Erro geral no createCampaign:', err);
      return null;
    }
  },

  /**
   * Atualiza os dados de uma campanha.
   */
  async updateCampaign(
    clientId: string,
    campaignId: string,
    updates: Partial<Campaign>
  ): Promise<Campaign | null> {
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
      .select()
      .single();

    if (error || !campaign) {
      console.error('Erro ao editar campanha:', error);
      return null;
    }

    await logService.logActivity('campaign_edit', 'campaigns', campaignId, { updates }, clientId);
    return campaign as Campaign;
  },

  /**
   * Deleta uma campanha.
   */
  async deleteCampaign(clientId: string, campaignId: string): Promise<boolean> {
    const { error } = await supabase.from('campaigns').delete().eq('id', campaignId);

    if (error) {
      console.error('Erro ao deletar campanha:', error);
      return false;
    }

    await logService.logActivity('campaign_delete', 'campaigns', campaignId, {}, clientId);
    return true;
  },

  /**
   * Altera o status da campanha (draft -> active -> finished -> archived).
   */
  async updateCampaignStatus(clientId: string, campaignId: string, status: CampaignStatus): Promise<boolean> {
    const { error } = await supabase
      .from('campaigns')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', campaignId);

    if (error) {
      console.error(`Erro ao atualizar status da campanha para ${status}:`, error);
      return false;
    }

    await logService.logActivity('campaign_edit', 'campaigns', campaignId, { status }, clientId);
    return true;
  },

  /**
   * Reserva um número específico de forma segura.
   * Calcula e armazena reservation_expires_at no banco de dados para evitar cálculos em tempo real.
   */
  async reserveNumber(
    campaignId: string,
    number: number,
    buyer: { name: string; phone: string; city?: string; message?: string },
    timeoutMinutes: number
  ): Promise<{ success: boolean; error?: string; campaignNumber?: CampaignNumber }> {
    try {
      // 1. Obter registro do número e verificar status
      const { data: numRecord, error: numError } = await supabase
        .from('campaign_numbers')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('number', number)
        .single();

      if (numError || !numRecord) {
        return { success: false, error: 'number_not_found' };
      }

      // Verificar expiração caso esteja reservado
      if (numRecord.status === 'reserved') {
        const isExpired = new Date(numRecord.reservation_expires_at).getTime() < Date.now();
        if (!isExpired) {
          return { success: false, error: 'already_reserved' };
        }
        // Se expirou, podemos liberar e reservar para o novo usuário na mesma transação
      } else if (numRecord.status === 'paid') {
        return { success: false, error: 'already_paid' };
      }

      // 2. Calcular data de expiração da reserva
      const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000).toISOString();

      // 3. Atualizar status do número com controle de concorrência sutil
      // Adicionamos a cláusula no UPDATE para garantir que ninguém atualizou nesse meio tempo
      const { data: updatedNum, error: updateError } = await supabase
        .from('campaign_numbers')
        .update({
          status: 'reserved',
          reserved_at: new Date().toISOString(),
          reservation_expires_at: expiresAt,
        })
        .eq('id', numRecord.id)
        .or(`status.eq.available,reservation_expires_at.lt.${new Date().toISOString()}`)
        .select()
        .single();

      if (updateError || !updatedNum) {
        return { success: false, error: 'concurrency_error' };
      }

      // 4. Inserir dados do comprador (deleta comprador antigo se houver expiração)
      await supabase.from('buyers').delete().eq('campaign_number_id', updatedNum.id);

      const { data: buyerRecord, error: buyerError } = await supabase
        .from('buyers')
        .insert({
          campaign_number_id: updatedNum.id,
          name: buyer.name,
          phone: buyer.phone,
          city: buyer.city || null,
          message: buyer.message || null,
        })
        .select()
        .single();

      if (buyerError || !buyerRecord) {
        // Rollback da reserva se o comprador falhar
        await supabase
          .from('campaign_numbers')
          .update({
            status: 'available',
            reserved_at: null,
            reservation_expires_at: null,
          })
          .eq('id', updatedNum.id);
        return { success: false, error: 'buyer_save_error' };
      }

      // 5. Registrar log
      await logService.logActivity('reserve', 'campaign_numbers', updatedNum.id, {
        number,
        buyerName: buyer.name,
      });

      return {
        success: true,
        campaignNumber: {
          id: updatedNum.id,
          campaign_id: updatedNum.campaign_id,
          number: updatedNum.number,
          status: 'reserved',
          reserved_at: updatedNum.reserved_at,
          reservation_expires_at: updatedNum.reservation_expires_at,
          buyer: buyerRecord as Buyer,
        },
      };
    } catch (err) {
      console.error('Erro na reserva de número:', err);
      return { success: false, error: 'system_error' };
    }
  },

  /**
   * Confirma o pagamento de um número reservado.
   */
  async confirmPayment(clientId: string, campaignNumberId: string): Promise<boolean> {
    const { data: updatedNum, error } = await supabase
      .from('campaign_numbers')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', campaignNumberId)
      .eq('status', 'reserved')
      .select()
      .single();

    if (error || !updatedNum) {
      console.error('Erro ao confirmar pagamento:', error);
      return false;
    }

    await logService.logActivity('payment', 'campaign_numbers', campaignNumberId, { number: updatedNum.number }, clientId);
    return true;
  },

  /**
   * Cancela uma reserva, voltando o número ao status disponível.
   */
  async cancelReservation(clientId: string, campaignNumberId: string): Promise<boolean> {
    // 1. Deletar comprador vinculado
    await supabase.from('buyers').delete().eq('campaign_number_id', campaignNumberId);

    // 2. Liberar o número
    const { data: updatedNum, error } = await supabase
      .from('campaign_numbers')
      .update({
        status: 'available',
        reserved_at: null,
        reservation_expires_at: null,
        paid_at: null,
      })
      .eq('id', campaignNumberId)
      .select()
      .single();

    if (error || !updatedNum) {
      console.error('Erro ao cancelar reserva:', error);
      return false;
    }

    await logService.logActivity('cancel', 'campaign_numbers', campaignNumberId, { number: updatedNum.number }, clientId);
    return true;
  },

  /**
   * Calcula estatísticas completas de uma campanha.
   */
  getCampaignStats(campaign: Campaign): CampaignStats {
    const numbers = campaign.numbers || [];
    const total = campaign.total_numbers;
    const paid = numbers.filter((n) => n.status === 'paid').length;
    const reserved = numbers.filter((n) => n.status === 'reserved').length;
    const available = numbers.filter((n) => n.status === 'available').length;

    const totalRaised = paid * campaign.price_per_number;
    const totalExpected = total * campaign.price_per_number;
    const progressPercent = total > 0 ? Math.round(((paid + reserved) / total) * 100) : 0;
    const soldPercent = total > 0 ? Math.round((paid / total) * 100) : 0;

    return {
      total,
      available,
      reserved,
      paid,
      totalRaised,
      totalExpected,
      progressPercent,
      soldPercent,
    };
  },

  /**
   * Busca números reservados ou pagos pelo telefone do usuário (Meus Números).
   */
  async findNumbersByPhone(phone: string): Promise<MyNumberResult[]> {
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 8) return [];

    // Busca todos os compradores com número de telefone semelhante
    // (Usa like ou correspondência de caracteres limpos)
    const { data: buyersList, error } = await supabase
      .from('buyers')
      .select('*, campaign_numbers(*, campaigns(*))');

    if (error || !buyersList) return [];

    // Filtrar localmente por telefone limpo
    const matchedBuyers = buyersList.filter((b) => b.phone.replace(/\D/g, '') === clean);

    // Agrupar por campanha
    const campaignMap: Record<string, MyNumberResult> = {};

    for (const b of matchedBuyers) {
      const cn = b.campaign_numbers;
      if (!cn) continue;
      const c = cn.campaigns;
      if (!c) continue;

      if (!campaignMap[c.id]) {
        campaignMap[c.id] = {
          campaignName: c.name,
          campaignSlug: c.slug,
          shareCode: c.share_code,
          numbers: [],
        };
      }

      campaignMap[c.id].numbers.push({
        number: cn.number,
        status: cn.status,
        reservedAt: cn.reserved_at,
        reservationExpiresAt: cn.reservation_expires_at,
        paidAt: cn.paid_at,
      });
    }

    return Object.values(campaignMap);
  },
};
