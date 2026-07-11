// ============================================================
// TF Arrecada+ | StepIndicator — Indicador de etapas do formulário
// ============================================================

import { Check } from 'lucide-react';
import { clsx } from 'clsx';

interface Step {
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number; // 1-indexed
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-start justify-center">
      {steps.map((step, i) => {
        const num = i + 1;
        const done = num < currentStep;
        const active = num === currentStep;

        return (
          <div key={step.label} className="flex items-start">
            {/* Circle + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={clsx(
                  'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm',
                  'transition-all duration-300',
                  done && 'bg-brand-500 text-white',
                  active && 'bg-brand-500 text-white shadow-brand ring-4 ring-brand-100',
                  !done && !active && 'bg-neutral-100 text-neutral-400',
                )}
              >
                {done ? <Check size={16} strokeWidth={3} /> : num}
              </div>
              <span
                className={clsx(
                  'text-xs font-medium whitespace-nowrap',
                  active ? 'text-brand-600' : done ? 'text-neutral-500' : 'text-neutral-400',
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className={clsx(
                  'h-0.5 w-14 mx-2 mt-[18px] rounded-full transition-all duration-500',
                  num < currentStep ? 'bg-brand-400' : 'bg-neutral-200',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
