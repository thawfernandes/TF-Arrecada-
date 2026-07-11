// ============================================================
// TF Arrecada+ | Hook useOnboarding
// Controle de estado e etapas do assistente inicial do cliente
// ============================================================

import { useState } from 'react';
import { clientService } from '../services/clientService';
import { useAuth } from './useAuth';

export function useOnboarding() {
  const { client, refreshSession } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextStep = () => setStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const completeOnboarding = async () => {
    if (!client) return false;
    setIsSubmitting(true);
    try {
      const success = await clientService.completeOnboarding(client.id);
      if (success) {
        await refreshSession();
      }
      return success;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    step,
    setStep,
    nextStep,
    prevStep,
    isSubmitting,
    completeOnboarding,
    onboardingCompleted: client?.onboarding_completed ?? false,
  };
}
