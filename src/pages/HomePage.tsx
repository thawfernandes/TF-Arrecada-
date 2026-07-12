// ============================================================
// TF Arrecada+ | Home Page
// Interface Premium, Minimalista e Exclusiva para Clientes TF Hub
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Key, Sparkles, MessageSquare } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { useAuth } from '../hooks/useAuth';

export function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, client, isLoading } = useAuth();
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && client) {
      if (client.license_status === 'expired' || client.license_status === 'blocked') {
        navigate('/licenca-expirada', { replace: true });
      } else if (!client.onboarding_completed) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, client, navigate]);

  const instagramUrl = 'https://www.instagram.com/tfhub.design?igsh=MXM4ZXdndjZkdGxxbQ==';

  const handleRequestAccess = () => {
    setIsAccessModalOpen(true);
  };

  const handleConfirmRedirect = () => {
    window.open(instagramUrl, '_blank', 'noopener,noreferrer');
    setIsAccessModalOpen(false);
  };

  return (
    <Layout withDots fullHeight>
      {/* ─── Hero Minimalista ─── */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center select-none max-w-lg mx-auto">
        <div className="animate-fade-in mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-brand-200 bg-brand-50/50 rounded-full text-xs font-bold text-brand-600 mb-6 tracking-wide">
            <Sparkles size={12} className="animate-pulse" />
            <span>EXCLUSIVO PARA CLIENTES TF HUB</span>
          </div>
          <Logo size="xl" showTagline className="mb-2" />
        </div>

        {/* ─── Botões Centrais ─── */}
        <div className="w-full flex flex-col gap-3.5 animate-slide-up mt-6" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={handleRequestAccess}
            className="w-full py-4 px-6 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 hover:border-neutral-300 font-bold rounded-2xl transition-all duration-300 shadow-sm flex items-center justify-center gap-2.5 group transform hover:scale-[1.01]"
          >
            <span className="text-lg">🚀</span>
            Quero meu acesso
            <ArrowRight size={18} className="text-neutral-400 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 px-6 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2.5 group transform hover:scale-[1.01]"
          >
            <Key size={18} className="text-neutral-300 group-hover:rotate-12 transition-transform" />
            Já tenho acesso
          </button>
        </div>

        <p className="text-xs text-neutral-400 font-medium mt-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Gestão de rifas e arrecadações de alta performance.
        </p>
      </section>

      {/* ─── Modal Quero Meu Acesso ─── */}
      <Modal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        title="Adquirir sua Licença"
        size="sm"
      >
        <div className="text-center space-y-5">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-50 rounded-full">
            <MessageSquare size={32} className="text-brand-500" />
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-neutral-800 text-lg">Seja bem-vindo ao TF Arrecada+</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Para obter sua licença exclusiva de utilização e criar suas próprias campanhas, entre em contato com nossa equipe de design e tecnologia no Instagram da <strong>TF Hub</strong>.
            </p>
          </div>

          <button
            onClick={handleConfirmRedirect}
            className="w-full py-3.5 px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-md transition-all duration-300 flex items-center justify-center gap-2"
          >
            Falar com a TF Hub
            <ArrowRight size={16} />
          </button>
        </div>
      </Modal>
    </Layout>
  );
}
