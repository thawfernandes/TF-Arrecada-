-- ============================================================
-- HEARTBEAT ANTI-PAUSE — TF Arrecada+
-- Supabase Free Plan | Prevenção de Pausa por Inatividade
-- ============================================================
--
-- ATENÇÃO: A documentação oficial do Supabase não garante que
-- projetos no Free Plan nunca serão pausados. Este mecanismo
-- gera atividade diária para REDUZIR a probabilidade de pausa
-- por inatividade — não é uma garantia absoluta.
--
-- COMO FUNCIONA:
--   1. pg_cron executa tfhub_heartbeat_tick() uma vez por dia
--   2. A função faz uma leitura leve no banco (COUNT de clients)
--   3. O resultado é registrado na tabela _tfhub_heartbeat
--   4. Nenhum dado de usuário é alterado
--
-- SCHEDULE: 0 12 * * * (todo dia às 12:00 UTC = 09:00 Brasília)
-- JOB NAME: tfhub-daily-heartbeat
-- ============================================================

-- ─── Pré-requisito: extensão pg_cron ─────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ─── Tabela de controle ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS _tfhub_heartbeat (
  id        SERIAL PRIMARY KEY,
  last_run  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status    TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'error')),
  message   TEXT,
  run_count INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE _tfhub_heartbeat IS
  'Controle do heartbeat diario do TF Hub. '
  'Mantem o projeto ativo no Free Plan. '
  'Nao contem dados de usuarios.';

-- Registro inicial de controle
INSERT INTO _tfhub_heartbeat (id, status, message, run_count)
VALUES (1, 'ok', 'Inicializado', 0)
ON CONFLICT (id) DO NOTHING;

-- ─── Função de heartbeat ──────────────────────────────────────
CREATE OR REPLACE FUNCTION tfhub_heartbeat_tick()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_count INTEGER;
  v_msg TEXT;
BEGIN
  -- Leitura leve: conta clientes ativos (atividade real no banco)
  SELECT COUNT(*) INTO v_client_count FROM clients WHERE status = 'active';

  v_msg := format(
    'ok | clients_ativos=%s | %s',
    v_client_count,
    to_char(NOW() AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI:SS')
  );

  -- Atualizar registro de heartbeat
  UPDATE _tfhub_heartbeat
  SET
    last_run  = NOW(),
    status    = 'ok',
    message   = v_msg,
    run_count = run_count + 1
  WHERE id = 1;

  RETURN v_msg;

EXCEPTION WHEN OTHERS THEN
  UPDATE _tfhub_heartbeat
  SET last_run = NOW(), status = 'error', message = SQLERRM
  WHERE id = 1;
  RETURN 'error: ' || SQLERRM;
END;
$$;

-- ─── Agendamento do Cron Job ──────────────────────────────────
-- Remover job anterior se existir (evita duplicata)
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'tfhub-daily-heartbeat';

-- Criar o job diário
SELECT cron.schedule(
  'tfhub-daily-heartbeat',       -- nome identificável
  '0 12 * * *',                  -- 12:00 UTC = 09:00 Brasília (BRT, UTC-3)
  'SELECT tfhub_heartbeat_tick()'
);

-- ─── Verificações ─────────────────────────────────────────────

-- Confirmar job criado e ativo:
-- SELECT jobid, jobname, schedule, command, active
-- FROM cron.job WHERE jobname = 'tfhub-daily-heartbeat';

-- Teste manual imediato:
-- SELECT tfhub_heartbeat_tick() AS resultado;

-- Verificar última execução:
-- SELECT * FROM _tfhub_heartbeat WHERE id = 1;

-- Histórico de execuções do pg_cron:
-- SELECT * FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'tfhub-daily-heartbeat')
-- ORDER BY start_time DESC LIMIT 10;
