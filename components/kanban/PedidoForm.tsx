'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Loader2, Plus, Trash2, Search, CheckSquare, Square } from 'lucide-react'
import type { Encomenda, Locacao, FormaPagamento } from '@/types'
import { formatarMoeda, calcularRestante } from '@/lib/utils'

const formasPagamento: FormaPagamento[] = ['Pix', 'Dinheiro', 'Cartão de Débito', 'Cartão de Crédito']

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-zinc-400 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

const schema = z.object({
  cliente_id: z.string().min(1, 'Selecione um cliente'),
  data_pedido: z.string(),
  data_entrega: z.string().optional(),
  data_retirada: z.string().optional(),
  data_devolucao: z.string().optional(),
  pedido_fila: z.boolean().optional(),
  valor_total: z.coerce.number().min(0),
  valor_sinal: z.coerce.number().min(0),
  forma_pagamento_sinal: z.string().optional(),
  restante_pago: z.boolean(),
  forma_pagamento_restante: z.string().optional(),
  observacoes: z.string().optional(),
  itens: z.array(z.object({ quantidade: z.coerce.number().min(1).default(1), descricao: z.string(), concluido: z.boolean() })),
})

type FormData = z.infer<typeof schema>

interface Props {
  tipo: 'encomenda' | 'locacao'
  item?: Encomenda | Locacao
}

export default function PedidoForm({ tipo, item }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clienteBusca, setClienteBusca] = useState('')
  const [clienteNome, setClienteNome] = useState(item ? (item as any).clientes?.nome ?? '' : '')
  const [resultadosBusca, setResultadosBusca] = useState<{ id: string; nome: string; cpf: string }[]>([])
  const [buscandoCliente, setBuscandoCliente] = useState(false)

  const isLocacao = tipo === 'locacao'
  const tabela = isLocacao ? 'locacoes' : 'encomendas'
  const itenTabela = isLocacao ? 'locacao_itens' : 'encomenda_itens'
  const itenField = isLocacao ? 'locacao_id' : 'encomenda_id'

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      cliente_id: item?.cliente_id ?? '',
      data_pedido: item?.data_pedido ?? new Date().toISOString().slice(0, 10),
      data_entrega: isLocacao ? undefined : (item as Encomenda)?.data_entrega ?? '',
      data_retirada: isLocacao ? (item as Locacao)?.data_retirada ?? '' : undefined,
      data_devolucao: isLocacao ? (item as Locacao)?.data_devolucao ?? '' : undefined,
      pedido_fila: isLocacao ? undefined : (item as Encomenda)?.pedido_fila ?? false,
      valor_total: item?.valor_total ?? 0,
      valor_sinal: item?.valor_sinal ?? 0,
      forma_pagamento_sinal: item?.forma_pagamento_sinal ?? '',
      restante_pago: item?.restante_pago ?? false,
      forma_pagamento_restante: item?.forma_pagamento_restante ?? '',
      observacoes: item?.observacoes ?? '',
      itens: ((isLocacao ? (item as Locacao)?.locacao_itens : (item as Encomenda)?.encomenda_itens) ?? []).map(i => ({
        quantidade: (i as any).quantidade ?? 1,
        descricao: i.descricao,
        concluido: i.concluido,
      })),
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'itens' })
  const [valorTotalStr, setValorTotalStr] = useState(item?.valor_total ? String(item.valor_total) : '')
  const [valorSinalStr, setValorSinalStr] = useState(item?.valor_sinal ? String(item.valor_sinal) : '')
  const valorTotalNum = parseFloat(valorTotalStr.replace(',', '.')) || 0
  const valorSinalNum = parseFloat(valorSinalStr.replace(',', '.')) || 0
  const restante = calcularRestante(valorTotalNum, valorSinalNum)

  useEffect(() => {
    if (!clienteBusca.trim()) { setResultadosBusca([]); return }
    const t = setTimeout(async () => {
      setBuscandoCliente(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('clientes')
        .select('id, nome, cpf')
        .or(`nome.ilike.%${clienteBusca}%,cpf.ilike.%${clienteBusca}%`)
        .limit(5)
      setResultadosBusca(data ?? [])
      setBuscandoCliente(false)
    }, 300)
    return () => clearTimeout(t)
  }, [clienteBusca])

  function selecionarCliente(c: { id: string; nome: string; cpf: string }) {
    setValue('cliente_id', c.id)
    setClienteNome(c.nome)
    setClienteBusca('')
    setResultadosBusca([])
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    const supabase = createClient()

    const payload: any = {
      cliente_id: data.cliente_id,
      data_pedido: data.data_pedido,
      valor_total: data.valor_total,
      valor_sinal: data.valor_sinal,
      forma_pagamento_sinal: data.forma_pagamento_sinal || null,
      restante_pago: data.restante_pago,
      forma_pagamento_restante: data.forma_pagamento_restante || null,
      observacoes: data.observacoes || null,
    }

    if (isLocacao) {
      payload.data_retirada = data.data_retirada || null
      payload.data_devolucao = data.data_devolucao || null
    } else {
      payload.data_entrega = data.data_entrega || null
      payload.pedido_fila = data.pedido_fila ?? false
    }

    let id = item?.id

    if (item?.id) {
      const { error } = await supabase.from(tabela).update(payload).eq('id', item.id)
      if (error) { toast.error('Erro ao salvar.'); setLoading(false); return }

      await supabase.from(itenTabela).delete().eq(itenField, item.id)
    } else {
      // Gerar título
      const { count: pedidosCliente } = await supabase
        .from(tabela).select('*', { count: 'exact', head: true }).eq('cliente_id', data.cliente_id)
      const numPedido = (pedidosCliente ?? 0) + 1
      payload.titulo = numPedido === 1 ? clienteNome : `${clienteNome} — Pedido ${String(numPedido).padStart(2, '0')}`
      payload.status = 'Pedido'

      let novo = null
      for (let tentativa = 0; tentativa < 3; tentativa++) {
        payload.codigo = `ML-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
        const { data: d, error: e } = await supabase.from(tabela).insert(payload).select().single()
        if (!e) { novo = d; break }
        if (e.code !== '23505') { toast.error('Erro ao criar.'); setLoading(false); return }
      }
      if (!novo) { toast.error('Erro ao criar: código duplicado. Tente novamente.'); setLoading(false); return }
      id = novo.id
    }

    if (data.itens.length > 0 && id) {
      await supabase.from(itenTabela).insert(
        data.itens.map(it => ({ [itenField]: id, quantidade: it.quantidade ?? 1, descricao: it.descricao, concluido: it.concluido }))
      )
    }

    toast.success(item ? 'Salvo!' : 'Criado!')

    // Gera contrato automaticamente ao criar nova locação
    if (!item?.id && isLocacao && id) {
      try {
        const res = await fetch('/api/contratos/gerar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locacao_id: id }),
        })
        const ct = await res.json()
        if (ct.numero) toast.success(`Contrato Nº ${ct.numero} gerado!`)
        else toast.error('Aviso: contrato não pôde ser gerado.')
      } catch {
        toast.error('Aviso: contrato não pôde ser gerado.')
      }
    }

    router.push(`/${tabela}/${id}`)
    router.refresh()
  }



  const pagIndicator = () => {
    if (watch('restante_pago')) return { color: 'bg-green-500', text: '100% pago', cls: 'text-green-400' }
    if (valorSinalNum > 0) return { color: 'bg-yellow-500', text: 'Sinal pago', cls: 'text-yellow-400' }
    return { color: 'bg-red-500', text: 'Nada pago', cls: 'text-red-400' }
  }
  const pag = pagIndicator()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Cliente */}
      <section className="gold-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gold font-display">Cliente</h2>
        {clienteNome ? (
          <div className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2.5">
            <span className="text-white text-sm">{clienteNome}</span>
            <button type="button" onClick={() => { setValue('cliente_id', ''); setClienteNome('') }} className="text-xs text-zinc-400 hover:text-white">Trocar</button>
          </div>
        ) : (
          <div className="relative">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar cliente por nome ou CPF..."
                value={clienteBusca}
                onChange={e => setClienteBusca(e.target.value)}
                className="input-dark pl-9"
              />
              {buscandoCliente && <Loader2 size={14} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />}
            </div>
            {resultadosBusca.length > 0 && (
              <div className="absolute z-10 left-0 right-0 bg-zinc-800 border border-zinc-700 rounded-lg mt-1 shadow-lg overflow-hidden">
                {resultadosBusca.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selecionarCliente(c)}
                    className="w-full text-left px-3 py-2.5 hover:bg-zinc-700 transition-colors"
                  >
                    <p className="text-white text-sm">{c.nome}</p>
                    <p className="text-zinc-400 text-xs">{c.cpf}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {errors.cliente_id && <p className="text-red-400 text-xs">{errors.cliente_id.message}</p>}
      </section>

      {/* Datas */}
      <section className="gold-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gold font-display">Datas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Data do pedido">
            <input {...register('data_pedido')} type="date" className="input-dark" />
          </Field>
          {!isLocacao && (
            <Field label="Data de entrega">
              <input {...register('data_entrega')} type="date" className="input-dark" />
            </Field>
          )}
          {isLocacao && (
            <>
              <Field label="Data de retirada">
                <input {...register('data_retirada')} type="date" className="input-dark" />
              </Field>
              <Field label="Data de devolução">
                <input {...register('data_devolucao')} type="date" className="input-dark" />
              </Field>
            </>
          )}
        </div>
        {!isLocacao && (
          <label className="flex items-start gap-2 cursor-pointer pt-1">
            <input {...register('pedido_fila')} type="checkbox" className="accent-gold w-4 h-4 mt-0.5" />
            <span className="text-sm text-zinc-300">
              Pedido em fila de espera
              <span className="block text-xs text-zinc-500">
                Na consulta pública, o cliente não vê a data de entrega — em vez disso, vê sua posição na fila (1º, 2º, 3º...)
              </span>
            </span>
          </label>
        )}
      </section>

      {/* Itens */}
      <section className="gold-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gold font-display">Itens do pedido</h2>
          <button
            type="button"
            onClick={() => append({ quantidade: 1, descricao: '', concluido: false })}
            className="flex items-center gap-1.5 text-xs text-gold hover:text-gold-light transition-colors"
          >
            <Plus size={14} />
            Adicionar item
          </button>
        </div>
        {fields.length === 0 && (
          <p className="text-zinc-600 text-sm text-center py-4">Nenhum item. Clique em "Adicionar item".</p>
        )}
        <div className="space-y-2">
          {fields.map((field, i) => {
            const concluido = watch(`itens.${i}.concluido`)
            return (
              <div key={field.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setValue(`itens.${i}.concluido`, !concluido)}
                  className="flex-shrink-0 text-zinc-500 hover:text-gold transition-colors"
                >
                  {concluido ? <CheckSquare size={16} className="text-gold" /> : <Square size={16} />}
                </button>
                <input
                  {...register(`itens.${i}.quantidade`, { valueAsNumber: true })}
                  type="number"
                  min="1"
                  className="input-dark w-16 text-center flex-shrink-0"
                  placeholder="Qtd"
                />
                <input
                  {...register(`itens.${i}.descricao`)}
                  className={`input-dark flex-1 ${concluido ? 'line-through text-zinc-500' : ''}`}
                  placeholder="Descrição do item..."
                />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="flex-shrink-0 text-zinc-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* Pagamento */}
      <section className="gold-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gold font-display">Pagamento</h2>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${pag.color}`} />
            <span className={`text-xs ${pag.cls}`}>{pag.text}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Valor total (R$)">
            <input
              value={valorTotalStr}
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              className="input-dark"
              onChange={e => {
                const v = e.target.value.replace(/[^\d.,]/g, '')
                setValorTotalStr(v)
                setValue('valor_total', parseFloat(v.replace(',', '.')) || 0)
              }}
            />
          </Field>
          <Field label="Sinal (R$)">
            <input
              value={valorSinalStr}
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              className="input-dark"
              onChange={e => {
                const v = e.target.value.replace(/[^\d.,]/g, '')
                setValorSinalStr(v)
                setValue('valor_sinal', parseFloat(v.replace(',', '.')) || 0)
              }}
            />
          </Field>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Restante (calculado)</label>
            <div className="input-dark bg-zinc-900 text-zinc-300">{formatarMoeda(restante)}</div>
          </div>
          <Field label="Forma pagamento — sinal">
            <select {...register('forma_pagamento_sinal')} className="input-dark">
              <option value="">Selecionar...</option>
              {formasPagamento.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
          <Field label="Restante — status">
            <div className="flex items-center gap-3 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input {...register('restante_pago')} type="checkbox" className="accent-gold w-4 h-4" />
                <span className="text-sm text-zinc-300">Restante pago</span>
              </label>
            </div>
          </Field>
          <Field label="Forma pagamento — restante">
            <select {...register('forma_pagamento_restante')} className="input-dark">
              <option value="">Selecionar...</option>
              {formasPagamento.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
        </div>
      </section>

      {/* Observações */}
      <section className="gold-card p-5">
        <Field label="Observações">
          <textarea {...register('observacoes')} rows={3} className="input-dark resize-none" placeholder="Observações adicionais..." />
        </Field>
      </section>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="ghost-btn">Cancelar</button>
        <button type="submit" disabled={loading} className="gold-btn flex items-center gap-2">
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? 'Salvando...' : item ? 'Salvar alterações' : 'Criar pedido'}
        </button>
      </div>
    </form>
  )
}
