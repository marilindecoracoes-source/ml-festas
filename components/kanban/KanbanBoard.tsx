'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd'
import KanbanCard from './KanbanCard'
import toast from 'react-hot-toast'
import type { Encomenda, Locacao, StatusEncomenda, StatusLocacao } from '@/types'
import { Plus } from 'lucide-react'
import Link from 'next/link'

type TipoItem = 'encomenda' | 'locacao'

interface KanbanBoardProps {
  items: ((Encomenda | Locacao) & { clientes?: { nome: string } })[]
  colunas: { id: string; label: string }[]
  tipo: TipoItem
  tabela: 'encomendas' | 'locacoes'
}

export default function KanbanBoard({ items: itemsIniciais, colunas, tipo, tabela }: KanbanBoardProps) {
  const router = useRouter()
  const [items, setItems] = useState(itemsIniciais)

  function getItensDaColuna(status: string) {
    return items.filter(i => i.status === status)
  }

  async function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result
    if (!destination || destination.droppableId === source.droppableId) return

    const novoStatus = destination.droppableId
    const autoPago =
      (tabela === 'encomendas' && novoStatus === 'Material Retirado') ||
      (tabela === 'locacoes' && novoStatus === 'Retirado')

    // Optimistic update
    setItems(prev => prev.map(i =>
      i.id === draggableId ? { ...i, status: novoStatus as any, ...(autoPago ? { restante_pago: true } : {}) } : i
    ))

    const item = items.find(i => i.id === draggableId)
    const updatePayload: Record<string, unknown> = { status: novoStatus }
    if (autoPago) updatePayload.restante_pago = true

    const res = await fetch(`/api/${tabela}/${draggableId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    })

    if (!res.ok) {
      setItems(prev => prev.map(i => i.id === draggableId ? { ...i, status: source.droppableId as any } : i))
      toast.error('Erro ao atualizar status.')
      return
    }

    // Quando concluído, soma ao total gasto do cliente
    if (
      (tabela === 'encomendas' && novoStatus === 'Material Retirado') ||
      (tabela === 'locacoes' && novoStatus === 'Devolvido')
    ) {
      if (item?.cliente_id) {
        const cliRes = await fetch(`/api/clientes/${item.cliente_id}`)
        if (cliRes.ok) {
          const cli = await cliRes.json()
          await fetch(`/api/clientes/${item.cliente_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ total_gasto: (cli.total_gasto ?? 0) + (item.valor_total ?? 0) }),
          })
        }
      }
    }

    toast.success('Status atualizado!')
    router.refresh()
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {colunas.map(col => {
          const colItems = getItensDaColuna(col.id)
          return (
            <div key={col.id} className="flex-shrink-0 w-72">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-zinc-300">{col.label}</h3>
                  <span className="text-xs bg-white/5 text-zinc-500 rounded-full px-2 py-0.5">{colItems.length}</span>
                </div>
                {col.id === colunas[0].id && (
                  <Link
                    href={`/${tabela}/novo`}
                    className="p-1 text-zinc-500 hover:text-gold transition-colors"
                    title="Novo pedido"
                  >
                    <Plus size={16} />
                  </Link>
                )}
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-32 rounded-2xl p-2 transition-colors ${
                      snapshot.isDraggingOver ? 'border border-gold/20' : 'border border-transparent'
                    }`}
                    style={{ backgroundColor: snapshot.isDraggingOver ? 'rgba(201,168,76,0.04)' : 'rgba(17,17,25,0.4)' }}
                  >
                    {colItems.map((item, index) => (
                      <KanbanCard key={item.id} item={item} index={index} tipo={tipo} />
                    ))}
                    {provided.placeholder}
                    {colItems.length === 0 && !snapshot.isDraggingOver && (
                      <p className="text-zinc-700 text-xs text-center py-6">Sem pedidos</p>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )
}
