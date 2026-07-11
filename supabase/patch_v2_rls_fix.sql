-- ============================================================
-- TF Arrecada+ | Patch v2 — Correção de RLS e Log Service
-- Execute este arquivo no Supabase SQL Editor
-- ============================================================

-- ─── 1. RPC log_activity_rpc (SECURITY DEFINER) ─────────────
-- Permite gravar logs de auditoria bypassando RLS
CREATE OR REPLACE FUNCTION log_activity_rpc(
  p_action      TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id   UUID DEFAULT NULL,
  p_details     JSONB DEFAULT '{}'::jsonb,
  p_client_id   UUID DEFAULT NULL,
  p_admin_id    UUID DEFAULT NULL,
  p_ip_address  TEXT DEFAULT 'client-side'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO activity_logs (
    action, entity_type, entity_id,
    details, client_id, admin_id, ip_address
  ) VALUES (
    p_action, p_entity_type, p_entity_id,
    p_details, p_client_id, p_admin_id, p_ip_address
  );
EXCEPTION WHEN OTHERS THEN
  -- Silencia erros de log para não quebrar o fluxo principal
  NULL;
END;
$$;

-- ─── 2. Políticas de acesso para o TF Hub (anon key) ─────────
-- O controle de acesso real é feito pelo token no localStorage.
-- As políticas abaixo permitem que o anon key leia/escreva
-- as tabelas que o painel admin precisa acessar diretamente.

-- clients: leitura e escrita (admin cria/atualiza clientes)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'clients_anon_all' AND tablename = 'clients') THEN
    CREATE POLICY "clients_anon_all" ON clients FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- client_profiles: acesso total
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'client_profiles_anon_all' AND tablename = 'client_profiles') THEN
    CREATE POLICY "client_profiles_anon_all" ON client_profiles FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- client_settings: acesso total
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'client_settings_anon_all' AND tablename = 'client_settings') THEN
    CREATE POLICY "client_settings_anon_all" ON client_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- campaigns: acesso total (admin precisa ver TODAS as campanhas, inclusive drafts)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'campaigns_anon_all' AND tablename = 'campaigns') THEN
    CREATE POLICY "campaigns_anon_all" ON campaigns FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- campaign_numbers: acesso total
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'campaign_numbers_anon_all' AND tablename = 'campaign_numbers') THEN
    CREATE POLICY "campaign_numbers_anon_all" ON campaign_numbers FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- buyers: acesso total
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'buyers_anon_all' AND tablename = 'buyers') THEN
    CREATE POLICY "buyers_anon_all" ON buyers FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- message_templates: acesso total
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'message_templates_anon_all' AND tablename = 'message_templates') THEN
    CREATE POLICY "message_templates_anon_all" ON message_templates FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- notifications: acesso total
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notifications_anon_all' AND tablename = 'notifications') THEN
    CREATE POLICY "notifications_anon_all" ON notifications FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- organizers: acesso total
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'organizers_anon_all' AND tablename = 'organizers') THEN
    CREATE POLICY "organizers_anon_all" ON organizers FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- activity_logs: somente leitura para o anon (INSERT é feito via RPC SECURITY DEFINER)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'activity_logs_anon_read' AND tablename = 'activity_logs') THEN
    CREATE POLICY "activity_logs_anon_read" ON activity_logs FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('clients', 'campaigns', 'activity_logs', 'campaign_numbers', 'buyers')
ORDER BY tablename, policyname;
