// ============================================================
// TF Arrecada+ | Onboarding Page
// Assistente de primeiro acesso em 5 etapas para novos clientes
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Copy, Sparkles } from 'lucide-react';
import { clientService } from '../services/clientService';
import { campaignService } from '../services/campaignService';
import { useAuth } from '../hooks/useAuth';
import { getCampaignUrl } from '../utils/format';
import { Layout } from '../components/Layout';


export function OnboardingPage() {
  const navigate = useNavigate();
  const { client, refreshSession } = useAuth();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createdCampaignCode, setCreatedCampaignCode] = useState('');

  // Etapa 1: Perfil
  const [nome, setNome] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [instagram, setInstagram] = useState('');

  // Etapa 2: PIX e Settings
  const [pixKey, setPixKey] = useState('');

  // Etapa 3: Organizadores
  const [orgName, setOrgName] = useState('');
  const [orgPhone, setOrgPhone] = useState('');

  // Etapa 4: Primeira Campanha
  const [campName, setCampName] = useState('');
  const [campDesc, setCampDesc] = useState('');
  const [campPrice, setCampPrice] = useState(10);
  const [campNumbers, setCampNumbers] = useState(100);

  const handleNext = async () => {
    if (!client) return;

    setIsLoading(true);
    try {
      if (step === 1) {
        // Salvar Perfil
        await clientService.updateProfile(client.id, {
          nome,
          empresa,
          telefone,
          cidade,
          estado,
          instagram,
        });
        setStep(2);
      } else if (step === 2) {
        // Salvar Settings (Chave PIX)
        await clientService.updateSettings(client.id, {
          pix_key: pixKey,
        });
        setStep(3);
      } else if (step === 3) {
        // Avançar (o organizador principal será criado junto com a campanha na etapa 4)
        setStep(4);
      } else if (step === 4) {
        // Criar primeira campanha
        const campaign = await campaignService.createCampaign(client.id, {
          name: campName,
          description: campDesc,
          price_per_number: Number(campPrice),
          total_numbers: Number(campNumbers),
          pix_key: pixKey,
          draw_type: 'after_all_sold',
          reservation_timeout_minutes: 30,
          organizers: [
            {
              name: orgName || nome || client.username,
              phone: orgPhone || telefone,
              whatsapp: orgPhone || telefone,
              role: 'Organizador Principal',
              is_primary: true,
            },
          ],
        });

        if (campaign) {
          setCreatedCampaignCode(campaign.share_code);
          setStep(5);
        } else {
          alert('Falha ao criar sua primeira campanha. Tente novamente.');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!client) return;
    setIsLoading(true);
    const success = await clientService.completeOnboarding(client.id);
    setIsLoading(false);

    if (success) {
      await refreshSession();
      navigate('/dashboard', { replace: true });
    }
  };

  const copyLink = () => {
    const link = getCampaignUrl(createdCampaignCode);
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout withDots fullHeight>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-xl mx-auto w-full select-none">
        
        {/* Barra de Progresso */}
        <div className="w-full flex items-center justify-between gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-primary' : 'bg-neutral-200'
              }`}
            />
          ))}
        </div>

        <div className="w-full card p-8 shadow-xl border border-neutral-100 bg-white rounded-3xl animate-fade-in space-y-6">
          
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-primary">PASSO 1 DE 5</span>
                <h2 className="text-xl font-display font-bold text-neutral-800">Dados da Organização</h2>
                <p className="text-xs text-neutral-400">Complete as informações para emissão e suporte</p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nome do Responsável *"
                  className="input-field"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Nome da Empresa / Instituição *"
                  className="input-field"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                />
                <input
                  type="tel"
                  placeholder="Telefone de Contato *"
                  className="input-field"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Cidade"
                    className="input-field"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Estado (UF)"
                    maxLength={2}
                    className="input-field uppercase"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Instagram (opcional)"
                  className="input-field"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-primary">PASSO 2 DE 5</span>
                <h2 className="text-xl font-display font-bold text-neutral-800">Cadastre seu PIX</h2>
                <p className="text-xs text-neutral-400">Para onde os participantes farão as transferências</p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-neutral-700">Chave PIX de Recebimento</label>
                <input
                  type="text"
                  placeholder="Ex: CNPJ, E-mail, Celular ou Chave Aleatória"
                  className="input-field"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                />
                <p className="text-xxs text-neutral-400 leading-relaxed">
                  As transferências são realizadas diretamente para a sua conta bancária sem intermediação de taxas.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-primary">PASSO 3 DE 5</span>
                <h2 className="text-xl font-display font-bold text-neutral-800">Cadastre os Organizadores</h2>
                <p className="text-xs text-neutral-400">Pessoas autorizadas a dar suporte e receber contatos</p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nome do Organizador Principal"
                  className="input-field"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
                <input
                  type="tel"
                  placeholder="Telefone (WhatsApp) do Organizador"
                  className="input-field"
                  value={orgPhone}
                  onChange={(e) => setOrgPhone(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-primary">PASSO 4 DE 5</span>
                <h2 className="text-xl font-display font-bold text-neutral-800">Crie sua Primeira Campanha</h2>
                <p className="text-xs text-neutral-400">Inicie as arrecadações agora mesmo</p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Título da Campanha *"
                  className="input-field"
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                />
                <textarea
                  placeholder="Descrição da Campanha *"
                  rows={2}
                  className="input-field resize-none"
                  value={campDesc}
                  onChange={(e) => setCampDesc(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xxs font-bold text-neutral-500 mb-1">PREÇO DO NÚMERO (R$)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={campPrice}
                      onChange={(e) => setCampPrice(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xxs font-bold text-neutral-500 mb-1">TOTAL DE NÚMEROS</label>
                    <select
                      className="input-field"
                      value={campNumbers}
                      onChange={(e) => setCampNumbers(Number(e.target.value))}
                    >
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={200}>200</option>
                      <option value={500}>500</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full border border-green-100">
                <Sparkles size={32} className="text-green-500" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-display font-bold text-neutral-800">
                  🎉 Sua campanha está pronta!
                </h2>
                <p className="text-sm text-neutral-500 max-w-sm mx-auto leading-relaxed">
                  Agora basta compartilhar o link e acompanhar tudo em tempo real pelo painel.
                </p>
              </div>

              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-neutral-600 truncate">
                  {getCampaignUrl(createdCampaignCode)}
                </span>
                <button
                  onClick={copyLink}
                  className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
          )}

          {/* Navegação */}
          <div className="flex items-center justify-between pt-6 border-t border-neutral-100">
            {step > 1 && step < 5 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="text-xs font-bold text-neutral-400 hover:text-neutral-600 flex items-center gap-1 transition-colors"
                disabled={isLoading}
              >
                <ArrowLeft size={14} /> Voltar
              </button>
            ) : (
              <span />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="py-3 px-6 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-md"
                disabled={isLoading}
              >
                {isLoading ? 'Salvando...' : 'Avançar'}
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-2xl text-sm transition-all shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? 'Finalizando...' : 'Ir para o meu Painel'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
