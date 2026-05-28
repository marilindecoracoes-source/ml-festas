'use client'

import { useState } from 'react'
import { Eye, Download, FileText, Search, Link2, Check, MessageCircle } from 'lucide-react'
import { formatarData } from '@/lib/utils'

interface Contrato {
  id: string
  numero: string
  criado_em: string
  token_assinatura: string | null
  status_assinatura: 'pendente' | 'assinado'
  data_assinatura: string | null
  clientes: { nome: string; cpf: string; telefone: string | null } | null
  locacoes: { titulo: string; codigo: string } | null
}

interface Props {
  contratos: Contrato[]
}

type Filtro = 'todos' | 'pendente' | 'assinado'

export default function ContratosList({ contratos }: Props) {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [copiado, setCopiado] = useState<string | null>(null)

  function copiarLink(token: string, id: string) {
    const url = `https://gestao.mlfestas.com.br/assinar/${token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiado(id)
      setTimeout(() => setCopiado(null), 2000)
    })
  }

  function linkWhatsApp(telefone: string, nome: string, token: string) {
    const numero = telefone.replace(/\D/g, '')
    const com55 = numero.startsWith('55') ? numero : `55${numero}`
    const url = `https://gestao.mlfestas.com.br/assinar/${token}`
    const msg = encodeURIComponent(`Olá, ${nome.split(' ')[0]}! 😊\nSegue o link para assinar seu contrato com a ML Festas:\n${url}`)
    return `https://wa.me/${com55}?text=${msg}`
  }

  const totalAssinados = contratos.filter(c => c.status_assinatura === 'assinado').length

  const filtrados = contratos.filter(c => {
    const q = busca.toLowerCase()
    const matchBusca =
      c.numero.toLowerCase().includes(q) ||
      (c.clientes?.nome ?? '').toLowerCase().includes(q)
    const matchFiltro = filtro === 'todos' || c.status_assinatura === filtro
    return matchBusca && matchFiltro
  })

  return (
    <div className="space-y-4">
      {/* Contador e filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-zinc-400 text-sm">
          <span className="text-green-400 font-medium">{totalAssinados}</span> de{' '}
          <span className="text-white font-medium">{contratos.length}</span> contrato{contratos.length !== 1 ? 's' : ''} assinado{totalAssinados !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-2">
          {(['todos', 'pendente', 'assinado'] as Filtro[]).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filtro === f
                  ? f === 'assinado'
                    ? 'bg-green-900/60 text-green-300 border border-green-700/50'
                    : f === 'pendente'
                    ? 'bg-yellow-900/60 text-yellow-300 border border-yellow-700/50'
                    : 'bg-zinc-700 text-white border border-zinc-600'
                  : 'bg-zinc-800/50 text-zinc-500 border border-zinc-800 hover:text-zinc-300'
              }`}
            >
              {f === 'todos' ? 'Todos' : f === 'pendente' ? 'Pendentes' : 'Assinados'}
            </button>
          ))}
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Buscar por número ou cliente..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="input-dark pl-9 w-full max-w-sm"
        />
      </div>

      {/* Tabela */}
      <div className="gold-card overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={32} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">
              {busca || filtro !== 'todos' ? 'Nenhum contrato encontrado.' : 'Nenhum contrato gerado ainda.'}
            </p>
            {!busca && filtro === 'todos' && (
              <p className="text-zinc-600 text-xs mt-1">Os contratos são gerados automaticamente ao criar uma locação.</p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-zinc-500 font-medium text-xs uppercase tracking-wide px-4 py-3">Nº Contrato</th>
                <th className="text-left text-zinc-500 font-medium text-xs uppercase tracking-wide px-4 py-3">Cliente</th>
                <th className="text-left text-zinc-500 font-medium text-xs uppercase tracking-wide px-4 py-3 hidden md:table-cell">Locação</th>
                <th className="text-left text-zinc-500 font-medium text-xs uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Data</th>
                <th className="text-left text-zinc-500 font-medium text-xs uppercase tracking-wide px-4 py-3">Assinatura</th>
                <th className="text-right text-zinc-500 font-medium text-xs uppercase tracking-wide px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(c => (
                <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-gold font-mono font-medium text-sm">{c.numero}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{c.clientes?.nome ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-zinc-300">{c.locacoes?.titulo ?? '—'}</p>
                    <p className="text-zinc-600 text-xs">{c.locacoes?.codigo ?? ''}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-zinc-400">{formatarData(c.criado_em)}</p>
                  </td>
                  <td className="px-4 py-3">
                    {c.status_assinatura === 'assinado' ? (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                        <span className="text-green-400 text-xs font-medium">
                          {c.data_assinatura
                            ? new Date(c.data_assinatura).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
                            : 'Assinado'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />
                        <span className="text-yellow-400 text-xs font-medium">Pendente</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {c.status_assinatura === 'pendente' && c.token_assinatura && (
                        <>
                          {c.clientes?.telefone && (
                            <a
                              href={linkWhatsApp(c.clientes.telefone, c.clientes.nome, c.token_assinatura)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ghost-btn p-2 text-zinc-400 hover:text-green-400 transition-colors"
                              title="Enviar link pelo WhatsApp"
                            >
                              <MessageCircle size={15} />
                            </a>
                          )}
                          <button
                            onClick={() => copiarLink(c.token_assinatura!, c.id)}
                            className={`ghost-btn p-2 transition-colors ${copiado === c.id ? 'text-green-400' : 'text-zinc-400 hover:text-gold'}`}
                            title={copiado === c.id ? 'Link copiado!' : 'Copiar link de assinatura'}
                          >
                            {copiado === c.id ? <Check size={15} /> : <Link2 size={15} />}
                          </button>
                        </>
                      )}
                      <a
                        href={`/api/contratos/${c.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ghost-btn p-2"
                        title="Visualizar contrato"
                      >
                        <Eye size={15} />
                      </a>
                      <a
                        href={`/api/contratos/${c.id}?download=true`}
                        className="ghost-btn p-2"
                        title="Baixar contrato"
                      >
                        <Download size={15} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
