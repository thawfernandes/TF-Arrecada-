// ============================================================
// TF Arrecada+ | ProtectedRoute
// Rota protegida para clientes autenticados com licença válida
// ============================================================

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, client, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary border-r-2"></div>
      </div>
    );
  }

  // Se não estiver logado como cliente
  if (!isAuthenticated || !client) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se a licença estiver expirada ou bloqueada, redirecionar para tela correspondente
  if (client.license_status === 'expired' || client.license_status === 'blocked') {
    if (location.pathname !== '/licenca-expirada') {
      return <Navigate to="/licenca-expirada" replace />;
    }
  }

  // Se o onboarding não foi concluído e não estamos na página de onboarding
  if (!client.onboarding_completed && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Se onboarding já foi concluído e tentamos entrar na página de onboarding
  if (client.onboarding_completed && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
