// ============================================================
// TF Arrecada+ | TFHubDashboardPage
// Dashboard expandido de estatísticas globais para a TF Hub
// ============================================================

import { useState, useEffect } from 'react';
import {
  Users, Calendar, DollarSign, Clock
} from 'lucide-react';
import { tfhubService } from '../../services/tfhubService';
import { TFHubLayout } from './TFHubLayout';
import { formatCurrency } from '../../utils/format';

export function TFHubDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await tfhubService.getDashboardStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <TFHubLayout>
      <div className="space-y-8 animate-fade-in text-left">
        
        {/* Cabeçalho */}
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Dashboard Global</h1>
          <p className="text-neutral-500 text-xs mt-1">
            Visão geral da saúde comercial e operacional do TF Arrecada+
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white border-r-2"></div>
          </div>
        ) : (
          <>
            {/* Metricas Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={<Users className="text-blue-400" />}
                title="Clientes Ativos"
                value={stats.clientsActive}
                subtext={`${stats.clientsBlocked} bloqueados`}
              />
              <StatCard
                icon={<Clock className="text-amber-400 animate-pulse" />}
                title="Licenças Expirando"
                value={stats.licensesExpiring}
                subtext="Expiram nos próximos 7 dias"
              />
              <StatCard
                icon={<Calendar className="text-emerald-400" />}
                title="Campanhas Ativas"
                value={stats.campaignsActive}
                subtext={`${stats.campaignsFinished} encerradas`}
              />
              <StatCard
                icon={<DollarSign className="text-purple-400" />}
                title="Valor Movimentado"
                value={formatCurrency(stats.totalValueMoved)}
                subtext={`${stats.totalNumbersSold} números vendidos`}
              />
            </div>

            {/* Listas e Tabelas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Últimos Clientes */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-white">Últimos Clientes Cadastrados</h3>
                <div className="divide-y divide-neutral-800">
                  {stats.lastClients.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between py-3">
                      <div>
                        <span className="text-xs font-bold text-white block">@{c.username}</span>
                        <span className="text-xxs text-neutral-500">{c.company}</span>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          c.status === 'active' ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'
                        }`}>
                          {c.status}
                        </span>
                        <span className="text-xxs text-neutral-500 block mt-1">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Últimas Campanhas */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-white">Últimas Campanhas Criadas</h3>
                <div className="divide-y divide-neutral-800">
                  {stats.lastCampaigns.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between py-3">
                      <div>
                        <span className="text-xs font-bold text-white block line-clamp-1">{c.name}</span>
                        <span className="text-xxs text-neutral-500">por @{c.clients?.username}</span>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          c.status === 'active' ? 'bg-green-950 text-green-400' :
                          c.status === 'draft' ? 'bg-amber-950 text-amber-400' : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {c.status}
                        </span>
                        <span className="text-xxs text-neutral-500 block mt-1">
                          R$ {Number(c.price_per_number).toFixed(2)} / n°
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </>
        )}

      </div>
    </TFHubLayout>
  );
}

// ─── Sub-componente de Card ──────────────────────────────────
function StatCard({
  icon, title, value, subtext
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtext: string;
}) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-3 shadow-xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{title}</span>
        <div className="w-8 h-8 rounded-xl bg-neutral-800 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white">{value}</h2>
        <span className="text-[10px] text-neutral-500 font-medium">{subtext}</span>
      </div>
    </div>
  );
}
