// ============================================================
// TF Arrecada+ | Login Page
// Tela de login utilizando apenas Usuário e Senha (sem e-mail)
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Logo } from '../components/Logo';
import { Layout } from '../components/Layout';

export function LoginPage() {
  const navigate = useNavigate();
  const { loginClient, loginAdmin } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      if (isAdminLogin) {
        const res = await loginAdmin(username, password);
        if (res.success) {
          navigate('/tfhub', { replace: true });
        } else {
          handleAuthError(res.error);
        }
      } else {
        const res = await loginClient(username, password);
        if (res.success) {
          navigate('/dashboard', { replace: true });
        } else {
          handleAuthError(res.error);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro de conexão com o servidor. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthError = (error?: string) => {
    switch (error) {
      case 'user_not_found':
      case 'admin_not_found':
        setErrorMsg('Usuário não encontrado. Verifique a grafia.');
        break;
      case 'invalid_password':
        setErrorMsg('Senha incorreta. Tente novamente.');
        break;
      case 'account_blocked':
      case 'license_blocked':
        setErrorMsg('Esta conta está temporariamente bloqueada. Entre em contato com o suporte.');
        break;
      case 'license_expired':
        navigate('/licenca-expirada');
        break;
      case 'account_inactive':
        setErrorMsg('Sua conta ainda não foi ativada.');
        break;
      default:
        setErrorMsg('Erro ao tentar logar. Verifique suas credenciais.');
    }
  };

  return (
    <Layout withDots fullHeight>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto w-full select-none">
        
        {/* Botão de Voltar */}
        <button
          onClick={() => navigate('/')}
          className="self-start text-neutral-400 hover:text-neutral-600 flex items-center gap-1.5 text-xs font-semibold mb-8 group transition-colors"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Voltar ao início
        </button>

        <div className="w-full card p-8 shadow-xl border border-neutral-100/80 bg-white rounded-3xl animate-fade-in">
          <div className="text-center mb-8">
            <Logo size="md" className="mb-2" />
            <h2 className="text-xl font-display font-bold text-neutral-800">
              {isAdminLogin ? 'Painel Administrativo TF Hub' : 'Acesse sua Conta'}
            </h2>
            <p className="text-xs text-neutral-400 mt-1 font-medium">
              Entre com seu usuário e senha de cliente
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-800 rounded-2xl flex items-start gap-2.5 text-xs font-medium animate-shake">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Nome de Usuário
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-neutral-400" size={16} />
                <input
                  type="text"
                  required
                  placeholder="Ex: igrejaesperanca"
                  className="input-field pl-10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Senha de Acesso
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-3 text-neutral-400" size={16} />
                <input
                  type="password"
                  required
                  placeholder="Sua senha secreta"
                  className="input-field pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-2xl transition-all duration-300 shadow-md flex items-center justify-center gap-2 mt-6 text-sm transform hover:scale-[1.01]"
              disabled={isLoading}
            >
              {isLoading ? 'Autenticando...' : 'Entrar no Painel'}
            </button>
          </form>

          {/* Alternar login Admin / Cliente */}
          <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
            <button
              onClick={() => {
                setIsAdminLogin(!isAdminLogin);
                setErrorMsg('');
              }}
              className="text-xs font-bold text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              {isAdminLogin ? 'Entrar como Cliente' : 'Acesso TF Hub Admin'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
