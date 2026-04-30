import { createServerSupabaseClient } from '@/lib/supabase-server'
import KanbanBoard from '@/components/kanban/KanbanBoard'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export const revalidate = 0

const COLUNAS_ENCOMENDA = [
  { id: 'Pedido', label: 'Pedido' },
  { id: 'Em Produção', label: 'Em Produção' },
  { id: 'Pronto', label: 'Pronto' },
  { id: 'Material Retirado', label: 'Material Retirado' },
]

export default async function EncomendasPage() {
  const supabase = createServerSupabaseClient()
  const { data: encomendas } = await supabase
    .from('encomendas')
    .select('*, clientes(nome)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Encomendas</h1>
          <p className="text-zinc-400 text-sm">{encomendas?.length ?? 0} encomenda{(encomendas?.length ?? 0) !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/encomendas/novo" className="gold-btn flex items-center gap-2">
          <Plus size={16} />
          Nova Encomenda
        </Link>
      </div>

      <KanbanBoard
        items={encomendas ?? []}
        colunas={COLUNAS_ENCOMENDA}
        tipo="encomenda"
        tabela="encomendas"
      />
    </div>
  )
}
