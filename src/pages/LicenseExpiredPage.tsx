// ============================================================
// TF Arrecada+ | LicenseExpiredPage
// Tela elegante de bloqueio por expiração de licença
// ============================================================

import { ShieldAlert, ArrowRight, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Logo } from '../components/Logo';
import { Layout } from '../components/Layout';

export function LicenseExpiredPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const instagramUrl = 'https://www.instagram.com/tfhub.design?igsh=MXM4ZXdndjZkdGxxbQ==';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Layout withDots fullHeight>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto w-full select-none text-center animate-fade-in">
        
        <div className="card p-8 shadow-xl border border-red-100 bg-white rounded-3xl space-y-6">
          
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full border border-red-100">
            <ShieldAlert size={32} className="text-red-500" />
          </div>

          <div className="space-y-2">
            <Logo size="sm" className="mx-auto mb-2" />
            <h2 className="text-xl font-display font-bold text-neutral-800">
              Sua licença expirou
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed">
              O período contratado para a sua licença de 30 dias chegou ao fim. Para restabelecer o acesso ao painel e reativar suas campanhas, entre em contato com a equipe da <strong>TF Hub</strong>.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-md transition-all duration-300 flex items-center justify-center gap-2 text-sm transform hover:scale-[1.01]"
            >
              Falar com a TF Hub
              <ArrowRight size={16} />
            </a>

            <button
              onClick={handleLogout}
              className="w-full py-3.5 px-6 bg-white hover:bg-neutral-50 text-neutral-500 hover:text-neutral-700 font-semibold border border-neutral-200 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 text-xs"
            >
              <LogOut size={14} />
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
