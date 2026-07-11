// ============================================================
// TF Arrecada+ | TFHubClientsPage
// Gerenciamento completo de clientes, licenças e credenciais
// ============================================================

import { useState, useEffect } from 'react';
import {
  Plus, Search, ShieldAlert, ShieldCheck, Trash, RefreshCw, Key
} from 'lucide-react';
import { tfhubService } from '../../services/tfhubService';
import { TFHubLayout } from './TFHubLayout';
import { Modal } from '../../components/Modal';

export function TFHubClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Estados de criação de cliente
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDays, setNewDays] = useState(30);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;

    try {
      const res = await tfhubService.createClient(
        newUsername.toLowerCase().trim(),
        newPassword,
        newName,
        newCompany,
        newPhone,
        newDays
      );

      if (res.success) {
        setIsCreateOpen(false);
        // Reset
        setNewUsername('');
        setNewPassword('');
        setNewName('');
        setNewCompany('');
        setNewPhone('');
        setNewDays(30);
        fetchClients();
      } else {
        alert(`Erro ao cadastrar cliente: ${res.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro inesperado.');
    }
  };

  const handleRenew = async (clientId: string) => {
    const confirm = window.confirm('Deseja renovar a licença deste cliente por mais 30 dias?');
    if (!confirm) return;

    const res = await tfhubService.renewLicense(clientId, 30);
    if (res.success) {
      fetchClients();
    } else {
      alert('Falha ao renovar licença.');
    }
  };

  const handleToggleBlock = async (clientId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'blocked' : 'active';
    const confirm = window.confirm(
      `Deseja realmente ${nextStatus === 'blocked' ? 'BLOQUEAR' : 'DESBLOQUEAR'} este cliente?`
    );
    if (!confirm) return;

    const success = await tfhubService.updateClientStatus(clientId, nextStatus);
    if (success) {
      fetchClients();
    }
  };

  const handleDelete = async (clientId: string) => {
    const confirm = window.confirm(
      'CUIDADO: Esta ação excluirá permanentemente este cliente e todas as suas campanhas de forma irreversível. Continuar?'
    );
    if (!confirm) return;

    const success = await tfhubService.deleteClient(clientId);
    if (success) {
      fetchClients();
    }
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  const filteredClients = clients.filter(
    (c) =>
      c.username.toLowerCase().includes(search.toLowerCase()) ||
      c.profiles?.nome?.toLowerCase().includes(search.toLowerCase()) ||
      c.profiles?.empresa?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TFHubLayout>
      <div className="space-y-8 animate-fade-in text-left">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Gerenciar Clientes</h1>
            <p className="text-neutral-500 text-xs mt-1">
              Cadastre usuários, gerencie senhas, renove licenças e suspenda acessos
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="py-2.5 px-4 bg-white hover:bg-neutral-200 text-neutral-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg"
          >
            <Plus size={14} />
            Cadastrar Cliente
          </button>
        </div>

        {/* Busca */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-3.5 text-neutral-500" size={16} />
          <input
            type="text"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-3 pl-10 pr-4 text-xs font-medium text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
            placeholder="Pesquisar por usuário, empresa ou responsável..."
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
                  <th className="p-4">Usuário</th>
                  <th className="p-4">Empresa</th>
                  <th className="p-4">Contato</th>
                  <th className="p-4">Expiração</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-500">
                      Nenhum cliente cadastrado ou encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((c) => {
                    const isExpired = new Date(c.expires_at).getTime() < Date.now();
                    return (
                      <tr key={c.id} className="hover:bg-neutral-800/20 text-neutral-300">
                        <td className="p-4 font-bold text-white">@{c.username}</td>
                        <td className="p-4">
                          <span className="block font-bold text-white">{c.profiles?.empresa || 'N/A'}</span>
                          <span className="text-[10px] text-neutral-500">{c.profiles?.nome || 'N/A'}</span>
                        </td>
                        <td className="p-4">{c.profiles?.telefone || 'N/A'}</td>
                        <td className="p-4">
                          <span className={`block font-bold ${isExpired ? 'text-red-400' : 'text-neutral-300'}`}>
                            {new Date(c.expires_at).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-neutral-500">Licença de 30 dias</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            c.status === 'blocked' ? 'bg-red-950 text-red-400' :
                            isExpired ? 'bg-amber-950 text-amber-400 animate-pulse' : 'bg-green-950 text-green-400'
                          }`}>
                            {c.status === 'blocked' ? 'Bloqueado' : isExpired ? 'Expirada' : 'Ativo'}
                          </span>
                        </td>
                        <td className="p-4 text-right flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRenew(c.id)}
                            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-green-400 rounded-xl transition-colors"
                            title="Renovar Licença (30 dias)"
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleBlock(c.id, c.status)}
                            className={`p-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors ${
                              c.status === 'blocked' ? 'text-green-400' : 'text-amber-400'
                            }`}
                            title={c.status === 'blocked' ? 'Desbloquear Acesso' : 'Bloquear Acesso'}
                          >
                            {c.status === 'blocked' ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-2 bg-neutral-800 hover:bg-red-950 text-neutral-500 hover:text-red-400 rounded-xl transition-colors"
                            title="Excluir Cliente Permanentemente"
                          >
                            <Trash size={14} />
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

      {/* Modal Criar Cliente */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Cadastrar Novo Cliente">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Nome de Usuário (Username)</label>
            <input
              type="text"
              required
              placeholder="Ex: rifasvalinhos (sem espaços)"
              className="input-field bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus:border-neutral-700"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-neutral-400">Senha Provisória</label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-[10px] font-bold text-neutral-400 hover:text-white"
              >
                Gerar Senha Forte
              </button>
            </div>
            <div className="relative">
              <Key className="absolute left-3 top-3 text-neutral-600" size={16} />
              <input
                type="text"
                required
                placeholder="Senha de acesso"
                className="input-field pl-10 bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus:border-neutral-700"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Nome do Responsável</label>
            <input
              type="text"
              required
              placeholder="Ex: João da Silva"
              className="input-field bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus:border-neutral-700"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Empresa / Instituição</label>
            <input
              type="text"
              required
              placeholder="Ex: Paróquia São Sebastião"
              className="input-field bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus:border-neutral-700"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Telefone (DDD + Número)</label>
            <input
              type="tel"
              required
              placeholder="Ex: 11999999999"
              className="input-field bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus:border-neutral-700"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Período Inicial da Licença (dias)</label>
            <select
              className="input-field bg-neutral-900 border-neutral-800 text-white focus:border-neutral-700"
              value={newDays}
              onChange={(e) => setNewDays(Number(e.target.value))}
            >
              <option value={30}>30 dias</option>
              <option value={60}>60 dias</option>
              <option value={90}>90 dias</option>
              <option value={365}>1 ano (365 dias)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-white text-neutral-900 hover:bg-neutral-200 rounded-xl text-xs font-bold shadow-md"
            >
              Salvar Cliente
            </button>
          </div>
        </form>
      </Modal>
    </TFHubLayout>
  );
}
