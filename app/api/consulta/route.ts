import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { hashCPF } from '@/lib/cpf-crypto'

const STATUS_VISIVEIS_ENCOMENDA = ['Pedido', 'Em Produção', 'Pronto']
const STATUS_VISIVEIS_LOCACAO = ['Pedido', 'Em Produção', 'Retirado']

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const cpf = searchParams.get('cpf')?.replace(/\D/g, '')

  if (!cpf || cpf.length !== 11) {
    return NextResponse.json({ pedidos: [] })
  }

  const supabase = createServiceClient()

  const { data: cliente } = await supabase
    .from('clientes')
    .select('id')
    .eq('cpf_hash', hashCPF(cpf))
    .single()

  if (!cliente) return NextResponse.json({ pedidos: [] })

  const STATUS_ATIVOS_FILA = ['Pedido', 'Em Produção']

  const [encRes, locRes, filaRes] = await Promise.all([
    supabase.from('encomendas')
      .select('id, titulo, status, data_entrega, pedido_fila, encomenda_itens(descricao)')
      .eq('cliente_id', cliente.id)
      .in('status', STATUS_VISIVEIS_ENCOMENDA),
    supabase.from('locacoes')
      .select('id, titulo, status, data_retirada, locacao_itens(descricao)')
      .eq('cliente_id', cliente.id)
      .in('status', STATUS_VISIVEIS_LOCACAO),
    supabase.from('encomendas')
      .select('id')
      .eq('pedido_fila', true)
      .in('status', STATUS_ATIVOS_FILA)
      .order('created_at', { ascending: true }),
  ])

  const posicaoFila = new Map<string, number>()
  ;(filaRes.data ?? []).forEach((e, i) => posicaoFila.set(e.id, i + 1))

  const pedidos = [
    ...(encRes.data ?? []).map(e => ({
      id: e.id,
      titulo: e.titulo,
      tipo: 'encomenda' as const,
      status: e.status,
      data: e.pedido_fila ? null : e.data_entrega,
      posicaoFila: e.pedido_fila ? posicaoFila.get(e.id) ?? null : null,
      itens: (e.encomenda_itens ?? []).map((i: any) => i.descricao),
    })),
    ...(locRes.data ?? []).map(l => ({
      id: l.id,
      titulo: l.titulo,
      tipo: 'locacao' as const,
      status: l.status,
      data: l.data_retirada,
      itens: (l.locacao_itens ?? []).map((i: any) => i.descricao),
    })),
  ]

  return NextResponse.json({ pedidos })
}