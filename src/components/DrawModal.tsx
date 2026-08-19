// ============================================================
// TF Arrecada+ | DrawModal
// Sorteio animado — contagem regressiva 3, 2, 1 + revelação
// Usa setInterval direto no startDraw (sem useEffect p/ contar)
// ============================================================

import { useState, useRef } from 'react';
import { Trophy, X, RotateCcw, Sparkles, Dices } from 'lucide-react';

interface DrawWinner {
  number: number;
  name: string;
  phone: string;
  city?: string;
}

interface DrawableNumber {
  number: number;
  buyer?: { name: string; phone: string; city?: string };
}

interface DrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  paidNumbers: DrawableNumber[];
  campaignName?: string;
}

type DrawPhase = 'idle' | 'counting' | 'reveal';

export function DrawModal({ isOpen, onClose, paidNumbers, campaignName }: DrawModalProps) {
  const [phase, setPhase]           = useState<DrawPhase>('idle');
  const [countdown, setCountdown]   = useState(3);
  const [winner, setWinner]         = useState<DrawWinner | null>(null);
  const [shuffleNum, setShuffleNum] = useState<number | null>(null);

  // Refs para gerenciar os intervalos sem depender do React
  const shuffleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const paidEligible = paidNumbers.filter((n) => n.buyer?.name);

  const clearIntervals = () => {
    if (shuffleRef.current) { clearInterval(shuffleRef.current); shuffleRef.current = null; }
    if (countRef.current)   { clearInterval(countRef.current);   countRef.current   = null; }
  };

  const startDraw = () => {
    const eligible = paidNumbers.filter((n) => n.buyer?.name);
    if (eligible.length === 0) return;

    clearIntervals();
    setWinner(null);
    setShuffleNum(null);
    setCountdown(3);
    setPhase('counting');

    // ── Shuffle rápido de números (visuals) ──
    shuffleRef.current = setInterval(() => {
      const rnd = eligible[Math.floor(Math.random() * eligible.length)];
      setShuffleNum(rnd?.number ?? null);
    }, 90);

    // ── Contagem regressiva independente (JS puro, sem useEffect) ──
    let remaining = 3;
    countRef.current = setInterval(() => {
      remaining -= 1;

      if (remaining > 0) {
        // Próximo dígito
        setCountdown(remaining);
      } else {
        // Acabou: limpa tudo e revela o vencedor
        clearIntervals();
        const picked = eligible[Math.floor(Math.random() * eligible.length)];
        setWinner({
          number: picked.number,
          name:   picked.buyer!.name,
          phone:  picked.buyer!.phone,
          city:   picked.buyer?.city,
        });
        setShuffleNum(null);
        setPhase('reveal');
      }
    }, 1000);
  };

  const reset = () => {
    clearIntervals();
    setPhase('idle');
    setCountdown(3);
    setWinner(null);
    setShuffleNum(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm mx-4">

        {/* Fechar — bloqueado durante contagem */}
        {phase !== 'counting' && (
          <button
            onClick={handleClose}
            className="absolute -top-10 right-0 text-white/50 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X size={22} />
          </button>
        )}

        <div className="bg-neutral-950 rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl">

          {/* ── Cabeçalho ───────────────────────────────── */}
          <div
            className="p-5 text-center"
            style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #831843 100%)' }}
          >
            <Trophy size={28} className="text-yellow-400 mx-auto mb-1.5" />
            <h2 className="text-white font-bold text-base leading-tight">
              {campaignName ? `Sorteio: ${campaignName}` : 'Sorteio da Rifa'}
            </h2>
            <p className="text-white/50 text-[11px] mt-0.5">
              {paidEligible.length} número{paidEligible.length !== 1 ? 's' : ''} elegível{paidEligible.length !== 1 ? 'is' : ''}
            </p>
          </div>

          {/* ── Corpo ───────────────────────────────────── */}
          <div className="p-8 text-center min-h-[220px] flex flex-col items-center justify-center">

            {/* IDLE */}
            {phase === 'idle' && (
              <div className="space-y-5 w-full">
                {paidEligible.length === 0 ? (
                  <p className="text-neutral-500 text-sm">
                    Nenhum número pago ainda.<br />
                    <span className="text-neutral-600 text-xs">
                      Confirme pagamentos para habilitar o sorteio.
                    </span>
                  </p>
                ) : (
                  <>
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      Serão elegíveis os{' '}
                      <strong className="text-white">{paidEligible.length}</strong>{' '}
                      números pagos.
                    </p>
                    <button
                      onClick={startDraw}
                      className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
                        boxShadow: '0 0 30px rgba(124,58,237,0.4)',
                      }}
                    >
                      <Dices size={20} />
                      Sortear Agora!
                    </button>
                  </>
                )}
              </div>
            )}

            {/* CONTAGEM */}
            {phase === 'counting' && (
              <div className="space-y-3">
                <div
                  key={countdown}
                  className="text-[96px] font-black text-white leading-none select-none animate-bounce"
                  style={{ textShadow: '0 0 60px rgba(168,85,247,0.9)' }}
                >
                  {countdown}
                </div>
                {shuffleNum !== null && (
                  <div
                    className="text-2xl font-bold text-purple-400 tabular-nums"
                    style={{ textShadow: '0 0 20px rgba(168,85,247,0.7)' }}
                  >
                    #{String(shuffleNum).padStart(3, '0')}
                  </div>
                )}
                <p className="text-neutral-500 text-xs tracking-wider uppercase">
                  Sorteando…
                </p>
              </div>
            )}

            {/* REVELAÇÃO */}
            {phase === 'reveal' && winner && (
              <div className="w-full space-y-5 animate-fade-in">
                <div className="text-5xl">🎉</div>

                <div
                  className="rounded-2xl p-5 space-y-3 border"
                  style={{
                    background: 'linear-gradient(135deg, rgba(234,179,8,0.12) 0%, rgba(249,115,22,0.12) 100%)',
                    borderColor: 'rgba(234,179,8,0.3)',
                  }}
                >
                  <div
                    className="text-5xl font-black text-yellow-400 tabular-nums"
                    style={{ textShadow: '0 0 30px rgba(234,179,8,0.6)' }}
                  >
                    #{String(winner.number).padStart(3, '0')}
                  </div>
                  <div className="border-t border-yellow-500/20 pt-3 space-y-1.5">
                    <p className="text-white font-bold text-lg leading-tight">{winner.name}</p>
                    {winner.phone && <p className="text-neutral-400 text-sm">📱 {winner.phone}</p>}
                    {winner.city  && <p className="text-neutral-400 text-sm">📍 {winner.city}</p>}
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button
                    onClick={reset}
                    className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw size={14} /> Sortear de novo
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 py-3 bg-white text-neutral-900 hover:bg-neutral-100 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={14} /> Concluir
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
