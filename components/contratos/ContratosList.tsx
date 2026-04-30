'use client'

import { useState } from 'react'
import { Eye, Download, FileText, Search } from 'lucide-react'
import { formatarData } from '@/lib/utils'

interface Contrato {
  id: string
  numero: string
  criado_em: string
  clientes: { nome: string; cpf: string } | null
  locacoes: { titulo: string; codigo: string } | null
}

interface Props {
  contratos: Contrato[]
}

export default function ContratosList({ contratos }: Props) {
  const [busca, setBusca] = useState('')

  const filtrados = contratos.filter(c => {
    const q = busca.toLowerCase()
    return (
      c.numero.toLowerCase().includes(q) ||
      (c.clientes?.nome ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4">
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
              {busca ? 'Nenhum contrato encontrado para essa busca.' : 'Nenhum contrato gerado ainda.'}
            </p>
            <p className="text-zinc-600 text-xs mt-1">Os contratos são gerados automaticamente ao criar uma locação.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-zinc-500 font-medium text-xs uppercase tracking-wide px-4 py-3">Nº Contrato</th>
                <th className="text-left text-zinc-500 font-medium text-xs uppercase tracking-wide px-4 py-3">Cliente</th>
                <th className="text-left text-zinc-500 font-medium text-xs uppercase tracking-wide px-4 py-3 hidden md:table-cell">Locação</th>
                <th className="text-left text-zinc-500 font-medium text-xs uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Data</th>
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
                    <div className="flex items-center gap-2 justify-end">
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
