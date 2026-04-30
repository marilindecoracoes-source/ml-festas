import { createServerSupabaseClient } from '@/lib/supabase-server'
import KanbanBoard from '@/components/kanban/KanbanBoard'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export const revalidate = 0

const COLUNAS_LOCACAO = [
  { id: 'Pedido', label: 'Pedido' },
  { id: 'Em Produção', label: 'Em Produção' },
  { id: 'Pronto', label: 'Pronto' },
  { id: 'Retirado', label: 'Retirado' },
  { id: 'Devolvido', label: 'Devolvido' },
]

export default async function LocacoesPage() {
  const supabase = createServerSupabaseClient()
  const { data: locacoes } = await supabase
    .from('locacoes')
    .select('*, clientes(nome)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Locações</h1>
          <p className="text-zinc-400 text-sm">{locacoes?.length ?? 0} locaç{(locacoes?.length ?? 0) !== 1 ? 'ões' : 'ão'}</p>
        </div>
        <Link href="/locacoes/novo" className="gold-btn flex items-center gap-2">
          <Plus size={16} />
          Nova Locação
        </Link>
      </div>

      <KanbanBoard
        items={locacoes ?? []}
        colunas={COLUNAS_LOCACAO}
        tipo="locacao"
        tabela="locacoes"
      />
    </div>
  )
}
