export type FormaPagamento = 'Pix' | 'Dinheiro' | 'Cartão de Débito' | 'Cartão de Crédito'

export type StatusEncomenda = 'Pedido' | 'Em Produção' | 'Pronto' | 'Material Retirado'
export type StatusLocacao = 'Pedido' | 'Em Produção' | 'Pronto' | 'Retirado' | 'Devolvido'

export interface Cliente {
  id: string
  nome: string
  cpf: string
  email: string | null
  telefone: string | null
  whatsapp_link: string | null
  instagram: string | null
  data_nascimento: string | null
  cep: string | null
  rua: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  total_gasto: number
  created_at: string
}

export type StatusAssinatura = 'pendente' | 'assinado'

export interface Contrato {
  id: string
  numero: string
  locacao_id: string
  cliente_id: string
  criado_em: string
  token_assinatura: string | null
  status_assinatura: StatusAssinatura
  data_assinatura: string | null
  ip_assinatura: string | null
  cpf_confirmado: string | null
  clientes?: Pick<Cliente, 'nome' | 'cpf'>
  locacoes?: { titulo: string; codigo: string }
}

export interface EncomendaItem {
  id: string
  encomenda_id: string
  descricao: string
  quantidade: number
  concluido: boolean
}

export interface Encomenda {
  id: string
  codigo: string
  titulo: string
  cliente_id: string
  status: StatusEncomenda
  data_pedido: string
  data_entrega: string | null
  valor_total: number
  valor_sinal: number
  forma_pagamento_sinal: FormaPagamento | null
  restante_pago: boolean
  forma_pagamento_restante: FormaPagamento | null
  observacoes: string | null
  created_at: string
  clientes?: Cliente
  encomenda_itens?: EncomendaItem[]
}

export interface LocacaoItem {
  id: string
  locacao_id: string
  descricao: string
  quantidade: number
  concluido: boolean
}

export interface Locacao {
  id: string
  codigo: string
  titulo: string
  cliente_id: string
  status: StatusLocacao
  data_pedido: string
  data_retirada: string | null
  data_devolucao: string | null
  valor_total: number
  valor_sinal: number
  forma_pagamento_sinal: FormaPagamento | null
  restante_pago: boolean
  forma_pagamento_restante: FormaPagamento | null
  observacoes: string | null
  created_at: string
  clientes?: Cliente
  locacao_itens?: LocacaoItem[]
}

export interface ClienteDocumento {
  id: string
  cliente_id: string
  nome_arquivo: string
  tipo: string
  caminho: string
  created_at: string
}

export interface DashboardData {
  faturamentoMes: {
    encomendas: number
    locacoes: number
  }
  pedidosAbertos: {
    encomendas: number
    locacoes: number
  }
  clientesNovosMes: number
  locacoesAtraso: number
  proximasEntregas: ProximaEntrega[]
  faturamentoMensal: FaturamentoMensal[]
  pedidosPorStatus: PedidosPorStatus[]
}

export interface ProximaEntrega {
  id: string
  tipo: 'encomenda' | 'locacao'
  titulo: string
  data: string
  clienteNome: string
  acao: 'entrega' | 'retirada' | 'devolucao'
}

export interface FaturamentoMensal {
  mes: string
  encomendas: number
  locacoes: number
}

export interface PedidosPorStatus {
  status: string
  quantidade: number
  tipo: 'encomenda' | 'locacao'
}
