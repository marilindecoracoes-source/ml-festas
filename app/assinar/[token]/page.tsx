'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, AlertCircle, Loader2, FileText, Check } from 'lucide-react'

type Estado = 'carregando' | 'nao_encontrado' | 'ja_assinado' | 'pendente' | 'sucesso' | 'erro'

interface DadosContrato {
  id: string
  numero: string
  status_assinatura: 'pendente' | 'assinado'
  data_assinatura: string | null
  clientes: { nome: string; cpf: string } | null
  locacoes: {
    titulo: string
    data_retirada: string | null
    data_devolucao: string | null
    valor_total: number
  } | null
}

function formatarMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(s: string | null) {
  if (!s) return '—'
  try {
    return new Date(s).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  } catch {
    return s
  }
}

function formatarDataHora(s: string) {
  try {
    return new Date(s).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  } catch {
    return s
  }
}

function mascaraCPF(valor: string) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export default function AssinarPage() {
  const params = useParams()
  const token = params.token as string

  const [estado, setEstado] = useState<Estado>('carregando')
  const [dados, setDados] = useState<DadosContrato | null>(null)
  const [cpf, setCpf] = useState('')
  const [concordou, setConcordou] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erroForm, setErroForm] = useState('')

  const buscarContrato = useCallback(async () => {
    try {
      const res = await fetch(`/api/assinar/${token}`)
      if (res.status === 404) { setEstado('nao_encontrado'); return }
      if (!res.ok) { setEstado('erro'); return }
      const data: DadosContrato = await res.json()
      setDados(data)
      setEstado(data.status_assinatura === 'assinado' ? 'ja_assinado' : 'pendente')
    } catch {
      setEstado('erro')
    }
  }, [token])

  useEffect(() => { buscarContrato() }, [buscarContrato])

  async function assinar() {
    if (!concordou || cpf.replace(/\D/g, '').length < 11) return
    setEnviando(true)
    setErroForm('')
    try {
      const res = await fetch(`/api/assinar/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf }),
      })
      const body = await res.json()
      if (!res.ok) {
        setErroForm(body.error ?? 'Erro ao assinar. Tente novamente.')
        return
      }
      setEstado('sucesso')
    } catch {
      setErroForm('Erro de conexão. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  // ── Estados de loading / erro / fim ──────────────────────────────────────

  if (estado === 'carregando') {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <Loader2 className="text-[#C9A84C] animate-spin" size={36} />
      </div>
    )
  }

  if (estado === 'nao_encontrado') {
    return (
      <Tela>
        <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white text-center">Contrato não encontrado</h1>
        <p className="text-zinc-400 text-center text-sm mt-2">
          Este link é inválido ou o contrato foi removido.
        </p>
      </Tela>
    )
  }

  if (estado === 'erro') {
    return (
      <Tela>
        <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white text-center">Erro ao carregar</h1>
        <p className="text-zinc-400 text-center text-sm mt-2">
          Não foi possível carregar o contrato. Tente novamente mais tarde.
        </p>
      </Tela>
    )
  }

  if (estado === 'ja_assinado') {
    return (
      <Tela>
        <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white text-center">Contrato já assinado</h1>
        {dados?.data_assinatura && (
          <p className="text-zinc-400 text-center text-sm mt-2">
            Este contrato foi assinado em {formatarDataHora(dados.data_assinatura)}.
          </p>
        )}
        <p className="text-zinc-500 text-center text-xs mt-3">
          Contrato Nº {dados?.numero}
        </p>
      </Tela>
    )
  }

  if (estado === 'sucesso') {
    return (
      <Tela>
        <CheckCircle size={56} className="text-green-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white text-center">Contrato assinado!</h1>
        <p className="text-zinc-300 text-center text-sm mt-3">
          Obrigado, <strong className="text-white">{dados?.clientes?.nome}</strong>!<br />
          Seu contrato foi assinado digitalmente com sucesso.
        </p>
        <p className="text-zinc-500 text-center text-xs mt-4">
          Contrato Nº {dados?.numero} · ML Festas
        </p>
      </Tela>
    )
  }

  // ── Estado principal: pendente ────────────────────────────────────────────

  const pdfUrl = `/api/assinar/${token}/pdf`
  const cpfValido = cpf.replace(/\D/g, '').length === 11
  const podeAssinar = cpfValido && concordou && !enviando

  return (
    <div className="min-h-screen bg-[#111111] py-6 px-4">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Header */}
        <div className="text-center pb-2">
          <p className="text-[#C9A84C] font-bold text-lg tracking-wide">ML FESTAS</p>
          <p className="text-zinc-400 text-sm">Marilin Decorações</p>
        </div>

        {/* Card: resumo do contrato */}
        <div className="rounded-xl border border-[#C9A84C]/20 bg-[#1a1a1a] p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={16} className="text-[#C9A84C]" />
            <span className="text-[#C9A84C] font-semibold text-sm">Contrato de Locação Nº {dados?.numero}</span>
          </div>
          <InfoRow label="Cliente" value={dados?.clientes?.nome ?? '—'} />
          <InfoRow label="Locação" value={dados?.locacoes?.titulo ?? '—'} />
          <InfoRow label="Retirada" value={formatarData(dados?.locacoes?.data_retirada ?? null)} />
          <InfoRow label="Devolução" value={formatarData(dados?.locacoes?.data_devolucao ?? null)} />
          <InfoRow label="Valor total" value={formatarMoeda(dados?.locacoes?.valor_total ?? 0)} destaque />
        </div>

        {/* Visualização do contrato em PDF */}
        <div className="rounded-xl border border-[#C9A84C]/20 bg-[#1a1a1a] overflow-hidden">
          <p className="text-zinc-400 text-xs px-4 py-2 border-b border-zinc-800">
            Leia o contrato completo antes de assinar:
          </p>
          <iframe
            src={pdfUrl}
            className="w-full"
            style={{ height: '55vh', minHeight: 320 }}
            title="Contrato de Locação"
          />
        </div>

        {/* Formulário de assinatura */}
        <div className="rounded-xl border border-[#C9A84C]/20 bg-[#1a1a1a] p-5 space-y-4">
          <h2 className="text-white font-semibold text-base">Para assinar, confirme seu CPF:</h2>

          <div>
            <label className="text-zinc-400 text-sm block mb-1.5">CPF</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={e => setCpf(mascaraCPF(e.target.value))}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-600
                         px-4 py-3 text-base focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/40"
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer group">
            <button
              type="button"
              onClick={() => setConcordou(v => !v)}
              className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                ${concordou
                  ? 'bg-[#C9A84C] border-[#C9A84C]'
                  : 'border-zinc-600 group-hover:border-[#C9A84C]/60'
                }`}
            >
              {concordou && <Check size={12} className="text-black" strokeWidth={3} />}
            </button>
            <span className="text-zinc-300 text-sm leading-snug">
              Li e concordo com todos os termos e cláusulas do contrato de locação acima.
            </span>
          </label>

          {erroForm && (
            <div className="rounded-lg bg-red-950/50 border border-red-800/50 px-4 py-3">
              <p className="text-red-400 text-sm">{erroForm}</p>
            </div>
          )}

          <button
            onClick={assinar}
            disabled={!podeAssinar}
            className={`w-full py-4 rounded-xl font-bold text-base transition-all
              ${podeAssinar
                ? 'bg-gradient-to-r from-[#C9A84C] to-[#F0C040] text-black shadow-lg shadow-[#C9A84C]/20 active:scale-[0.98]'
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
          >
            {enviando ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" /> Assinando...
              </span>
            ) : (
              'Assinar Contrato'
            )}
          </button>

          <p className="text-zinc-600 text-xs text-center">
            Sua assinatura digital terá validade legal conforme a MP 2.200-2/2001.
          </p>
        </div>

      </div>
    </div>
  )
}

function Tela({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center px-4">
      <div className="max-w-sm w-full rounded-xl border border-zinc-800 bg-[#1a1a1a] p-8 space-y-2">
        <p className="text-[#C9A84C] font-bold text-center text-sm tracking-wide mb-4">ML FESTAS</p>
        {children}
      </div>
    </div>
  )
}

function InfoRow({ label, value, destaque }: { label: string; value: string; destaque?: boolean }) {
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className="text-zinc-500 text-sm flex-shrink-0">{label}</span>
      <span className={`text-sm text-right ${destaque ? 'text-[#C9A84C] font-semibold' : 'text-zinc-200'}`}>
        {value}
      </span>
    </div>
  )
}
