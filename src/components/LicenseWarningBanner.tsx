// ============================================================
// TF Arrecada+ | LicenseWarningBanner
// Exibe alertas elegantes de expiração de licença (7, 3, 1 dias)
// ============================================================

import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { useLicenseWarning } from '../hooks/useLicenseWarning';

export function LicenseWarningBanner() {
  const { shouldShow, daysLeft, severity } = useLicenseWarning();

  if (!shouldShow) return null;

  const instagramUrl = 'https://www.instagram.com/tfhub.design?igsh=MXM4ZXdndjZkdGxxbQ==';

  const configs = {
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="text-blue-500" size={18} />,
      message: `Sua licença expira em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}. Garanta a continuidade de suas campanhas.`,
      btn: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <AlertTriangle className="text-amber-500" size={18} />,
      message: `Atenção: Restam apenas ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'} de licença ativa! Evite o bloqueio automático de suas campanhas.`,
      btn: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    danger: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800 animate-pulse',
      icon: <ShieldAlert className="text-rose-500" size={18} />,
      message: `Urgente: Sua licença expira amanhã! Renove agora mesmo para evitar a desativação imediata.`,
      btn: 'bg-rose-600 hover:bg-rose-700 text-white',
    },
    expired: {
      bg: 'bg-red-100 border-red-300 text-red-900',
      icon: <ShieldAlert className="text-red-600" size={18} />,
      message: `Licença Expirada! Suas campanhas foram pausadas. Entre em contato com a TF Hub.`,
      btn: 'bg-red-700 hover:bg-red-800 text-white',
    },
  };

  const current = configs[severity];

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border rounded-2xl mb-6 shadow-sm ${current.bg}`}>
      <div className="flex items-center gap-3">
        {current.icon}
        <span className="text-sm font-medium">{current.message}</span>
      </div>
      <a
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-sm shrink-0 whitespace-nowrap ${current.btn}`}
      >
        Renovar Licença
      </a>
    </div>
  );
}
