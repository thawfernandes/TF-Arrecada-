-- ============================================================
-- TF Arrecada+ | Seed SQL
-- Popula dados iniciais para desenvolvimento/produção
-- ============================================================

-- Inserir administrador padrão do TF Hub
-- Usuário: admin
-- Senha: admintfhubpassword (criptografada com bcrypt via crypt/gen_salt)
INSERT INTO tfhub_admins (username, password_hash, name, role)
VALUES (
  'admin',
  crypt('admintfhubpassword', gen_salt('bf', 10)),
  'Administrador TF Hub',
  'superadmin'
)
ON CONFLICT (username) DO NOTHING;

-- Inserir um cliente de teste (opcional, para testes iniciais)
-- Usuário: tf_cliente_teste
-- Senha: clientetestepassword
-- Licença: ativa por 30 dias a partir de agora
SELECT create_client_with_credentials(
  'tf_cliente_teste',
  'clientetestepassword',
  'Cliente de Teste',
  'TF Design & Tech',
  '11999999999',
  30
);
