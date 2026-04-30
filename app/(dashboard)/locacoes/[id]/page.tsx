import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import PedidoDetalhe from '@/components/kanban/PedidoDetalhe'

export const revalidate = 0

export default async function LocacaoDetalhePage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('locacoes')
    .select('*, clientes(*), locacao_itens(*)')
    .eq('id', params.id)
    .single()

  if (!data) notFound()
  return <PedidoDetalhe item={data} tipo="locacao" />
}
