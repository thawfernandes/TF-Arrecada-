// ============================================================
// TF Arrecada+ | NumberGrid — Grade de números da campanha
// ============================================================

import { clsx } from 'clsx';
import type { CampaignNumber } from '../types';

interface NumberGridProps {
  numbers: CampaignNumber[];
  onNumberClick: (number: CampaignNumber) => void;
}

// Usa auto-fill para colunas responsivas: cards de no mínimo 44px
export function NumberGrid({ numbers, onNumberClick }: NumberGridProps) {
  return (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))' }}
    >
      {numbers.map((num) => (
        <NumberCard key={num.id} number={num} onClick={() => onNumberClick(num)} />
      ))}
    </div>
  );
}

// ─── Card individual ─────────────────────────────────────────

interface NumberCardProps {
  number: CampaignNumber;
  onClick: () => void;
}

function NumberCard({ number, onClick }: NumberCardProps) {
  const available = number.status === 'available';

  return (
    <button
      onClick={available ? onClick : undefined}
      disabled={!available}
      aria-label={`Número ${number.id}: ${statusLabel(number.status)}`}
      title={
        number.status !== 'available'
          ? `${statusLabel(number.status)} — ${number.buyer?.name ?? ''}`
          : `Disponível — clique para reservar`
      }
      className={clsx(
        'number-card',
        number.status === 'available' && 'number-card-available',
        number.status === 'reserved'  && 'number-card-reserved',
        number.status === 'paid'      && 'number-card-paid',
      )}
    >
      {number.id}
    </button>
  );
}

function statusLabel(status: CampaignNumber['status']): string {
  return status === 'available' ? 'Disponível' : status === 'reserved' ? 'Reservado' : 'Pago';
}
