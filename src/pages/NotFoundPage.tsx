// ============================================================
// TF Arrecada+ | 404 Not Found Page
// ============================================================

import { useNavigate } from 'react-router-dom';
import { Home, SearchX } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Logo } from '../components/Logo';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Layout fullHeight>
      <div className="flex flex-col items-center justify-center flex-1 p-8 text-center animate-fade-in">
        <div className="mb-6">
          <SearchX size={64} className="text-neutral-300 mx-auto mb-4" />
          <Logo size="sm" className="mb-4" />
        </div>
        <h2 className="text-2xl font-display font-bold text-neutral-800 mb-2">
          Página não encontrada
        </h2>
        <p className="text-neutral-500 mb-8 max-w-sm">
          A campanha que você está procurando não existe ou foi removida.
        </p>
        <button onClick={() => navigate('/')} className="btn-primary">
          <Home size={16} />
          Voltar para o início
        </button>
      </div>
    </Layout>
  );
}
