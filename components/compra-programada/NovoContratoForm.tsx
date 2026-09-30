'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Loader2, Search } from 'lucide-react'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-zinc-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export default function NovoContratoForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [clienteId, setClienteId] = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [clienteBusca, setClienteBusca] = useState('')
  const [resultadosBusca, setResultadosBusca] = useState<{ id: string; nome: string; cpf: string }[]>([])
  const [buscandoCliente, setBuscandoCliente] = useState(false)

  const [valorParcela, setValorParcela] = useState('100')
  const [prazoMeses, setPrazoMeses] = useState('10')
  const [valorCredito, setValorCredito] = useState('1000')
  const [diaVencimento, setDiaVencimento] = useState('5')

  const [erro, setErro] = useState('')

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
    setClienteId(c.id)
    setClienteNome(c.nome)
    setClienteBusca('')
    setResultadosBusca([])
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!clienteId) { setErro('Selecione um cliente.'); return }
    const parcela = parseFloat(valorParcela.replace(',', '.'))
    const prazo = parseInt(prazoMeses)
    const credito = parseFloat(valorCredito.replace(',', '.'))
    const vencimento = parseInt(diaVencimento)
    if (!parcela || parcela <= 0) { setErro('Informe um valor de parcela válido.'); return }
    if (!prazo || prazo <= 0) { setErro('Informe um prazo válido.'); return }
    if (!credito || credito <= 0) { setErro('Informe um valor de crédito válido.'); return }
    if (!vencimento || vencimento < 1 || vencimento > 28) { setErro('Informe um dia de vencimento válido (1 a 28).'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/compra-programada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: clienteId,
          valor_parcela: parcela,
          prazo_meses: prazo,
          valor_credito: credito,
          dia_vencimento: vencimento,
        }),
      })
      const body = await res.json()
      if (!res.ok) {
        toast.error(body.error ?? 'Erro ao criar contrato.')
        setLoading(false)
        return
      }
      toast.success(`Contrato Nº ${body.numero} criado!`)
      router.push('/compra-programada')
      router.refresh()
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Cliente */}
      <section className="gold-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gold font-display">Cliente</h2>
        {clienteNome ? (
          <div className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2.5">
            <span className="text-white text-sm">{clienteNome}</span>
            <button type="button" onClick={() => { setClienteId(''); setClienteNome('') }} className="text-xs text-zinc-400 hover:text-white">Trocar</button>
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
      </section>

      {/* Termos do plano */}
      <section className="gold-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gold font-display">Termos do Plano</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Valor da parcela (R$)">
            <input
              type="text"
              inputMode="decimal"
              value={valorParcela}
              onChange={e => setValorParcela(e.target.value)}
              className="input-dark"
            />
          </Field>
          <Field label="Prazo (meses)">
            <input
              type="number"
              min={1}
              value={prazoMeses}
              onChange={e => setPrazoMeses(e.target.value)}
              className="input-dark"
            />
          </Field>
          <Field label="Crédito total (R$)">
            <input
              type="text"
              inputMode="decimal"
              value={valorCredito}
              onChange={e => setValorCredito(e.target.value)}
              className="input-dark"
            />
          </Field>
          <Field label="Dia do vencimento">
            <input
              type="number"
              min={1}
              max={28}
              value={diaVencimento}
              onChange={e => setDiaVencimento(e.target.value)}
              className="input-dark"
            />
          </Field>
        </div>
      </section>

      {erro && (
        <div className="rounded-lg bg-red-950/50 border border-red-800/50 px-4 py-3">
          <p className="text-red-400 text-sm">{erro}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="gold-btn w-full flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? 'Criando...' : 'Criar Contrato'}
      </button>
    </form>
  )
}
