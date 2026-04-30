import { Draggable } from '@hello-pangea/dnd'
import { Calendar, AlertTriangle } from 'lucide-react'
import { formatarData, formatarMoeda } from '@/lib/utils'
import type { Encomenda, Locacao } from '@/types'
import Link from 'next/link'
import { isAfter, parseISO } from 'date-fns'

interface KanbanCardProps {
  item: (Encomenda | Locacao) & { clientes?: { nome: string } }
  index: number
  tipo: 'encomenda' | 'locacao'
}

function pagamentoIndicator(item: Encomenda | Locacao) {
  const total = item.valor_total
  const sinal = item.valor_sinal
  if (total === 0) return null
  if (item.restante_pago) return { color: 'bg-green-500', label: '100% pago' }
  if (sinal > 0) return { color: 'bg-yellow-500', label: 'Sinal pago' }
  return { color: 'bg-red-500', label: 'Nada pago' }
}

export default function KanbanCard({ item, index, tipo }: KanbanCardProps) {
  const pag = pagamentoIndicator(item)
  const isLocacao = tipo === 'locacao'
  const loc = isLocacao ? (item as Locacao) : null
  const enc = !isLocacao ? (item as Encomenda) : null
  const atrasada = loc && loc.data_devolucao && loc.status !== 'Devolvido' &&
    isAfter(new Date(), parseISO(loc.data_devolucao))

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        // Outer div: owns DnD positioning — never overwrite its style
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-2 cursor-grab active:cursor-grabbing"
        >
          {/* Inner div: purely visual — transform here is independent of DnD positioning */}
          <div
            className={`border rounded-2xl p-3.5 transition-[border-color,box-shadow,opacity,background-color] duration-200 ${
              snapshot.isDragging
                ? 'border-gold/50 shadow-xl shadow-gold/15 rotate-1 scale-[1.02] opacity-95'
                : atrasada
                ? 'border-red-800/50 hover:border-red-700/60'
                : 'border-zinc-800/50 hover:border-zinc-700/70'
            }`}
            style={{ backgroundColor: '#111119' }}
          >
            {atrasada && (
              <div className="flex items-center gap-1.5 mb-2 text-xs text-red-400">
                <AlertTriangle size={12} />
                Devolução em atraso
              </div>
            )}

            <Link href={`/${isLocacao ? 'locacoes' : 'encomendas'}/${item.id}`} className="hover:text-gold transition-colors">
              <p className="text-white text-sm font-medium leading-snug">{item.titulo}</p>
            </Link>
            <p className="text-zinc-500 text-xs mt-0.5">{item.codigo}</p>

            <div className="mt-3 space-y-1.5">
              {enc?.data_entrega && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Calendar size={11} />
                  Entrega: {formatarData(enc.data_entrega)}
                </div>
              )}
              {loc?.data_retirada && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Calendar size={11} />
                  Retirada: {formatarData(loc.data_retirada)}
                </div>
              )}
              {loc?.data_devolucao && (
                <div className={`flex items-center gap-1.5 text-xs ${atrasada ? 'text-red-400' : 'text-zinc-400'}`}>
                  <Calendar size={11} />
                  Devolução: {formatarData(loc.data_devolucao)}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gold font-medium">{formatarMoeda(item.valor_total)}</span>
                {pag && (
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${pag.color}`} />
                    <span className="text-xs text-zinc-500">{pag.label}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}
