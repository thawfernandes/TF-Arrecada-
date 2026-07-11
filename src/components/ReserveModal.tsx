// ============================================================
// TF Arrecada+ | ReserveModal — Fluxo: formulário → PIX → conclusão
// ============================================================

import { useState } from 'react';
import { Check, Copy, Phone, X, MessageCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from './Modal';
import { campaignService } from '../services/campaignService';
import { maskPhone } from '../utils/format';
import type { Campaign, CampaignNumber } from '../types';

type View = 'form' | 'pix' | 'done' | 'warning';

interface ReserveModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  number: CampaignNumber;
  onRefresh: () => void;
}

interface BuyerForm {
  name: string;
  phone: string;
  city: string;
  message: string;
}

export function ReserveModal({
  isOpen,
  onClose,
  campaign,
  number,
  onRefresh,
}: ReserveModalProps) {
  const [view, setView] = useState<View>('form');
  const [form, setForm] = useState<BuyerForm>({ name: '', phone: '', city: '', message: '' });
  const [errors, setErrors] = useState<Partial<BuyerForm>>({});
  const [copiedPix, setCopiedPix] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const primaryOrg = (campaign.organizers || []).find((o) => o.is_primary) || (campaign.organizers || [])[0];

  // ─── Helpers ───────────────────────────────────────────────

  function upd(field: keyof BuyerForm, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<BuyerForm> = {};
    if (!form.name.trim()) e.name = 'Informe seu nome';
    if (!form.phone.trim()) e.phone = 'Informe seu telefone';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleReserve() {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await campaignService.reserveNumber(
        campaign.id,
        number.number,
        {
          name: form.name.trim(),
          phone: form.phone,
          city: form.city.trim() || undefined,
          message: form.message.trim() || undefined,
        },
        campaign.reservation_timeout_minutes
      );

      if (res.success) {
        onRefresh();
        setView('pix');
      } else {
        alert(
          res.error === 'already_reserved'
            ? 'Este número já foi reservado por outro participante. Por favor, selecione outro.'
            : 'Falha ao reservar número. Tente novamente.'
        );
        handleClose();
      }
    } catch (err) {
      console.error(err);
      alert('Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  }

  function copyPix() {
    if (!campaign.pix_key) return;
    navigator.clipboard.writeText(campaign.pix_key);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  }

  function handleClose() {
    setView('form');
    setForm({ name: '', phone: '', city: '', message: '' });
    setErrors({});
    onClose();
  }

  function getWhatsAppUrl(): string {
    if (!primaryOrg) return '';
    const cleanPhone = primaryOrg.whatsapp.replace(/\D/g, '');
    const text = `Olá! Gostaria de comprar o número ${number.number} na campanha "${campaign.name}". Meu nome é ${form.name.trim()}.`;
    return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  const titles: Record<View, string> = {
    form: `Reservar número ${number.number}`,
    pix:  'Realize o pagamento',
    done: 'Obrigado! 🎉',
    warning: '⚠ Atenção',
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={titles[view]}>
      {/* ── Formulário ──────────────────────────────────────── */}
      {view === 'form' && (
        <div className="space-y-4">
          <Field label="Seu nome *" error={errors.name}>
            <input
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder="Como quer ser identificado"
              value={form.name}
              onChange={(e) => upd('name', e.target.value)}
              autoFocus
              disabled={isLoading}
            />
          </Field>

          <Field label="Telefone / WhatsApp *" error={errors.phone}>
            <input
              type="tel"
              className={`input ${errors.phone ? 'input-error' : ''}`}
              placeholder="(00) 00000-0000"
              value={form.phone}
              onChange={(e) => upd('phone', maskPhone(e.target.value))}
              disabled={isLoading}
            />
          </Field>

          <Field label="Cidade (opcional)">
            <input
              className="input"
              placeholder="De onde você é?"
              value={form.city}
              onChange={(e) => upd('city', e.target.value)}
              disabled={isLoading}
            />
          </Field>

          <Field label="Mensagem (opcional)">
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Deixe uma mensagem para o organizador..."
              value={form.message}
              onChange={(e) => upd('message', e.target.value)}
              disabled={isLoading}
            />
          </Field>

          <button onClick={handleReserve} className="btn-primary w-full mt-2" disabled={isLoading}>
            {isLoading ? 'Reservando...' : `Reservar número ${number.number}`}
          </button>
        </div>
      )}

      {/* ── PIX ─────────────────────────────────────────────── */}
      {view === 'pix' && (
        <div className="text-center space-y-5">
          {/* Status da reserva */}
          <div className="bg-brand-50 rounded-2xl p-4">
            <p className="text-sm text-brand-700 font-semibold">
              🎉 Número {number.number} reservado!
            </p>
            <p className="text-xs text-brand-600 mt-0.5">
              Complete o PIX para garantir sua vaga.
            </p>
          </div>

          {/* QR Code */}
          {campaign.pix_key && (
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-soft inline-block">
                <QRCodeSVG
                  value={campaign.pix_key}
                  size={160}
                  fgColor="#1a1a2e"
                  bgColor="#ffffff"
                  level="M"
                />
              </div>
            </div>
          )}

          {/* Chave PIX copiável */}
          {campaign.pix_key && (
            <div className="text-left animate-fade-in">
              <p className="text-xs text-neutral-500 mb-1.5 font-semibold">Chave PIX</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-neutral-50 rounded-xl px-3 py-2.5 text-sm
                                font-medium text-neutral-700 break-all leading-snug border border-neutral-200">
                  {campaign.pix_key}
                </div>
                <button
                  onClick={copyPix}
                  className="btn-ghost p-2.5 shrink-0 rounded-xl border border-neutral-200"
                  title="Copiar chave PIX"
                >
                  {copiedPix
                    ? <Check size={15} className="text-green-500" />
                    : <Copy size={15} />
                  }
                </button>
              </div>
            </div>
          )}

          {/* Contato WhatsApp Direto */}
          {primaryOrg && (
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} />
              💬 Enviar comprovante pelo WhatsApp
            </a>
          )}

          {/* Contatos dos organizadores */}
          {campaign.organizers && campaign.organizers.length > 0 && (
            <div className="text-xs text-neutral-500 space-y-1.5 pt-1">
              <p className="font-semibold text-neutral-600">Dúvidas? Entre em contato:</p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                {campaign.organizers.map((org) => (
                  <div key={org.id} className="flex items-center gap-1">
                    <Phone size={10} className="text-neutral-400" />
                    <span className="font-semibold text-neutral-700">{org.name}</span>
                    <span className="text-neutral-400">({org.role || 'Org'})</span>
                    <a
                      href={`https://wa.me/55${org.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 font-semibold hover:underline ml-0.5"
                    >
                      Falar
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => setView('done')} className="btn-primary w-full">
            <Check size={16} />
            Já realizei o pagamento
          </button>

          <button onClick={() => setView('warning')} className="btn-ghost w-full text-xs text-neutral-400">
            Fechar e pagar depois
          </button>
        </div>
      )}

      {/* ── Conclusão ───────────────────────────────────────── */}
      {view === 'done' && (
        <div className="text-center space-y-5">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check size={28} className="text-green-600" strokeWidth={2.5} />
          </div>

          <div className="text-center">
            <h3 className="font-display font-bold text-lg text-neutral-800">Obrigado!</h3>
            <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">
              Quando o organizador confirmar seu pagamento, seu número ficará marcado como{' '}
              <span className="text-red-500 font-medium">Pago</span>.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-left">
            <p className="text-xs text-amber-700 leading-relaxed font-semibold">
              ⏳ Número <strong>#{number.number}</strong> reservado em seu nome.
              A confirmação pode levar alguns minutos.
            </p>
          </div>

          {primaryOrg && (
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} />
              Enviar comprovante por WhatsApp
            </a>
          )}

          <button onClick={handleClose} className="btn-primary w-full">
            <X size={15} />
            Fechar
          </button>
        </div>
      )}

      {/* ── Atenção (Pagar Depois) ──────────────────────────── */}
      {view === 'warning' && (
        <div className="space-y-5 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">⚠</span>
          </div>

          <div className="space-y-2">
            <h3 className="font-display font-bold text-lg text-neutral-800">Atenção</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              O pagamento deverá ser realizado o quanto antes. Caso ele não seja confirmado dentro do prazo definido pelo organizador, sua reserva poderá ser cancelada e o número ficará disponível novamente. Para mais informações, entre em contato com os organizadores.
            </p>
          </div>

          <button onClick={handleClose} className="btn-primary w-full">
            Entendi
          </button>
        </div>
      )}
    </Modal>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="text-left">
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}
    </div>
  );
}
