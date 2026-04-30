import { createServerSupabaseClient } from '@/lib/supabase-server'
import CalendarioView from '@/components/calendario/CalendarioView'

export const revalidate = 0

export default async function CalendarioPage() {
  const supabase = createServerSupabaseClient()

  const [cliRes, encRes, locRes] = await Promise.all([
    supabase.from('clientes').select('id, nome, data_nascimento').not('data_nascimento', 'is', null),
    supabase.from('encomendas').select('id, titulo, data_entrega').neq('status', 'Material Retirado').not('data_entrega', 'is', null),
    supabase.from('locacoes').select('id, titulo, data_retirada, data_devolucao').neq('status', 'Devolvido'),
  ])

  const clientes = cliRes.data ?? []
  const encomendas = encRes.data ?? []
  const locacoes = locRes.data ?? []

  const hoje = new Date()

  const eventos: {
    data: string; tipo: 'aniversario' | 'entrega' | 'retirada' | 'devolucao';
    label: string; href: string; clienteId?: string
  }[] = []

  clientes.forEach(c => {
    if (!c.data_nascimento) return
    const [, mesStr, diaStr] = c.data_nascimento.split('-')
    const aniv = new Date(hoje.getFullYear(), Number(mesStr) - 1, Number(diaStr))
    eventos.push({
      data: aniv.toISOString().slice(0, 10),
      tipo: 'aniversario',
      label: c.nome,
      href: `/clientes/${c.id}`,
      clienteId: c.id,
    })
  })

  encomendas.forEach(e => {
    if (e.data_entrega) {
      eventos.push({ data: e.data_entrega, tipo: 'entrega', label: e.titulo, href: `/encomendas/${e.id}` })
    }
  })

  locacoes.forEach(l => {
    if (l.data_retirada) {
      eventos.push({ data: l.data_retirada, tipo: 'retirada', label: l.titulo, href: `/locacoes/${l.id}` })
    }
    if (l.data_devolucao) {
      eventos.push({ data: l.data_devolucao, tipo: 'devolucao', label: l.titulo, href: `/locacoes/${l.id}` })
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Calendário</h1>
        <p className="text-zinc-400 text-sm">Entregas, retiradas, devoluções e aniversários</p>
      </div>
      <CalendarioView eventos={eventos} />
    </div>
  )
}
