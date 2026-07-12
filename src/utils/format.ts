// ============================================================
// TF Arrecada+ | Formatting Utilities
// ============================================================

/** Formata valor monetário em BRL */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}

/** Formata data ISO para dd/mm/aaaa */
export function formatDate(isoDate: string): string {
  if (!isoDate) return '—';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/** Formata telefone brasileiro */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/** Mascara o telefone durante digitação */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return value;
}

/** Gera URL pública da campanha */
export function getCampaignUrl(slug: string): string {
  const base = import.meta.env.BASE_URL;
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${window.location.origin}${cleanBase}campanha/${slug}`;
}


/** Trunca texto com ellipsis */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

/** Formata link do WhatsApp com DDI 55 padrão se não estiver presente */
export function formatWhatsAppLink(phone: string, message?: string): string {
  if (!phone) return '';
  const cleanPhone = phone.replace(/\D/g, '');
  // Se já começar com 55 e tiver tamanho de um celular brasileiro completo, mantém, senão adiciona 55
  const finalPhone = cleanPhone.startsWith('55') && cleanPhone.length >= 12 ? cleanPhone : `55${cleanPhone}`;
  const textParam = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${finalPhone}${textParam}`;
}

