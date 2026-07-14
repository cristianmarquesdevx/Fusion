/** @format */

-- ═══════════════════════════════════════════════════════════════════
-- Fusion ERP — Push Subscriptions
-- Tabela para armazenar inscrições push dos usuários,
-- permitindo disparar notificações via Web Push Protocol.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(endpoint)
);

-- Índice para busca por usuário
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- ═══ RLS ═══════════════════════════════════════════════════════════

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem ver suas próprias inscrições
CREATE POLICY "push_subscriptions_select_own"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários autenticados podem inserir suas próprias inscrições
CREATE POLICY "push_subscriptions_insert_own"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários autenticados podem remover suas próprias inscrições
CREATE POLICY "push_subscriptions_delete_own"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- ═══ Trigger para updated_at ═══════════════════════════════════

CREATE OR REPLACE FUNCTION update_push_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscription_timestamp();
