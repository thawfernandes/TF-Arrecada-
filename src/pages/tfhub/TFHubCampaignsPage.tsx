// ============================================================
// TF Arrecada+ | TFHubCampaignsPage
// Monitoramento global de todas as campanhas cadastradas (cross-client)
// ============================================================

import { useState, useEffect } from 'react';
import { Search, Link as LinkIcon, Trash } from 'lucide-react';
import { tfhubService } from '../../services/tfhubService';
import { campaignService } from '../../services/campaignService';
import { getCampaignUrl } from '../../utils/format';
import { TFHubLayout } from './TFHubLayout';


export function TFHubCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const data = await tfhubService.getAllCampaigns();
      setCampaigns(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleToggleStatus = async (campaignId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'finished' : 'active';
    const confirm = window.confirm(
      `Deseja realmente alterar o status da campanha para ${nextStatus.toUpperCase()}?`
    );
    if (!confirm) return;

    // Precisamos de uma query para obter a campanha e achar o client_id
    const campaignToUpdate = campaigns.find((c) => c.id === campaignId);
    if (!campaignToUpdate) return;

    const success = await campaignService.updateCampaignStatus(
      campaignToUpdate.client_id,
      campaignId,
      nextStatus as any
    );
    if (success) {
      fetchCampaigns();
    }
  };

  const handleDelete = async (campaignId: string) => {
    const confirm = window.confirm(
      'CUIDADO: Excluir esta campanha apagará permanentemente todos os números, reservas e dados de compradores vinculados. Esta ação é IRREVERSÍVEL. Continuar?'
    );
    if (!confirm) return;

    const campaignToDelete = campaigns.find((c) => c.id === campaignId);
    if (!campaignToDelete) return;

    const success = await campaignService.deleteCampaign(campaignToDelete.client_id, campaignId);
    if (success) {
      fetchCampaigns();
    }
  };

  const filteredCampaigns = campaigns.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.clients?.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TFHubLayout>
      <div className="space-y-8 animate-fade-in text-left">
        
        {/* Cabeçalho */}
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Todas as Campanhas</h1>
          <p className="text-neutral-500 text-xs mt-1">
            Lista de todas as arrecadações criadas na plataforma
          </p>
        </div>

        {/* Busca */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-3.5 text-neutral-500" size={16} />
          <input
            type="text"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-3 pl-10 pr-4 text-xs font-medium text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
            placeholder="Pesquisar por nome de campanha ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white border-r-2"></div>
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
            <table className="w-full text-xs font-medium">
              <thead>
                <tr className="bg-neutral-900/60 border-b border-neutral-800 text-neutral-500 text-left">
                  <th className="p-4">Campanha</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Preço do Número</th>
                  <th className="p-4">Data de Criação</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-500">
                      Nenhuma campanha encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-neutral-800/20 text-neutral-300">
                      <td className="p-4 font-bold text-white">
                        {c.name}
                        <span className="block text-[10px] text-neutral-500">Share Code: {c.share_code}</span>
                      </td>
                      <td className="p-4 font-bold">@{c.clients?.username || 'N/A'}</td>
                      <td className="p-4">R$ {Number(c.price_per_number).toFixed(2)}</td>
                      <td className="p-4">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          c.status === 'active' ? 'bg-green-950 text-green-400' :
                          c.status === 'draft' ? 'bg-amber-950 text-amber-400' : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-4 text-right flex items-center justify-end gap-1.5">
                        <a
                          href={getCampaignUrl(c.share_code)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-xl transition-colors"
                          title="Visualizar Página Pública"
                        >
                          <LinkIcon size={14} />
                        </a>

                        <button
                          onClick={() => handleToggleStatus(c.id, c.status)}
                          className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold rounded-xl transition-colors"
                          title="Alterar Status"
                        >
                          Status
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-2 bg-neutral-800 hover:bg-red-950 text-neutral-500 hover:text-red-400 rounded-xl transition-colors"
                          title="Excluir Campanha permanentemente"
                        >
                          <Trash size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </TFHubLayout>
  );
}
