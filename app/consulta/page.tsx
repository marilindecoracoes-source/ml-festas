'use client'

import { useState } from 'react'
import { Search, Package, Tent, Loader2, CheckCircle } from 'lucide-react'
import { formatarData } from '@/lib/utils'

interface PedidoConsulta {
  id: string
  titulo: string
  tipo: 'encomenda' | 'locacao'
  status: string
  data: string | null
  posicaoFila?: number | null
  itens: string[]
}

const ETAPAS_ENCOMENDA = ['Pedido', 'Em Produção', 'Pronto']
const ETAPAS_LOCACAO = ['Pedido', 'Em Produção', 'Pronto']

function BarraProgresso({ etapas, statusAtual }: { etapas: string[]; statusAtual: string }) {
  const idx = etapas.indexOf(statusAtual)
  return (
    <div className="flex items-center gap-0 mt-3">
      {etapas.map((etapa, i) => {
        const done = i <= idx
        const current = i === idx
        return (
          <div key={etapa} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                done ? 'bg-gold border-gold' : 'border-zinc-600 bg-transparent'
              }`}>
                {done && <CheckCircle size={14} className="text-black" />}
              </div>
              <p className={`text-xs mt-1 text-center whitespace-nowrap ${done ? 'text-gold' : 'text-zinc-600'} ${current ? 'font-medium' : ''}`}>
                {etapa}
              </p>
            </div>
            {i < etapas.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 transition-colors ${i < idx ? 'bg-gold' : 'bg-zinc-700'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function ConsultaPage() {
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [pedidos, setPedidos] = useState<PedidoConsulta[] | null>(null)
  const [buscado, setBuscado] = useState(false)

  function formatCpf(v: string) {
    return v.replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  async function consultar(e: React.FormEvent) {
    e.preventDefault()
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) return
    setLoading(true)
    setBuscado(false)
    const res = await fetch(`/api/consulta?cpf=${cpfLimpo}`)
    const data = await res.json()
    setPedidos(data.pedidos ?? [])
    setBuscado(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ backgroundColor: '#111111' }}>
      <div className="max-w-lg mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <img src="/logo.png" alt="ML Festas" className="h-36 w-36 mx-auto object-contain rounded-full" />
          <p className="text-zinc-400 text-sm mt-2">Consulte o status do seu pedido</p>
        </div>

        {/* Busca */}
        <div className="gold-card p-6">
          <form onSubmit={consultar} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">CPF</label>
              <input
                type="text"
                value={cpf}
                onChange={e => setCpf(formatCpf(e.target.value))}
                className="input-dark text-lg tracking-widest"
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
            <button
              type="submit"
              disabled={loading || cpf.replace(/\D/g, '').length !== 11}
              className="gold-btn w-full flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {loading ? 'Consultando...' : 'Consultar pedido'}
            </button>
          </form>
        </div>

        {/* Resultados */}
        {buscado && (
          <div className="space-y-4">
            {!pedidos || pedidos.length === 0 ? (
              <div className="gold-card p-8 text-center">
                <p className="text-zinc-400">Nenhum pedido em andamento encontrado para este CPF.</p>
              </div>
            ) : (
              pedidos.map(pedido => {
                const etapas = pedido.tipo === 'encomenda' ? ETAPAS_ENCOMENDA : ETAPAS_LOCACAO
                return (
                  <div key={pedido.id} className="gold-card p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {pedido.tipo === 'encomenda'
                          ? <Package size={16} className="text-gold flex-shrink-0" />
                          : <Tent size={16} className="text-zinc-400 flex-shrink-0" />
                        }
                        <div>
                          <p className="text-white font-medium text-sm">{pedido.titulo}</p>
                          <p className="text-zinc-500 text-xs capitalize">{pedido.tipo}</p>
                        </div>
                      </div>
                      {pedido.posicaoFila != null ? (
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-zinc-500">Fila</p>
                          <p className="text-sm text-gold font-medium">{pedido.posicaoFila}º</p>
                        </div>
                      ) : pedido.data && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-zinc-500">{pedido.tipo === 'encomenda' ? 'Entrega' : 'Retirada'}</p>
                          <p className="text-sm text-gold font-medium">{formatarData(pedido.data)}</p>
                        </div>
                      )}
                    </div>

                    <BarraProgresso etapas={etapas} statusAtual={pedido.status} />

                    {pedido.itens.length > 0 && (
                      <div className="border-t border-zinc-800 pt-4">
                        <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wide">Itens do pedido</p>
                        <ul className="space-y-1">
                          {pedido.itens.map((item, i) => (
                            <li key={i} className="text-sm text-zinc-300 flex items-start gap-1.5">
                              <span className="text-gold mt-0.5">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        <p className="text-center text-zinc-700 text-xs">ML Festas © {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
