// ============================================================
// TF Arrecada+ | TFHubRoute
// Rota protegida exclusiva para administradores da TF Hub
// ============================================================

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface TFHubRouteProps {
  children: React.ReactNode;
}

export function TFHubRoute({ children }: TFHubRouteProps) {
  const { isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white border-r-2"></div>
      </div>
    );
  }

  // Redireciona para o login geral caso não seja admin
  if (!isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
