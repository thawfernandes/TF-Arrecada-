// ============================================================
// TF Arrecada+ | Hook useLicenseWarning
// Calcula prazos de expiração de licença e níveis de severidade
// ============================================================

import { useAuth } from './useAuth';

export interface LicenseWarning {
  shouldShow: boolean;
  daysLeft: number;
  severity: 'info' | 'warning' | 'danger' | 'expired';
}

export function useLicenseWarning(): LicenseWarning {
  const { client } = useAuth();

  if (!client || !client.expires_at) {
    return { shouldShow: false, daysLeft: 0, severity: 'info' };
  }

  const nowMs = Date.now();
  const expiresMs = new Date(client.expires_at).getTime();
  const diffMs = expiresMs - nowMs;
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (client.license_status === 'expired' || diffMs <= 0) {
    return { shouldShow: true, daysLeft: 0, severity: 'expired' };
  }

  if (client.status === 'blocked' || client.license_status === 'blocked') {
    return { shouldShow: true, daysLeft: 0, severity: 'expired' };
  }

  // Se restarem 7 dias ou menos, exibir alerta
  if (daysLeft <= 7) {
    let severity: 'info' | 'warning' | 'danger' = 'info';
    if (daysLeft <= 1) {
      severity = 'danger';
    } else if (daysLeft <= 3) {
      severity = 'warning';
    }

    return {
      shouldShow: true,
      daysLeft,
      severity,
    };
  }

  return {
    shouldShow: false,
    daysLeft,
    severity: 'info',
  };
}
