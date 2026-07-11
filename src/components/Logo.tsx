// ============================================================
// TF Arrecada+ | Logo Component
// ============================================================

import { Zap } from 'lucide-react';
import { clsx } from 'clsx';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

const sizeMap = {
  sm:  { icon: 20, title: 'text-lg',  tag: 'text-xs' },
  md:  { icon: 28, title: 'text-2xl', tag: 'text-xs' },
  lg:  { icon: 40, title: 'text-4xl', tag: 'text-sm' },
  xl:  { icon: 52, title: 'text-5xl', tag: 'text-base' },
};

export function Logo({ size = 'md', showTagline = false, className }: LogoProps) {
  const s = sizeMap[size];

  return (
    <div className={clsx('flex flex-col items-center gap-2', className)}>
      {/* Ícone com gradiente */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-400 to-brand-700
                        rounded-2xl blur-lg opacity-40 scale-110" />
        <div className="relative bg-gradient-to-br from-brand-500 to-brand-700
                        rounded-2xl p-3 shadow-brand">
          <Zap
            size={s.icon}
            className="text-white"
            strokeWidth={2.5}
            fill="currentColor"
          />
        </div>
      </div>

      {/* Nome */}
      <div className="text-center">
        <h1 className={clsx('font-display font-bold leading-none', s.title)}>
          <span className="text-gradient">TF</span>
          <span className="text-neutral-800"> Arrecada</span>
          <span className="text-brand-500">+</span>
        </h1>
        {showTagline && (
          <p className={clsx('text-neutral-500 mt-1.5', s.tag)}>
            Campanhas numeradas de forma simples e elegante
          </p>
        )}
      </div>
    </div>
  );
}
