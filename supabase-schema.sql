-- ============================================================
-- ML Festas — Schema Supabase/PostgreSQL
-- Execute este SQL no editor do Supabase (SQL Editor)
-- ============================================================

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome          TEXT NOT NULL,
  cpf           TEXT NOT NULL UNIQUE,
  email         TEXT,
  telefone      TEXT,
  whatsapp_link TEXT,
  data_nascimento DATE,
  cep           TEXT,
  rua           TEXT,
  numero        TEXT,
  complemento   TEXT,
  bairro        TEXT,
  cidade        TEXT,
  estado        TEXT,
  total_gasto   NUMERIC(12, 2) DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Tabela de encomendas
CREATE TABLE IF NOT EXISTS encomendas (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo                    TEXT NOT NULL UNIQUE,
  titulo                    TEXT NOT NULL,
  cliente_id                UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  status                    TEXT NOT NULL DEFAULT 'Pedido'
                              CHECK (status IN ('Pedido', 'Em Produção', 'Pronto', 'Material Retirado')),
  data_pedido               DATE NOT NULL DEFAULT CURRENT_DATE,
  data_entrega              DATE,
  valor_total               NUMERIC(12, 2) DEFAULT 0,
  valor_sinal               NUMERIC(12, 2) DEFAULT 0,
  forma_pagamento_sinal     TEXT CHECK (forma_pagamento_sinal IN ('Pix', 'Dinheiro', 'Cartão de Débito', 'Cartão de Crédito')),
  restante_pago             BOOLEAN DEFAULT false,
  forma_pagamento_restante  TEXT CHECK (forma_pagamento_restante IN ('Pix', 'Dinheiro', 'Cartão de Débito', 'Cartão de Crédito')),
  observacoes               TEXT,
  created_at                TIMESTAMPTZ DEFAULT now()
);

-- Itens de encomenda
CREATE TABLE IF NOT EXISTS encomenda_itens (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  encomenda_id UUID NOT NULL REFERENCES encomendas(id) ON DELETE CASCADE,
  descricao    TEXT NOT NULL,
  concluido    BOOLEAN DEFAULT false
);

-- Tabela de locações
CREATE TABLE IF NOT EXISTS locacoes (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo                    TEXT NOT NULL UNIQUE,
  titulo                    TEXT NOT NULL,
  cliente_id                UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  status                    TEXT NOT NULL DEFAULT 'Pedido'
                              CHECK (status IN ('Pedido', 'Em Produção', 'Retirado', 'Devolvido')),
  data_pedido               DATE NOT NULL DEFAULT CURRENT_DATE,
  data_retirada             DATE,
  data_devolucao            DATE,
  valor_total               NUMERIC(12, 2) DEFAULT 0,
  valor_sinal               NUMERIC(12, 2) DEFAULT 0,
  forma_pagamento_sinal     TEXT CHECK (forma_pagamento_sinal IN ('Pix', 'Dinheiro', 'Cartão de Débito', 'Cartão de Crédito')),
  restante_pago             BOOLEAN DEFAULT false,
  forma_pagamento_restante  TEXT CHECK (forma_pagamento_restante IN ('Pix', 'Dinheiro', 'Cartão de Débito', 'Cartão de Crédito')),
  observacoes               TEXT,
  created_at                TIMESTAMPTZ DEFAULT now()
);

-- Itens de locação
CREATE TABLE IF NOT EXISTS locacao_itens (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  locacao_id UUID NOT NULL REFERENCES locacoes(id) ON DELETE CASCADE,
  descricao  TEXT NOT NULL,
  concluido  BOOLEAN DEFAULT false
);

-- Documentos do cliente
CREATE TABLE IF NOT EXISTS cliente_documentos (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id    UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nome_arquivo  TEXT NOT NULL,
  tipo          TEXT NOT NULL DEFAULT 'Documento',
  caminho       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE encomendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE encomenda_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE locacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE locacao_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_documentos ENABLE ROW LEVEL SECURITY;

-- Políticas: usuários autenticados têm acesso completo
CREATE POLICY "auth_all_clientes" ON clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_encomendas" ON encomendas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_encomenda_itens" ON encomenda_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_locacoes" ON locacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_locacao_itens" ON locacao_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_cliente_documentos" ON cliente_documentos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas: leitura pública para consulta de clientes e pedidos por CPF
-- (a API /api/consulta usa service_role, então não precisa de RLS separado)
-- Mas para segurança adicional, a rota de consulta pública usa service_role key no backend

-- ============================================================
-- Índices para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
CREATE INDEX IF NOT EXISTS idx_encomendas_cliente ON encomendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_encomendas_status ON encomendas(status);
CREATE INDEX IF NOT EXISTS idx_locacoes_cliente ON locacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_locacoes_status ON locacoes(status);
CREATE INDEX IF NOT EXISTS idx_encomenda_itens_encomenda ON encomenda_itens(encomenda_id);
CREATE INDEX IF NOT EXISTS idx_locacao_itens_locacao ON locacao_itens(locacao_id);
CREATE INDEX IF NOT EXISTS idx_documentos_cliente ON cliente_documentos(cliente_id);
