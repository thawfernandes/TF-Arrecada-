-- ============================================================
-- TF Arrecada+ | Schema SQL Completo
-- Banco de dados: Supabase (PostgreSQL)
-- Versão: 2.0 — Arquitetura SaaS com autenticação própria
-- ============================================================

-- ─── Extensões ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELAS
-- ============================================================

-- ─── 1. clients ───────────────────────────────────────────────
-- Autenticação própria: cada cliente TF Hub tem username/password
CREATE TABLE IF NOT EXISTS clients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username        TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive', 'blocked')),
  license_status  TEXT NOT NULL DEFAULT 'active'
                    CHECK (license_status IN ('active', 'expired', 'blocked')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_clients_username ON clients (username);
CREATE INDEX idx_clients_license_status ON clients (license_status);
CREATE INDEX idx_clients_expires_at ON clients (expires_at);

-- ─── 2. client_profiles ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_profiles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  nome        TEXT,
  empresa     TEXT,
  cpf_cnpj    TEXT,
  telefone    TEXT,
  cidade      TEXT,
  estado      TEXT,
  instagram   TEXT,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_profiles_client_id ON client_profiles (client_id);

-- ─── 3. client_settings ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_settings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  logo_url        TEXT,
  colors          JSONB DEFAULT '{"primary": "#D312AE", "secondary": "#27272a"}'::jsonb,
  pix_key         TEXT,
  whatsapp        TEXT,
  instagram       TEXT,
  facebook        TEXT,
  auto_message    TEXT DEFAULT 'Obrigado por participar da nossa campanha!',
  pix_message     TEXT DEFAULT 'Realize o pagamento via PIX para confirmar sua reserva.',
  footer_text     TEXT DEFAULT 'Produzido pela TF',
  default_rules   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_settings_client_id ON client_settings (client_id);

-- ─── 4. campaigns ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id                   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  slug                        TEXT NOT NULL,
  share_code                  TEXT NOT NULL UNIQUE,
  name                        TEXT NOT NULL,
  image_url                   TEXT,
  description                 TEXT NOT NULL DEFAULT '',
  price_per_number            NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_numbers               INTEGER NOT NULL DEFAULT 100,
  pix_key                     TEXT,
  draw_type                   TEXT NOT NULL DEFAULT 'specific_date'
                                CHECK (draw_type IN ('specific_date', 'after_all_sold')),
  draw_date                   DATE,
  rules                       TEXT,
  reservation_timeout_minutes INTEGER NOT NULL DEFAULT 30,
  status                      TEXT NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft', 'active', 'finished', 'archived')),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaigns_client_id ON campaigns (client_id);
CREATE INDEX idx_campaigns_share_code ON campaigns (share_code);
CREATE INDEX idx_campaigns_status ON campaigns (status);
CREATE INDEX idx_campaigns_slug ON campaigns (slug);

-- ─── 5. campaign_numbers ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_numbers (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id             UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  number                  INTEGER NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'available'
                            CHECK (status IN ('available', 'reserved', 'paid')),
  reserved_at             TIMESTAMPTZ,
  reservation_expires_at  TIMESTAMPTZ,
  paid_at                 TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, number)
);

CREATE INDEX idx_campaign_numbers_campaign_id ON campaign_numbers (campaign_id);
CREATE INDEX idx_campaign_numbers_status ON campaign_numbers (campaign_id, status);
CREATE INDEX idx_campaign_numbers_expires ON campaign_numbers (reservation_expires_at)
  WHERE status = 'reserved';

-- ─── 6. buyers ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS buyers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_number_id  UUID NOT NULL REFERENCES campaign_numbers(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  phone               TEXT NOT NULL,
  city                TEXT,
  message             TEXT,
  purchased_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_buyers_campaign_number_id ON buyers (campaign_number_id);
CREATE INDEX idx_buyers_phone ON buyers (phone);

-- ─── 7. organizers ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  whatsapp    TEXT,
  role        TEXT DEFAULT 'Organizador',
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizers_campaign_id ON organizers (campaign_id);

-- ─── 8. message_templates ────────────────────────────────────
CREATE TABLE IF NOT EXISTS message_templates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type        TEXT NOT NULL
                CHECK (type IN ('whatsapp', 'pix', 'payment', 'reservation', 'closing')),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_message_templates_client_id ON message_templates (client_id);

-- ─── 9. tfhub_admins ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS tfhub_admins (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 10. activity_logs ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  admin_id    UUID REFERENCES tfhub_admins(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   UUID,
  details     JSONB DEFAULT '{}'::jsonb,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_client_id ON activity_logs (client_id, created_at DESC);
CREATE INDEX idx_activity_logs_admin_id ON activity_logs (admin_id, created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs (action);

-- ─── 11. notifications ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type        TEXT NOT NULL
                CHECK (type IN ('license_expiring', 'payment_confirmed',
                                'reservation_cancelled', 'campaign_finished', 'news')),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_client_id ON notifications (client_id, is_read, created_at DESC);

-- ============================================================
-- FUNÇÕES (RPCs)
-- ============================================================

-- ─── Hash de senha ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION hash_password(p_password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN crypt(p_password, gen_salt('bf', 10));
END;
$$;

-- ─── Verificar senha ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION verify_password(p_password TEXT, p_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN p_hash = crypt(p_password, p_hash);
END;
$$;

-- ─── Autenticar cliente ──────────────────────────────────────
CREATE OR REPLACE FUNCTION authenticate_client(p_username TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client clients%ROWTYPE;
  v_profile client_profiles%ROWTYPE;
  v_settings client_settings%ROWTYPE;
BEGIN
  -- Buscar cliente
  SELECT * INTO v_client FROM clients WHERE username = p_username;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'user_not_found');
  END IF;

  -- Verificar senha
  IF NOT verify_password(p_password, v_client.password_hash) THEN
    RETURN json_build_object('success', false, 'error', 'invalid_password');
  END IF;

  -- Verificar status
  IF v_client.status = 'blocked' THEN
    RETURN json_build_object('success', false, 'error', 'account_blocked');
  END IF;

  IF v_client.status = 'inactive' THEN
    RETURN json_build_object('success', false, 'error', 'account_inactive');
  END IF;

  -- Verificar licença
  IF v_client.expires_at < NOW() THEN
    -- Auto-expirar licença
    UPDATE clients SET license_status = 'expired' WHERE id = v_client.id;
    RETURN json_build_object('success', false, 'error', 'license_expired');
  END IF;

  IF v_client.license_status = 'expired' THEN
    RETURN json_build_object('success', false, 'error', 'license_expired');
  END IF;

  IF v_client.license_status = 'blocked' THEN
    RETURN json_build_object('success', false, 'error', 'license_blocked');
  END IF;

  -- Buscar perfil e configurações
  SELECT * INTO v_profile FROM client_profiles WHERE client_id = v_client.id;
  SELECT * INTO v_settings FROM client_settings WHERE client_id = v_client.id;

  -- Retornar dados
  RETURN json_build_object(
    'success', true,
    'client', json_build_object(
      'id', v_client.id,
      'username', v_client.username,
      'status', v_client.status,
      'license_status', v_client.license_status,
      'created_at', v_client.created_at,
      'activated_at', v_client.activated_at,
      'expires_at', v_client.expires_at,
      'onboarding_completed', v_client.onboarding_completed
    ),
    'profile', CASE WHEN v_profile.id IS NOT NULL THEN
      json_build_object(
        'id', v_profile.id,
        'nome', v_profile.nome,
        'empresa', v_profile.empresa,
        'cpf_cnpj', v_profile.cpf_cnpj,
        'telefone', v_profile.telefone,
        'cidade', v_profile.cidade,
        'estado', v_profile.estado,
        'instagram', v_profile.instagram,
        'logo_url', v_profile.logo_url
      )
    ELSE NULL END,
    'settings', CASE WHEN v_settings.id IS NOT NULL THEN
      json_build_object(
        'id', v_settings.id,
        'pix_key', v_settings.pix_key,
        'whatsapp', v_settings.whatsapp,
        'instagram', v_settings.instagram,
        'colors', v_settings.colors
      )
    ELSE NULL END
  );
END;
$$;

-- ─── Autenticar admin TF Hub ─────────────────────────────────
CREATE OR REPLACE FUNCTION authenticate_tfhub_admin(p_username TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin tfhub_admins%ROWTYPE;
BEGIN
  SELECT * INTO v_admin FROM tfhub_admins WHERE username = p_username;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'admin_not_found');
  END IF;

  IF NOT verify_password(p_password, v_admin.password_hash) THEN
    RETURN json_build_object('success', false, 'error', 'invalid_password');
  END IF;

  RETURN json_build_object(
    'success', true,
    'admin', json_build_object(
      'id', v_admin.id,
      'username', v_admin.username,
      'name', v_admin.name,
      'role', v_admin.role
    )
  );
END;
$$;

-- ─── Criar cliente com credenciais ───────────────────────────
CREATE OR REPLACE FUNCTION create_client_with_credentials(
  p_username TEXT,
  p_password TEXT,
  p_nome TEXT DEFAULT NULL,
  p_empresa TEXT DEFAULT NULL,
  p_telefone TEXT DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_id UUID;
  v_hash TEXT;
BEGIN
  -- Verificar username único
  IF EXISTS (SELECT 1 FROM clients WHERE username = p_username) THEN
    RETURN json_build_object('success', false, 'error', 'username_taken');
  END IF;

  -- Gerar hash
  v_hash := crypt(p_password, gen_salt('bf', 10));

  -- Criar cliente
  INSERT INTO clients (username, password_hash, expires_at)
  VALUES (p_username, v_hash, NOW() + (p_days || ' days')::INTERVAL)
  RETURNING id INTO v_client_id;

  -- Criar perfil
  INSERT INTO client_profiles (client_id, nome, empresa, telefone)
  VALUES (v_client_id, p_nome, p_empresa, p_telefone);

  -- Criar settings padrão
  INSERT INTO client_settings (client_id) VALUES (v_client_id);

  -- Criar templates padrão
  INSERT INTO message_templates (client_id, type, title, content) VALUES
    (v_client_id, 'whatsapp', 'Mensagem WhatsApp', 'Olá! Sua reserva do número #{number} foi confirmada. Valor: R$ {value}. Realize o pagamento via PIX.'),
    (v_client_id, 'pix', 'Mensagem PIX', 'Realize o pagamento de R$ {value} via PIX para a chave: {pix_key}'),
    (v_client_id, 'payment', 'Pagamento Confirmado', 'Pagamento do número #{number} confirmado! Obrigado por participar.'),
    (v_client_id, 'reservation', 'Reserva Realizada', 'Número #{number} reservado com sucesso! Realize o pagamento em até {timeout} minutos.'),
    (v_client_id, 'closing', 'Campanha Encerrada', 'A campanha {campaign_name} foi encerrada. Obrigado a todos os participantes!');

  RETURN json_build_object(
    'success', true,
    'client_id', v_client_id
  );
END;
$$;

-- ─── Renovar licença ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION renew_license(p_client_id UUID, p_days INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_expires TIMESTAMPTZ;
BEGIN
  v_new_expires := GREATEST(
    (SELECT expires_at FROM clients WHERE id = p_client_id),
    NOW()
  ) + (p_days || ' days')::INTERVAL;

  UPDATE clients
  SET
    expires_at = v_new_expires,
    license_status = 'active',
    status = 'active',
    activated_at = NOW()
  WHERE id = p_client_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'client_not_found');
  END IF;

  RETURN json_build_object('success', true, 'expires_at', v_new_expires);
END;
$$;

-- ─── Gerar share_code único ──────────────────────────────────
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Gerar código alfanumérico de 8 caracteres
    v_code := LOWER(SUBSTRING(
      REPLACE(REPLACE(encode(gen_random_bytes(6), 'base64'), '+', ''), '/', ''),
      1, 8
    ));

    -- Verificar unicidade
    SELECT EXISTS(SELECT 1 FROM campaigns WHERE share_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;

  RETURN v_code;
END;
$$;

-- ─── Trigger: auto-gerar share_code ──────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_share_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.share_code IS NULL OR NEW.share_code = '' THEN
    NEW.share_code := generate_share_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_campaigns_share_code
  BEFORE INSERT ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_share_code();

-- ─── Trigger: auto-atualizar updated_at ──────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_client_profiles_updated_at
  BEFORE UPDATE ON client_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_client_settings_updated_at
  BEFORE UPDATE ON client_settings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tfhub_admins ENABLE ROW LEVEL SECURITY;

-- ─── Políticas: acesso público (anon) ────────────────────────
-- Campanhas ativas podem ser vistas publicamente
CREATE POLICY "campaigns_public_read" ON campaigns
  FOR SELECT USING (status = 'active');

-- Números de campanhas ativas podem ser lidos publicamente
CREATE POLICY "campaign_numbers_public_read" ON campaign_numbers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_numbers.campaign_id AND c.status = 'active'
    )
  );

-- Buyers podem ser lidos/inseridos em campanhas ativas
CREATE POLICY "buyers_public_read" ON buyers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaign_numbers cn
      JOIN campaigns c ON c.id = cn.campaign_id
      WHERE cn.id = buyers.campaign_number_id AND c.status = 'active'
    )
  );

CREATE POLICY "buyers_public_insert" ON buyers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaign_numbers cn
      JOIN campaigns c ON c.id = cn.campaign_id
      WHERE cn.id = buyers.campaign_number_id AND c.status = 'active'
    )
  );

-- Organizadores de campanhas ativas podem ser lidos publicamente
CREATE POLICY "organizers_public_read" ON organizers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = organizers.campaign_id AND c.status = 'active'
    )
  );

-- Números podem ser atualizados (reservas) em campanhas ativas
CREATE POLICY "campaign_numbers_public_update" ON campaign_numbers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_numbers.campaign_id AND c.status = 'active'
    )
  );

-- ─── Políticas: acesso autenticado do cliente ────────────────
-- As RPCs (SECURITY DEFINER) bypassam RLS, então o acesso
-- autenticado é controlado pela lógica das funções.
-- Para queries diretas do client-side, usamos o anon key
-- com as políticas públicas acima.

-- ─── Políticas: TF Hub admins (bypass via RPC SECURITY DEFINER)
-- Todas as operações admin são feitas via RPCs com SECURITY DEFINER
-- que bypassam RLS automaticamente.

-- ============================================================
-- NOTAS DE IMPLEMENTAÇÃO
-- ============================================================
-- 
-- 1. A autenticação é feita via RPCs (authenticate_client,
--    authenticate_tfhub_admin) que são SECURITY DEFINER e
--    bypassam RLS.
--
-- 2. As operações CRUD do cliente são feitas via RPCs
--    SECURITY DEFINER para garantir isolamento.
--
-- 3. Páginas públicas usam o anon key com as políticas
--    de SELECT em campanhas ativas.
--
-- 4. O share_code é gerado automaticamente pelo trigger
--    e nunca muda após a criação.
--
-- 5. As senhas usam bcrypt via pgcrypto (gen_salt('bf', 10)).
