// ============================================================
// TF Arrecada+ | CampaignPublicPage — Página pública da campanha
// ============================================================

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, DollarSign, Hash, Users,
  ChevronDown, ChevronUp, Phone, MessageCircle
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { NumberGrid } from '../components/NumberGrid';
import { ReserveModal } from '../components/ReserveModal';
import { MyNumbersModal } from '../components/MyNumbersModal';
import { SEOHead } from '../components/SEOHead';
import { NotFoundPage } from './NotFoundPage';
import { useCampaign } from '../hooks/useCampaign';
import { campaignService } from '../services/campaignService';
import { formatCurrency, formatDate, maskPhone, formatWhatsAppLink } from '../utils/format';
import type { CampaignNumber } from '../types';

export function CampaignPublicPage() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  
  // Habilita tempo real via Supabase Realtime
  const { campaign, loading, refresh } = useCampaign(shareCode, true);
  
  const [selectedNumber, setSelectedNumber] = useState<CampaignNumber | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [isMyNumbersOpen, setIsMyNumbersOpen] = useState(false);
  
  // Estados da pesquisa rápida local por telefone
  const [searchPhone, setSearchPhone] = useState('');
  const [quickResults, setQuickResults] = useState<CampaignNumber[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  if (loading) return <Skeleton />;
  if (!campaign) return <NotFoundPage />;

  const stats = campaignService.getCampaignStats(campaign);

  function handleNumberClick(num: CampaignNumber) {
    if (num.status === 'available') setSelectedNumber(num);
  }

  // Pesquisa rápida de números na campanha atual
  function handleQuickSearch(e: React.FormEvent) {
    e.preventDefault();
    const clean = searchPhone.replace(/\D/g, '');
    if (clean.length < 8) return;

    const found = ((campaign?.numbers) || []).filter(
      (n) => n.buyer?.phone.replace(/\D/g, '') === clean
    );
    setQuickResults(found);
    setHasSearched(true);
  }

  function clearQuickSearch() {
    setSearchPhone('');
    setQuickResults([]);
    setHasSearched(false);
  }

  const colors = campaign.client_settings?.colors || { primary: '#D312AE', secondary: '#27272a' };

  return (
    <Layout footerText={campaign.client_settings?.footer_text}>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --brand-500: ${colors.primary || '#D312AE'};
          --brand-50: ${(colors.primary || '#D312AE')}10;
          --brand-100: ${(colors.primary || '#D312AE')}22;
          --brand-200: ${(colors.primary || '#D312AE')}44;
          --brand-300: ${(colors.primary || '#D312AE')}77;
          --brand-400: ${(colors.primary || '#D312AE')}aa;
          --brand-600: ${(colors.primary || '#D312AE')}cc;
          --brand-700: ${(colors.primary || '#D312AE')}dd;
          --brand-800: ${colors.primary || '#D312AE'};
          --brand-900: ${colors.primary || '#D312AE'};
          --brand-950: ${colors.primary || '#D312AE'};
        }
      ` }} />
      {/* Meta tags para SEO e compartilhamento */}
      <SEOHead
        title={campaign.name}
        description={campaign.description}
        imageUrl={campaign.image_url}
        slug={campaign.share_code}
      />

      {/* ── Header sticky ──────────────────────────────────── */}
      <header className="sticky top-0 z-40 glass border-b border-white/60">
        <div className="page-container h-14 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="btn-ghost p-2 -ml-2 shrink-0"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-display font-bold text-neutral-800 text-sm flex-1 truncate">
            {campaign.name}
          </h1>
          {/* O botão "Settings" foi removido conforme a estratégia V2 */}
        </div>
      </header>

      <div className="page-container py-6 space-y-5 max-w-3xl mx-auto">
        {/* ── Banner ─────────────────────────────────────── */}
        {campaign.image_url ? (
          <img
            src={campaign.image_url}
            alt={campaign.name}
            className="w-full h-56 sm:h-72 object-cover rounded-3xl shadow-medium"
          />
        ) : (
          <div className="w-full h-40 rounded-3xl bg-gradient-to-br
                          from-brand-100 to-brand-200 flex items-center justify-center">
            <Hash size={52} className="text-brand-300" />
          </div>
        )}

        {/* ── Info da campanha ───────────────────────────── */}
        <div className="card p-6 space-y-6">
          <div>
            <h2 className="font-display font-bold text-2xl text-neutral-800 mb-2">
              {campaign.name}
            </h2>
            <p className="text-neutral-600 text-sm leading-relaxed whitespace-pre-wrap">
              {campaign.description}
            </p>
          </div>

          {/* Grid de meta informações */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-y border-neutral-100 py-4">
            <MetaItem icon={<DollarSign size={16} />} label="Por número" value={formatCurrency(campaign.price_per_number)} />
            
            <MetaItem 
              icon={<Calendar size={16} />} 
              label="Sorteio" 
              value={campaign.draw_type === 'specific_date' ? formatDate(campaign.draw_date || '') : 'Ao vender tudo'} 
            />
            
            <MetaItem 
              icon={<Users size={16} />} 
              label="Organizadores" 
              value={`${(campaign.organizers || []).length} cadastrado(s)`} 
            />
            
            <MetaItem icon={<Hash size={16} />} label="Total números" value={String(campaign.total_numbers)} />
          </div>

          {/* Barra de progresso */}
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-neutral-500">
                {stats.paid + stats.reserved} de {stats.total} números reservados/pagos
              </span>
              <span className="text-brand-600">{stats.progressPercent}% concluída</span>
            </div>
            
            <div className="progress-bar h-2.5">
              <div className="progress-fill" style={{ width: `${stats.progressPercent}%` }} />
            </div>

            {/* Contador em Tempo Real */}
            <div className="grid grid-cols-4 gap-2 text-center pt-1.5">
              <div className="bg-neutral-50 border border-neutral-100 p-2 rounded-xl">
                <span className="text-sm font-bold text-neutral-700 block">{stats.total}</span>
                <span className="text-[10px] text-neutral-400 font-medium uppercase">Total</span>
              </div>
              <div className="bg-green-50 border border-green-100 p-2 rounded-xl">
                <span className="text-sm font-bold text-green-600 block">{stats.available}</span>
                <span className="text-[10px] text-green-500 font-medium uppercase">Livres</span>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-2 rounded-xl">
                <span className="text-sm font-bold text-amber-600 block">{stats.reserved}</span>
                <span className="text-[10px] text-amber-500 font-medium uppercase">Reservados</span>
              </div>
              <div className="bg-red-50 border border-red-100 p-2 rounded-xl">
                <span className="text-sm font-bold text-red-600 block">{stats.paid}</span>
                <span className="text-[10px] text-red-500 font-medium uppercase">Pagos</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Aviso data do sorteio (Se drawType === 'after_all_sold') ── */}
        {campaign.draw_type === 'after_all_sold' && (
          <div className="bg-brand-50 border border-brand-100 text-brand-700 rounded-2xl p-4 text-sm leading-relaxed">
            📢 <strong>Aviso importante:</strong> Esta campanha será encerrada após a venda de todos os números. Acompanhe o andamento diretamente pelo site.
          </div>
        )}

        {/* ── Pesquisa Rápida (Consulte seus números) ───────────── */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h3 className="font-display font-bold text-sm text-neutral-800 flex items-center gap-1.5">
              🔍 Consulte seus números
            </h3>
            <button
              onClick={() => setIsMyNumbersOpen(true)}
              className="text-xs text-brand-600 hover:underline font-semibold"
            >
              Consulta global (outras campanhas)
            </button>
          </div>

          <form onSubmit={handleQuickSearch} className="flex gap-2">
            <input
              type="tel"
              className="input text-sm flex-1"
              placeholder="Informe seu telefone"
              value={searchPhone}
              onChange={(e) => setSearchPhone(maskPhone(e.target.value))}
            />
            <button type="submit" className="btn-primary px-4 py-2 text-sm shrink-0">
              Buscar
            </button>
          </form>

          {hasSearched && (
            <div className="bg-neutral-50/50 border border-neutral-200 rounded-2xl p-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-500">Resultados para {searchPhone}</span>
                <button onClick={clearQuickSearch} className="text-xs text-neutral-400 hover:underline">
                  Limpar
                </button>
              </div>

              {quickResults.length === 0 ? (
                <p className="text-xs text-neutral-400">Nenhum número reservado ou pago nesta campanha para este telefone.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {quickResults.map((n) => (
                    <div
                      key={n.id}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5
                        ${n.status === 'paid'
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}
                      title={n.status === 'paid' ? 'Pago' : 'Reservado'}
                    >
                      <span>#{n.number}</span>
                      <span className="text-[9px] uppercase tracking-wider font-semibold opacity-70">
                        {n.status === 'paid' ? 'Pago' : 'Reservado'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Legenda ───────────────────────────────────── */}
        <div className="flex items-center justify-center gap-6 py-1">
          <Legend color="green" label="Disponível" />
          <Legend color="amber" label="Reservado" />
          <Legend color="red"   label="Pago" />
        </div>

        {/* ── Grade de números ──────────────────────────── */}
        <div className="card p-4">
          <p className="text-xs text-neutral-500 text-center mb-4 font-medium">
            Toque em um número verde para reservar
          </p>
          <NumberGrid numbers={campaign.numbers || []} onNumberClick={handleNumberClick} />
        </div>

        {/* ── Organizadores ────────────────── */}
        {campaign.organizers && campaign.organizers.length > 0 && (
          <div className="card p-5 space-y-4">
            <h3 className="font-display font-bold text-neutral-800 text-sm">
              👥 Organizadores da Campanha
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {campaign.organizers.map((org) => (
                <div key={org.id} className="border border-neutral-100 rounded-2xl p-4 bg-neutral-50 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-display font-bold text-neutral-800 text-sm">{org.name}</h4>
                    <p className="text-xs text-neutral-400 font-medium">{org.role || 'Organizador'}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-neutral-100/50">
                    <a
                      href={`tel:${org.phone}`}
                      className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1 border border-neutral-200"
                      title={`Ligar para ${org.name}`}
                    >
                      <Phone size={12} /> Ligar
                    </a>
                    <a
                      href={formatWhatsAppLink((org.whatsapp && org.whatsapp.replace(/\D/g, '').length >= 10) ? org.whatsapp : org.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 btn-secondary bg-emerald-50 text-emerald-700 hover:bg-emerald-100/75 border border-emerald-100 text-xs py-1.5 flex items-center justify-center gap-1"
                      title={`WhatsApp de ${org.name}`}
                    >
                      <MessageCircle size={12} /> WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Regulamento (colapsável) ───────────────────── */}
        {campaign.rules && (
          <div className="card overflow-hidden">
            <button
              onClick={() => setShowRules((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-neutral-800 text-sm"
            >
              <span>📋 Regulamento e Condições</span>
              {showRules
                ? <ChevronUp size={16} className="text-neutral-400" />
                : <ChevronDown size={16} className="text-neutral-400" />
              }
            </button>
            {showRules && (
              <div className="px-5 pb-5 border-t border-neutral-100 pt-4
                              text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap animate-slide-down">
                {campaign.rules}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modal de reserva ────────────────────────────────── */}
      {selectedNumber && (
        <ReserveModal
          isOpen
          onClose={() => setSelectedNumber(null)}
          campaign={campaign}
          number={selectedNumber}
          onRefresh={refresh}
        />
      )}

      {/* ── Modal de Consulta Global "Meus Números" ────────── */}
      <MyNumbersModal
        isOpen={isMyNumbersOpen}
        onClose={() => setIsMyNumbersOpen(false)}
        initialPhone={searchPhone}
      />
    </Layout>
  );
}

// ─── Sub-componentes ─────────────────────────────────────────

function MetaItem({
  icon, label, value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
        <span className="text-brand-500">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">{label}</p>
        <p className="text-xs font-bold text-neutral-800 truncate">{value}</p>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: 'green' | 'amber' | 'red'; label: string }) {
  const bg = {
    green: 'bg-green-100 border-green-400',
    amber: 'bg-amber-50 border-amber-300',
    red:   'bg-red-50 border-red-300',
  }[color];

  return (
    <span className="flex items-center gap-1.5 text-xs text-neutral-600">
      <span className={`w-3 h-3 rounded border-2 inline-block ${bg}`} />
      {label}
    </span>
  );
}

function Skeleton() {
  return (
    <Layout>
      <div className="page-container py-6 space-y-5 max-w-3xl mx-auto animate-pulse">
        <div className="h-56 bg-neutral-100 rounded-3xl" />
        <div className="card p-6 space-y-4">
          <div className="h-6 bg-neutral-100 rounded-xl w-3/4" />
          <div className="h-4 bg-neutral-100 rounded-xl w-full" />
          <div className="h-4 bg-neutral-100 rounded-xl w-5/6" />
        </div>
      </div>
    </Layout>
  );
}
