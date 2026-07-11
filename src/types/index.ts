// ============================================================
// TF Arrecada+ | Types — v3
// Suporte a arquitetura SaaS, autenticação própria,
// profiles, configurações flexíveis e painel administrativo TF Hub.
// ============================================================

export type LicenseStatus = 'active' | 'expired' | 'blocked';
export type ClientStatus = 'active' | 'inactive' | 'blocked';
export type CampaignStatus = 'draft' | 'active' | 'finished' | 'archived';
export type NumberStatus = 'available' | 'reserved' | 'paid';
export type DrawType = 'specific_date' | 'after_all_sold';
export type TemplateType = 'whatsapp' | 'pix' | 'payment' | 'reservation' | 'closing';
export type NotificationType =
  | 'license_expiring'
  | 'payment_confirmed'
  | 'reservation_cancelled'
  | 'campaign_finished'
  | 'news';

export type LogAction =
  | 'login'
  | 'logout'
  | 'campaign_create'
  | 'campaign_edit'
  | 'campaign_delete'
  | 'pix_change'
  | 'reserve'
  | 'cancel'
  | 'payment'
  | 'license_renew';

// ─── Client (Auth própria) ────────────────────────────────────

export interface Client {
  id: string;
  username: string;
  status: ClientStatus;
  license_status: LicenseStatus;
  created_at: string;
  activated_at?: string;
  expires_at: string;
  onboarding_completed: boolean;
}

export interface ClientProfile {
  id: string;
  client_id: string;
  nome: string;
  empresa: string;
  cpf_cnpj: string;
  telefone: string;
  cidade: string;
  estado: string;
  instagram: string;
  logo_url: string;
}

export interface ClientSettings {
  id: string;
  client_id: string;
  logo_url: string;
  colors: {
    primary: string;
    secondary: string;
    [key: string]: string;
  };
  pix_key: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  auto_message: string;
  pix_message: string;
  footer_text: string;
  default_rules: string;
}

// ─── TF Hub Admin ─────────────────────────────────────────────

export interface TFHubAdmin {
  id: string;
  username: string;
  name: string;
  role: string;
  created_at: string;
}

// ─── Session (Retornada no login) ─────────────────────────────

export interface AuthSession {
  token: string; // UUID da sessão/id do cliente
  isAdmin: boolean;
  username: string;
  name: string;
  expiresAt: number; // timestamp ms
}

// ─── Organizer ────────────────────────────────────────────────

export interface Organizer {
  id: string;
  campaign_id: string;
  name: string;
  phone: string;
  whatsapp: string;
  role: string;
  is_primary: boolean;
}

// ─── Buyer ────────────────────────────────────────────────────

export interface Buyer {
  id: string;
  campaign_number_id: string;
  name: string;
  phone: string;
  city?: string;
  message?: string;
  purchased_at: string;
}

// ─── CampaignNumber ───────────────────────────────────────────

export interface CampaignNumber {
  id: string;
  campaign_id: string;
  number: number;
  status: NumberStatus;
  reserved_at?: string;
  reservation_expires_at?: string;
  paid_at?: string;
  buyer?: Buyer;
}

// ─── Campaign ─────────────────────────────────────────────────

export interface Campaign {
  id: string;
  client_id: string;
  slug: string;
  share_code: string;
  name: string;
  image_url?: string;
  description: string;
  price_per_number: number;
  total_numbers: number;
  pix_key: string;
  draw_type: DrawType;
  draw_date?: string;
  rules?: string;
  reservation_timeout_minutes: number;
  status: CampaignStatus;
  created_at: string;
  updated_at: string;
  
  // Relações carregadas opcionalmente
  organizers?: Organizer[];
  numbers?: CampaignNumber[];
  client_settings?: ClientSettings;
}

// ─── Message Template ──────────────────────────────────────────

export interface MessageTemplate {
  id: string;
  client_id: string;
  type: TemplateType;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Activity Log ─────────────────────────────────────────────

export interface ActivityLog {
  id: string;
  client_id?: string;
  admin_id?: string;
  action: LogAction;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

// ─── Notification ─────────────────────────────────────────────

export interface Notification {
  id: string;
  client_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

// ─── Stats ────────────────────────────────────────────────────

export interface CampaignStats {
  total: number;
  available: number;
  reserved: number;
  paid: number;
  totalRaised: number;
  totalExpected: number;
  progressPercent: number; // (paid + reserved) / total
  soldPercent: number;     // paid / total
}

// ─── Onboarding State ─────────────────────────────────────────

export interface OnboardingState {
  step: number;
  onboarding_completed: boolean;
}

// ─── My Numbers Result ────────────────────────────────────────

export interface MyNumberResult {
  campaignName: string;
  campaignSlug: string;
  shareCode: string;
  numbers: {
    number: number;
    status: NumberStatus;
    reservedAt?: string;
    reservationExpiresAt?: string;
    paidAt?: string;
  }[];
}
