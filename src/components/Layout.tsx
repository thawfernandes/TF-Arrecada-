// ============================================================
// TF Arrecada+ | Layout Component
// Layout base de todas as páginas
// ============================================================

import type { ReactNode } from 'react';
import { Footer } from './Footer';
import { clsx } from 'clsx';

interface LayoutProps {
  children: ReactNode;
  className?: string;
  withDots?: boolean;
  fullHeight?: boolean;
  footerText?: string;
}

export function Layout({ children, className, withDots = false, fullHeight = false, footerText }: LayoutProps) {
  return (
    <div
      className={clsx(
        'min-h-dvh flex flex-col',
        withDots && 'bg-dots',
        !withDots && 'bg-neutral-50',
      )}
    >
      <main className={clsx('flex-1 flex flex-col', fullHeight && 'min-h-[calc(100dvh-88px)]', className)}>
        {children}
      </main>
      <Footer customText={footerText} />
    </div>
  );
}
