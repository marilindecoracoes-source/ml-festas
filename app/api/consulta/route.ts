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

  const [encRes, locRes] = await Promise.all([
    supabase.from('encomendas')
      .select('id, titulo, status, data_entrega, encomenda_itens(descricao)')
      .eq('cliente_id', cliente.id)
      .in('status', STATUS_VISIVEIS_ENCOMENDA),
    supabase.from('locacoes')
      .select('id, titulo, status, data_retirada, locacao_itens(descricao)')
      .eq('cliente_id', cliente.id)
      .in('status', STATUS_VISIVEIS_LOCACAO),
  ])

  const pedidos = [
    ...(encRes.data ?? []).map(e => ({
      id: e.id,
      titulo: e.titulo,
      tipo: 'encomenda' as const,
      status: e.status,
      data: e.data_entrega,
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