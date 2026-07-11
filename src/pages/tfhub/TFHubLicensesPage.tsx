// ============================================================
// TF Arrecada+ | TFHubLicensesPage
// Gestão de licenças, alertas de expiração e renovação rápida
// ============================================================

import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';
import { tfhubService } from '../../services/tfhubService';
import { TFHubLayout } from './TFHubLayout';

export function TFHubLicensesPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'expiring'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await tfhubService.getAllClients();
      setClients(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleRenew = async (clientId: string) => {
    const confirm = window.confirm('Deseja renovar esta licença por 30 dias adicionais?');
    if (!confirm) return;

    const res = await tfhubService.renewLicense(clientId, 30);
    if (res.success) {
      fetchClients();
    } else {
      alert('Erro ao renovar a licença.');
    }
  };

  const filteredClients = clients.filter((c) => {
    const isExpired = new Date(c.expires_at).getTime() < Date.now();
    const nowMs = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const isExpiring = !isExpired && (new Date(c.expires_at).getTime() - nowMs) <= sevenDaysMs;

    if (filter === 'active') return !isExpired && c.status === 'active';
    if (filter === 'expired') return isExpired || c.license_status === 'expired';
    if (filter === 'expiring') return isExpiring;
    return true;
  });

  return (
    <TFHubLayout>
      <div className="space-y-8 animate-fade-in text-left">
        
        {/* Cabeçalho */}
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Controle de Licenças</h1>
          <p className="text-neutral-500 text-xs mt-1">
            Monitore a validade do acesso de todos os clientes licenciados
          </p>
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          {(['all', 'active', 'expired', 'expiring'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                filter === type
                  ? 'bg-white text-neutral-900 shadow-lg'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {type === 'all' ? 'Todas' : type === 'active' ? 'Ativas' : type === 'expired' ? 'Expiradas' : 'Expirando em Breve'}
            </button>
          ))}
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
                  <th className="p-4">Organização</th>
                  <th className="p-4">Responsável</th>
                  <th className="p-4">Validade</th>
                  <th className="p-4">Dias Restantes</th>
                  <th className="p-4">Situação</th>
                  <th className="p-4 text-right">Renovação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-500">
                      Nenhuma licença correspondente ao filtro.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((c) => {
                    const isExpired = new Date(c.expires_at).getTime() < Date.now();
                    const nowMs = Date.now();
                    const diffMs = new Date(c.expires_at).getTime() - nowMs;
                    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

                    return (
                      <tr key={c.id} className="hover:bg-neutral-800/20 text-neutral-300">
                        <td className="p-4 font-bold text-white">
                          {c.profiles?.empresa || 'N/A'}
                          <span className="block text-[10px] text-neutral-500">@{c.username}</span>
                        </td>
                        <td className="p-4">{c.profiles?.nome || 'N/A'}</td>
                        <td className="p-4">{new Date(c.expires_at).toLocaleDateString()}</td>
                        <td className="p-4 font-bold">
                          {isExpired ? (
                            <span className="text-red-400">Expirado</span>
                          ) : (
                            <span className={daysLeft <= 7 ? 'text-amber-400 animate-pulse' : 'text-neutral-300'}>
                              {daysLeft} dias
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit ${
                            isExpired ? 'bg-red-950 text-red-400 border border-red-900' :
                            daysLeft <= 7 ? 'bg-amber-950 text-amber-400 border border-amber-900 animate-pulse' :
                            'bg-green-950 text-green-400 border border-green-900'
                          }`}>
                            {isExpired ? <ShieldAlert size={10} /> : <ShieldCheck size={10} />}
                            {isExpired ? 'Expirada' : daysLeft <= 7 ? 'Crítica' : 'Segura'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleRenew(c.id)}
                            className="py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-green-400 rounded-xl transition-all font-bold text-[10px] flex items-center gap-1 ml-auto"
                          >
                            <RefreshCw size={10} />
                            Renovar 30d
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </TFHubLayout>
  );
}
