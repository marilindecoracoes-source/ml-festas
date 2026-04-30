'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Edit2, CheckSquare, Square } from 'lucide-react'
import type { Encomenda, Locacao } from '@/types'
import { formatarMoeda, formatarData, formatarCPF } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import PedidoForm from './PedidoForm'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Props {
  item: (Encomenda | Locacao) & { clientes?: any; encomenda_itens?: any[]; locacao_itens?: any[] }
  tipo: 'encomenda' | 'locacao'
}

const statusEncVariant: Record<string, any> = {
  'Pedido': 'gray', 'Em Produção': 'gold', 'Pronto': 'blue', 'Material Retirado': 'green'
}
const statusLocVariant: Record<string, any> = {
  'Pedido': 'gray', 'Em Produção': 'gold', 'Pronto': 'blue', 'Retirado': 'blue', 'Devolvido': 'green'
}

export default function PedidoDetalhe({ item, tipo }: Props) {
  const [editando, setEditando] = useState(false)
  const isLocacao = tipo === 'locacao'
  const loc = isLocacao ? item as Locacao : null
  const enc = !isLocacao ? item as Encomenda : null
  const itensIniciais = (isLocacao ? (item as any).locacao_itens : (item as any).encomenda_itens) ?? []
  const [localItens, setLocalItens] = useState(itensIniciais)
  const statusVariant = isLocacao ? statusLocVariant : statusEncVariant

  async function toggleItem(itemId: string, concluido: boolean) {
    const supabase = createClient()
    const tabela = isLocacao ? 'locacao_itens' : 'encomenda_itens'
    const { error } = await supabase.from(tabela).update({ concluido: !concluido }).eq('id', itemId)
    if (!error) {
      setLocalItens((prev: any[]) => prev.map(it => it.id === itemId ? { ...it, concluido: !concluido } : it))
      toast.success(concluido ? 'Item desmarcado' : 'Item concluído')
    }
  }

  const restante = item.restante_pago ? 0 : Math.max(0, item.valor_total - item.valor_sinal)
  const pag = item.restante_pago && item.valor_sinal >= 0
    ? { label: '100% pago', color: 'text-green-400' }
    : item.valor_sinal > 0
    ? { label: 'Sinal pago', color: 'text-yellow-400' }
    : { label: 'Nada pago', color: 'text-red-400' }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={isLocacao ? '/locacoes' : '/encomendas'} className="p-2 text-zinc-400 hover:text-white">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-display font-bold text-white">{item.titulo}</h1>
              <Badge variant={statusVariant[item.status]}>{item.status}</Badge>
            </div>
            <p className="text-zinc-500 text-sm">{item.codigo} · {isLocacao ? 'Locação' : 'Encomenda'}</p>
          </div>
        </div>
        <button onClick={() => setEditando(!editando)} className="ghost-btn flex items-center gap-2 text-sm flex-shrink-0">
          <Edit2 size={14} />
          {editando ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      {editando ? (
        <PedidoForm tipo={tipo} item={item} />
      ) : (
        <div className="space-y-5">
          {/* Cliente */}
          {item.clientes && (
            <div className="gold-card p-5">
              <h3 className="text-gold font-medium text-sm font-display mb-3">Cliente</h3>
              <Link href={`/clientes/${item.cliente_id}`} className="text-white hover:text-gold transition-colors font-medium">
                {item.clientes.nome}
              </Link>
              <p className="text-zinc-500 text-sm">{formatarCPF(item.clientes.cpf)}</p>
            </div>
          )}

          {/* Datas */}
          <div className="gold-card p-5">
            <h3 className="text-gold font-medium text-sm font-display mb-3">Datas</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div><p className="text-zinc-500 text-xs">Pedido</p><p className="text-white">{formatarData(item.data_pedido)}</p></div>
              {enc?.data_entrega && <div><p className="text-zinc-500 text-xs">Entrega</p><p className="text-white">{formatarData(enc.data_entrega)}</p></div>}
              {loc?.data_retirada && <div><p className="text-zinc-500 text-xs">Retirada</p><p className="text-white">{formatarData(loc.data_retirada)}</p></div>}
              {loc?.data_devolucao && <div><p className="text-zinc-500 text-xs">Devolução</p><p className="text-white">{formatarData(loc.data_devolucao)}</p></div>}
            </div>
          </div>

          {/* Itens */}
          {localItens.length > 0 && (
            <div className="gold-card p-5">
              <h3 className="text-gold font-medium text-sm font-display mb-3">Itens ({localItens.length})</h3>
              <div className="space-y-2">
                {localItens.map((it: any) => (
                  <div key={it.id} className="flex items-center gap-2.5">
                    <button
                      onClick={() => toggleItem(it.id, it.concluido)}
                      className="flex-shrink-0 text-zinc-500 hover:text-gold transition-colors"
                    >
                      {it.concluido ? <CheckSquare size={16} className="text-gold" /> : <Square size={16} />}
                    </button>
                    <span className={`text-sm ${it.concluido ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                      {(it.quantidade ?? 1) > 1 && (
                        <span className="text-gold font-medium mr-1">{it.quantidade}x</span>
                      )}
                      {it.descricao}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagamento */}
          <div className="gold-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gold font-medium text-sm font-display">Pagamento</h3>
              <span className={`text-xs font-medium ${pag.color}`}>{pag.label}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><p className="text-zinc-500 text-xs">Total</p><p className="text-white font-medium">{formatarMoeda(item.valor_total)}</p></div>
              <div>
                <p className="text-zinc-500 text-xs">Sinal</p>
                <p className="text-white font-medium">{formatarMoeda(item.valor_sinal)}</p>
                {item.forma_pagamento_sinal && <p className="text-zinc-500 text-xs">{item.forma_pagamento_sinal}</p>}
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Restante</p>
                <p className={`font-medium ${item.restante_pago ? 'text-green-400' : 'text-red-400'}`}>{formatarMoeda(restante)}</p>
                {item.forma_pagamento_restante && <p className="text-zinc-500 text-xs">{item.forma_pagamento_restante}</p>}
              </div>
            </div>
          </div>

          {/* Observações */}
          {item.observacoes && (
            <div className="gold-card p-5">
              <h3 className="text-gold font-medium text-sm font-display mb-2">Observações</h3>
              <p className="text-zinc-300 text-sm whitespace-pre-wrap">{item.observacoes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
