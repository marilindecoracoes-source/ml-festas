'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Edit2, Phone, Mail, MapPin, DollarSign, Calendar, Package, Tent } from 'lucide-react'
import type { Cliente, ClienteDocumento } from '@/types'
import { formatarMoeda, formatarCPF, formatarData } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import DocumentosTab from './DocumentosTab'
import ClienteForm from './ClienteForm'

type Tab = 'dados' | 'historico' | 'documentos'

interface Props {
  cliente: Cliente
  documentos: ClienteDocumento[]
  encomendas: any[]
  locacoes: any[]
}

const statusEncVariant: Record<string, 'gold' | 'gray' | 'green'> = {
  'Pedido': 'gray',
  'Em Produção': 'gold',
  'Pronto': 'blue' as any,
  'Material Retirado': 'green',
}
const statusLocVariant: Record<string, any> = {
  'Pedido': 'gray',
  'Em Produção': 'gold',
  'Retirado': 'blue',
  'Devolvido': 'green',
}

export default function ClienteDetalhe({ cliente, documentos, encomendas, locacoes }: Props) {
  const [tab, setTab] = useState<Tab>('dados')
  const [editando, setEditando] = useState(false)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dados', label: 'Dados' },
    { id: 'historico', label: `Histórico (${encomendas.length + locacoes.length})` },
    { id: 'documentos', label: `Documentos (${documentos.length})` },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/clientes" className="p-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">{cliente.nome}</h1>
            <p className="text-zinc-400 text-sm">{formatarCPF(cliente.cpf)}</p>
          </div>
        </div>
        <button onClick={() => setEditando(!editando)} className="ghost-btn flex items-center gap-2 text-sm">
          <Edit2 size={14} />
          {editando ? 'Cancelar edição' : 'Editar'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="gold-card p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Total gasto</p>
          <p className="text-gold font-bold text-lg">{formatarMoeda(cliente.total_gasto)}</p>
        </div>
        <div className="gold-card p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Encomendas</p>
          <p className="text-white font-bold text-lg">{encomendas.length}</p>
        </div>
        <div className="gold-card p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Locações</p>
          <p className="text-white font-bold text-lg">{locacoes.length}</p>
        </div>
        <div className="gold-card p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Cliente desde</p>
          <p className="text-white text-sm font-medium">{formatarData(cliente.created_at)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800 flex gap-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'border-gold text-gold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'dados' && !editando && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="gold-card p-5 space-y-3">
            <h3 className="text-gold font-medium font-display text-sm">Contato</h3>
            {cliente.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail size={14} className="text-zinc-500" />
                <span className="text-zinc-200">{cliente.email}</span>
              </div>
            )}
            {cliente.telefone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-zinc-500" />
                <span className="text-zinc-200">{cliente.telefone}</span>
                {cliente.whatsapp_link && (
                  <a href={cliente.whatsapp_link} target="_blank" rel="noopener noreferrer" className="text-green-400 text-xs hover:underline ml-1">WhatsApp</a>
                )}
              </div>
            )}
            {cliente.data_nascimento && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={14} className="text-zinc-500" />
                <span className="text-zinc-200">{formatarData(cliente.data_nascimento)}</span>
              </div>
            )}
          </div>

          <div className="gold-card p-5 space-y-3">
            <h3 className="text-gold font-medium font-display text-sm">Endereço</h3>
            {(cliente.rua || cliente.cidade) ? (
              <div className="flex items-start gap-2 text-sm">
                <MapPin size={14} className="text-zinc-500 mt-0.5 flex-shrink-0" />
                <div className="text-zinc-200 space-y-0.5">
                  {cliente.rua && <p>{cliente.rua}{cliente.numero ? `, ${cliente.numero}` : ''}{cliente.complemento ? ` — ${cliente.complemento}` : ''}</p>}
                  {cliente.bairro && <p>{cliente.bairro}</p>}
                  {(cliente.cidade || cliente.estado) && <p>{[cliente.cidade, cliente.estado].filter(Boolean).join(' — ')}</p>}
                  {cliente.cep && <p className="text-zinc-500">CEP: {cliente.cep}</p>}
                </div>
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">Endereço não informado.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'dados' && editando && (
        <ClienteForm cliente={cliente} />
      )}

      {tab === 'historico' && (
        <div className="space-y-3">
          {encomendas.length === 0 && locacoes.length === 0 && (
            <p className="text-zinc-500 text-sm">Nenhum pedido encontrado.</p>
          )}
          {encomendas.map(enc => (
            <Link key={enc.id} href={`/encomendas/${enc.id}`} className="gold-card p-4 flex items-center justify-between hover:border-gold/40 transition-colors block">
              <div className="flex items-center gap-3">
                <Package size={16} className="text-gold" />
                <div>
                  <p className="text-white text-sm font-medium">{enc.titulo}</p>
                  <p className="text-zinc-500 text-xs">{enc.codigo} · Encomenda · {formatarData(enc.data_entrega)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gold text-sm font-medium">{formatarMoeda(enc.valor_total)}</span>
                <Badge variant={statusEncVariant[enc.status] ?? 'gray'}>{enc.status}</Badge>
              </div>
            </Link>
          ))}
          {locacoes.map(loc => (
            <Link key={loc.id} href={`/locacoes/${loc.id}`} className="gold-card p-4 flex items-center justify-between hover:border-gold/40 transition-colors block">
              <div className="flex items-center gap-3">
                <Tent size={16} className="text-zinc-400" />
                <div>
                  <p className="text-white text-sm font-medium">{loc.titulo}</p>
                  <p className="text-zinc-500 text-xs">{loc.codigo} · Locação · Ret: {formatarData(loc.data_retirada)} · Dev: {formatarData(loc.data_devolucao)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gold text-sm font-medium">{formatarMoeda(loc.valor_total)}</span>
                <Badge variant={statusLocVariant[loc.status] ?? 'gray'}>{loc.status}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === 'documentos' && (
        <DocumentosTab clienteId={cliente.id} documentosIniciais={documentos} />
      )}
    </div>
  )
}
