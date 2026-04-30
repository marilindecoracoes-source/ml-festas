'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Cliente } from '@/types'
import { formatarMoeda, formatarCPF, formatarData } from '@/lib/utils'
import { Search, Plus, Cake, ExternalLink, Trash2 } from 'lucide-react'

function WhatsAppIcon({ size = 13, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { format, isSameMonth, parseISO } from 'date-fns'

interface Props {
  clientesIniciais: Cliente[]
}

export default function ClientesList({ clientesIniciais }: Props) {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [clientes, setClientes] = useState(clientesIniciais)
  const [excluindo, setExcluindo] = useState<string | null>(null)

  const hoje = new Date()

  const filtrados = clientes.filter(c => {
    const q = busca.toLowerCase()
    return (
      c.nome.toLowerCase().includes(q) ||
      c.cpf.includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    )
  })

  function aniversariante(cliente: Cliente): boolean {
    if (!cliente.data_nascimento) return false
    try {
      const d = parseISO(cliente.data_nascimento)
      return d.getMonth() === hoje.getMonth()
    } catch { return false }
  }

  async function excluirCliente(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir cliente.'); return }
    setClientes(prev => prev.filter(c => c.id !== id))
    toast.success('Cliente excluído.')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Clientes</h1>
          <p className="text-zinc-400 text-sm">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} cadastrado{clientes.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/clientes/novo" className="gold-btn flex items-center gap-2 w-fit">
          <Plus size={16} />
          Novo Cliente
        </Link>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Buscar por nome, CPF ou e-mail..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="input-dark pl-9"
        />
      </div>

      <div className="gold-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Nome</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium hidden md:table-cell">CPF</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium hidden lg:table-cell">Telefone</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium hidden lg:table-cell">Total gasto</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium hidden xl:table-cell">Desde</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtrados.map(cliente => (
                <tr key={cliente.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/clientes/${cliente.id}`} className="text-white hover:text-gold transition-colors font-medium">
                        {cliente.nome}
                      </Link>
                      {aniversariante(cliente) && (
                        <Cake size={14} className="text-gold" aria-label="Aniversariante do mês" />
                      )}
                    </div>
                    <p className="text-zinc-500 text-xs md:hidden">{formatarCPF(cliente.cpf)}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-300 hidden md:table-cell">{formatarCPF(cliente.cpf)}</td>
                  <td className="px-4 py-3 text-zinc-300 hidden lg:table-cell">
                    {cliente.telefone ? (
                      <span className="flex items-center gap-1.5">
                        {cliente.telefone}
                        {cliente.whatsapp_link && (
                          <a href={cliente.whatsapp_link} target="_blank" rel="noopener noreferrer">
                            <WhatsAppIcon size={13} className="text-green-500" />
                          </a>
                        )}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gold hidden lg:table-cell">{formatarMoeda(cliente.total_gasto)}</td>
                  <td className="px-4 py-3 text-zinc-500 hidden xl:table-cell">{formatarData(cliente.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link href={`/clientes/${cliente.id}`} className="p-1.5 text-zinc-400 hover:text-white transition-colors">
                        <ExternalLink size={15} />
                      </Link>
                      <button
                        onClick={() => setExcluindo(cliente.id)}
                        className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                    {busca ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!excluindo}
        onClose={() => setExcluindo(null)}
        onConfirm={() => excluindo && excluirCliente(excluindo)}
        title="Excluir cliente"
        message="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
      />
    </div>
  )
}
