// ============================================================
// TF Arrecada+ | TFHubLayout
// Layout com sidebar exclusivo para o painel de administração TF Hub
// ============================================================

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from '../../components/Logo';

interface TFHubLayoutProps {
  children: React.ReactNode;
}

export function TFHubLayout({ children }: TFHubLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout } = useAuth();

  const handleLogout = async () => {
    if (admin) {
      await logout();
    }
    navigate('/login');
  };

  const navItems = [
    { path: '/tfhub', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { path: '/tfhub/clientes', label: 'Clientes', icon: <Users size={18} /> },
    { path: '/tfhub/licencas', label: 'Licenças', icon: <ShieldCheck size={18} /> },
    { path: '/tfhub/campanhas', label: 'Campanhas', icon: <Calendar size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row select-none font-sans">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-neutral-900 border-b md:border-b-0 md:border-r border-neutral-800 flex flex-col justify-between p-6 shrink-0">
        <div className="space-y-8">
          
          {/* Logo */}
          <div className="flex items-center justify-between">
            <Logo size="sm" className="brightness-200" />
            <span className="text-[10px] font-bold bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
              ADMIN
            </span>
          </div>

          {/* Navegação */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-neutral-800 text-white shadow-inner'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Info do Admin e Logout */}
        <div className="mt-8 pt-6 border-t border-neutral-800 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{admin?.name || 'Administrador'}</p>
            <span className="text-xxs text-neutral-500 capitalize">{admin?.role || 'Moderador'}</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2.5 text-neutral-500 hover:text-red-400 rounded-xl hover:bg-neutral-800/60 transition-colors"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  );
}
