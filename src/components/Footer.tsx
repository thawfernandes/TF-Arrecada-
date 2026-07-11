// ============================================================
// TF Arrecada+ | Footer Component
// Assinatura discreta, minimalista e premium da TF Hub
// ============================================================

interface FooterProps {
  customText?: string;
}

export function Footer({ customText }: FooterProps) {
  return (
    <footer className="py-8 flex flex-col items-center justify-center gap-2 select-none animate-fade-in">
      {customText && (
        <p className="text-[11px] text-neutral-400/80 font-sans tracking-wide max-w-md text-center px-4 mb-1">
          {customText}
        </p>
      )}
      <a
        href="https://www.instagram.com/tfhub.design?igsh=MXM4ZXdndjZkdGxxbQ=="
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-600 font-sans tracking-wide transition-all duration-300 transform hover:scale-[1.02]"
        aria-label="Produzido pela TF"
      >
        <span className="text-brand-500 animate-pulse">⚡</span>
        <span>Produzido pela</span>
        <span className="font-bold text-neutral-500 hover:text-neutral-800">TF</span>
      </a>
    </footer>
  );
}
