import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ClienteDetalhe from '@/components/clientes/ClienteDetalhe'

export const revalidate = 0

export default async function ClienteDetalhePage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  const [cliRes, docRes, encRes, locRes] = await Promise.all([
    supabase.from('clientes').select('*').eq('id', params.id).single(),
    supabase.from('cliente_documentos').select('*').eq('cliente_id', params.id).order('created_at', { ascending: false }),
    supabase.from('encomendas').select('id, codigo, titulo, status, data_entrega, valor_total, created_at').eq('cliente_id', params.id).order('created_at', { ascending: false }),
    supabase.from('locacoes').select('id, codigo, titulo, status, data_retirada, data_devolucao, valor_total, created_at').eq('cliente_id', params.id).order('created_at', { ascending: false }),
  ])

  if (!cliRes.data) notFound()

  return (
    <ClienteDetalhe
      cliente={cliRes.data}
      documentos={docRes.data ?? []}
      encomendas={encRes.data ?? []}
      locacoes={locRes.data ?? []}
    />
  )
}
