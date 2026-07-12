// ============================================================
// TF Arrecada+ | Client Dashboard Page
// Painel administrativo exclusivo do cliente autenticado
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, AlertCircle, Copy, Check,
  TrendingUp, Users, DollarSign, RefreshCw, LogOut, CheckCircle, XCircle, Trash2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getCampaignUrl } from '../utils/format';

import { campaignService } from '../services/campaignService';
import { LicenseWarningBanner } from '../components/LicenseWarningBanner';
import { CreateCampaignModal } from '../components/CreateCampaignModal';
import { Layout } from '../components/Layout';
import { Logo } from '../components/Logo';
import type { Campaign, CampaignStats } from '../types';

export function ClientDashboardPage() {
  const navigate = useNavigate();
  const { client, profile, logout } = useAuth();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!client) return;
    setIsLoading(true);
    try {
      const list = await campaignService.getCampaigns(client.id);
      setCampaigns(list);

      if (list.length > 0) {
        // Seleciona a campanha mais recente por padrão
        const activeCampaign = list.find((c) => c.status === 'active') || list[0];
        
        // Detalhes completos da selecionada
        const fullDetails = await campaignService.getCampaignDetails(activeCampaign.id);
        setSelectedCampaign(fullDetails);

        if (fullDetails) {
          const calculatedStats = campaignService.getCampaignStats(fullDetails);
          setStats(calculatedStats);
        }
      } else {
        setSelectedCampaign(null);
        setStats(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [client]);

  const handleSelectCampaign = async (campaignId: string) => {
    setIsLoading(true);
    try {
      const fullDetails = await campaignService.getCampaignDetails(campaignId);
      setSelectedCampaign(fullDetails);
      if (fullDetails) {
        setStats(campaignService.getCampaignStats(fullDetails));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPayment = async (numberId: string) => {
    if (!client || !selectedCampaign) return;
    const success = await campaignService.confirmPayment(client.id, numberId);
    if (success) {
      handleSelectCampaign(selectedCampaign.id);
    }
  };

  const handleCancelReservation = async (numberId: string) => {
    if (!client || !selectedCampaign) return;
    const success = await campaignService.cancelReservation(client.id, numberId);
    if (success) {
      handleSelectCampaign(selectedCampaign.id);
    }
  };

  const handlePublishCampaign = async (campaignId: string) => {
    if (!client) return;
    const success = await campaignService.updateCampaignStatus(client.id, campaignId, 'active');
    if (success) {
      fetchDashboardData();
    }
  };

  const handleFinishCampaign = async (campaignId: string) => {
    if (!client) return;
    const success = await campaignService.updateCampaignStatus(client.id, campaignId, 'finished');
    if (success) {
      fetchDashboardData();
    }
  };

  const handleCopyLink = () => {
    if (!selectedCampaign) return;
    const link = getCampaignUrl(selectedCampaign.share_code);
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!client) return;
    const confirmed = window.confirm(
      'Tem certeza que deseja apagar esta campanha permanentemente? Todos os dados vinculados a ela serão deletados.'
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const success = await campaignService.deleteCampaign(client.id, campaignId);
      if (success) {
        await fetchDashboardData();
      } else {
        alert('Erro ao excluir campanha.');
      }
    } catch (err) {
      console.error('Erro ao deletar campanha:', err);
      alert('Erro inesperado ao excluir campanha.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Layout withDots fullHeight>
      <div className="flex-1 flex flex-col p-6 max-w-6xl mx-auto w-full select-none">
        
        {/* ─── Header ─── */}
        <header className="flex items-center justify-between border-b border-neutral-100 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div className="h-6 w-px bg-neutral-200" />
            <div className="text-left">
              <h1 className="text-sm font-bold text-neutral-800 leading-none">
                {profile?.empresa || 'Minha Organização'}
              </h1>
              <span className="text-xxs font-medium text-neutral-400">
                Responsável: {profile?.nome || 'Cliente'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus size={14} />
              Nova Campanha
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 text-neutral-400 hover:text-neutral-600 rounded-xl hover:bg-neutral-50 transition-colors"
              title="Sair da Conta"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Banner de Aviso de Licença */}
        <LicenseWarningBanner />

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary border-r-2"></div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-neutral-50 rounded-3xl border border-neutral-100 border-dashed">
            <AlertCircle size={48} className="text-neutral-300 mb-4" />
            <h3 className="text-lg font-bold text-neutral-700">Nenhuma campanha criada</h3>
            <p className="text-sm text-neutral-400 max-w-xs mt-1.5 leading-relaxed">
              Você ainda não criou nenhuma campanha de arrecadação. Clique em "Nova Campanha" para começar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sidebar de Campanhas */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Minhas Campanhas
              </h3>
              <div className="space-y-2">
                {campaigns.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCampaign(c.id)}
                    className={`w-full text-left p-4 border rounded-2xl transition-all flex items-center justify-between ${
                      selectedCampaign?.id === c.id
                        ? 'border-neutral-800 bg-neutral-50/50 shadow-sm'
                        : 'border-neutral-200/60 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-neutral-800 line-clamp-1">{c.name}</h4>
                      <span className="text-xxs text-neutral-400 font-medium capitalize">{c.draw_type === 'after_all_sold' ? 'Até vender tudo' : 'Data Fixa'}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider ${
                      c.status === 'active' ? 'bg-green-50 text-green-700' :
                      c.status === 'draft' ? 'bg-amber-50 text-amber-700' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {c.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Conteúdo Central/Resumo */}
            {selectedCampaign && (
              <div className="lg:col-span-2 space-y-6">
                
                {/* Cabeçalho da Campanha Selecionada */}
                <div className="card p-6 bg-white border border-neutral-100/80 shadow-sm rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xxs font-bold text-neutral-400 uppercase tracking-wider">CAMPANHA SELECIONADA</span>
                    <h2 className="text-lg font-display font-bold text-neutral-800">{selectedCampaign.name}</h2>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-1">{selectedCampaign.description}</p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {selectedCampaign.status === 'draft' && (
                      <button
                        onClick={() => handlePublishCampaign(selectedCampaign.id)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Publicar Campanha
                      </button>
                    )}
                    {selectedCampaign.status === 'active' && (
                      <button
                        onClick={() => handleFinishCampaign(selectedCampaign.id)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Encerrar Campanha
                      </button>
                    )}
                    <button
                      onClick={handleCopyLink}
                      className="p-2.5 bg-neutral-50 hover:bg-neutral-100 rounded-xl text-neutral-600 transition-colors"
                      title="Copiar Link de Compartilhamento"
                    >
                      {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(selectedCampaign.id)}
                      className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                      title="Excluir Campanha"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Métricas */}
                {stats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="card p-4 bg-white border border-neutral-100/80 shadow-sm rounded-2xl">
                      <TrendingUp size={20} className="text-neutral-400 mb-2" />
                      <span className="text-xxs font-bold text-neutral-400 block uppercase">ARRECADADO</span>
                      <span className="text-sm font-bold text-neutral-800">R$ {stats.totalRaised.toFixed(2)}</span>
                    </div>

                    <div className="card p-4 bg-white border border-neutral-100/80 shadow-sm rounded-2xl">
                      <DollarSign size={20} className="text-neutral-400 mb-2" />
                      <span className="text-xxs font-bold text-neutral-400 block uppercase">META TOTAL</span>
                      <span className="text-sm font-bold text-neutral-800">R$ {stats.totalExpected.toFixed(2)}</span>
                    </div>

                    <div className="card p-4 bg-white border border-neutral-100/80 shadow-sm rounded-2xl">
                      <Users size={20} className="text-neutral-400 mb-2" />
                      <span className="text-xxs font-bold text-neutral-400 block uppercase">VENDIDOS</span>
                      <span className="text-sm font-bold text-neutral-800">{stats.paid} / {stats.total}</span>
                    </div>

                    <div className="card p-4 bg-white border border-neutral-100/80 shadow-sm rounded-2xl">
                      <RefreshCw size={20} className="text-neutral-400 mb-2" />
                      <span className="text-xxs font-bold text-neutral-400 block uppercase">RESERVADOS</span>
                      <span className="text-sm font-bold text-neutral-800">{stats.reserved}</span>
                    </div>
                  </div>
                )}

                {/* Reservas Pendentes */}
                <div className="card p-6 bg-white border border-neutral-100/80 shadow-sm rounded-3xl space-y-4">
                  <h3 className="text-sm font-bold text-neutral-800">Reservas Pendentes</h3>
                  
                  {selectedCampaign.numbers?.filter((n) => n.status === 'reserved').length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-6">Nenhuma reserva aguardando confirmação.</p>
                  ) : (
                    <div className="divide-y divide-neutral-100">
                      {selectedCampaign.numbers
                        ?.filter((n) => n.status === 'reserved')
                        .map((n) => (
                          <div key={n.id} className="flex items-center justify-between py-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-neutral-800">#{n.number}</span>
                                <span className="text-xxs text-neutral-400">por {n.buyer?.name}</span>
                              </div>
                              <span className="text-xxs text-neutral-400 font-medium block">
                                Expira em: {n.reservation_expires_at ? new Date(n.reservation_expires_at).toLocaleTimeString() : 'N/A'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleConfirmPayment(n.id)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Confirmar Pagamento"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleCancelReservation(n.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Cancelar Reserva"
                              >
                                <XCircle size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Últimos Compradores */}
                <div className="card p-6 bg-white border border-neutral-100/80 shadow-sm rounded-3xl space-y-4">
                  <h3 className="text-sm font-bold text-neutral-800">Últimos Compradores</h3>
                  
                  {selectedCampaign.numbers?.filter((n) => n.status === 'paid').length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-6">Nenhum número pago ainda.</p>
                  ) : (
                    <div className="divide-y divide-neutral-100">
                      {selectedCampaign.numbers
                        ?.filter((n) => n.status === 'paid')
                        .slice(0, 5)
                        .map((n) => (
                          <div key={n.id} className="flex items-center justify-between py-3">
                            <div>
                              <span className="text-xs font-bold text-neutral-800 block">Número #{n.number}</span>
                              <span className="text-xxs text-neutral-400 font-medium">Nome: {n.buyer?.name || 'Anônimo'} | Telefone: {n.buyer?.phone}</span>
                            </div>
                            <span className="text-xxs font-bold text-green-600">PAGO</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Criação de Campanha */}
      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        clientId={client?.id || ''}
        onSuccess={fetchDashboardData}
      />
    </Layout>
  );
}
