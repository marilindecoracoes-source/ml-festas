'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isToday, parseISO, getDay, addMonths, subMonths, isSameDay
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Cake, Package, Tent, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface EventoCalendario {
  data: string
  tipo: 'aniversario' | 'entrega' | 'retirada' | 'devolucao'
  label: string
  href: string
  clienteId?: string
}

interface Props {
  eventos: EventoCalendario[]
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const eventConfig = {
  aniversario: { color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: Cake },
  entrega: { color: 'bg-gold/20 text-gold border-gold/30', icon: Package },
  retirada: { color: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30', icon: Tent },
  devolucao: { color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', icon: AlertTriangle },
}

export default function CalendarioView({ eventos }: Props) {
  const [mesAtual, setMesAtual] = useState(new Date())
  const [diasExpandidos, setDiasExpandidos] = useState<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => { router.refresh() }, [])

  function toggleDia(diaKey: string) {
    setDiasExpandidos(prev => {
      const next = new Set(prev)
      next.has(diaKey) ? next.delete(diaKey) : next.add(diaKey)
      return next
    })
  }

  const inicio = startOfMonth(mesAtual)
  const fim = endOfMonth(mesAtual)
  const dias = eachDayOfInterval({ start: inicio, end: fim })
  const primeiroDiaSemana = getDay(inicio)

  function eventosNoDia(dia: Date): EventoCalendario[] {
    return eventos.filter(e => {
      try { return isSameDay(parseISO(e.data), dia) } catch { return false }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold text-white capitalize">
          {format(mesAtual, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setMesAtual(m => subMonths(m, 1))} className="ghost-btn p-2">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setMesAtual(new Date())} className="ghost-btn px-3 py-2 text-xs">Hoje</button>
          <button onClick={() => setMesAtual(m => addMonths(m, 1))} className="ghost-btn p-2">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="gold-card overflow-hidden">
        {/* Dias da semana */}
        <div className="grid grid-cols-7 border-b border-zinc-800">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-zinc-500">{d}</div>
          ))}
        </div>

        {/* Dias */}
        <div className="grid grid-cols-7">
          {/* Espaços vazios antes do primeiro dia */}
          {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-24 border-b border-r border-zinc-800/50 p-1 bg-zinc-900/30" />
          ))}

          {dias.map((dia, i) => {
            const evts = eventosNoDia(dia)
            const diaKey = dia.toISOString()
            const expandido = diasExpandidos.has(diaKey)
            const visiveis = expandido ? evts : evts.slice(0, 3)

            return (
              <div
                key={diaKey}
                className={`min-h-24 border-b border-r border-zinc-800/50 p-1.5 ${
                  isToday(dia) ? 'bg-gold/5' : 'hover:bg-zinc-800/20'
                } transition-colors`}
              >
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium mb-1 ${
                  isToday(dia)
                    ? 'bg-gold text-black'
                    : 'text-zinc-400'
                }`}>
                  {format(dia, 'd')}
                </span>

                <div className="space-y-0.5">
                  {visiveis.map((evt, ei) => {
                    const cfg = eventConfig[evt.tipo]
                    const Icon = cfg.icon
                    return (
                      <Link key={ei} href={evt.href} className={`flex items-center gap-1 px-1 py-0.5 rounded text-xs border ${cfg.color} hover:opacity-80 transition-opacity truncate`}>
                        <Icon size={10} className="flex-shrink-0" />
                        <span className="truncate">{evt.label}</span>
                      </Link>
                    )
                  })}
                  {evts.length > 3 && (
                    <button
                      onClick={() => toggleDia(diaKey)}
                      className="text-xs text-zinc-500 hover:text-zinc-300 pl-1 transition-colors"
                    >
                      {expandido ? '▲ menos' : `+${evts.length - 3} mais`}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 text-xs text-zinc-400">
        <div className="flex items-center gap-1.5"><Cake size={12} className="text-purple-400" /> Aniversário</div>
        <div className="flex items-center gap-1.5"><Package size={12} className="text-gold" /> Entrega de encomenda</div>
        <div className="flex items-center gap-1.5"><Tent size={12} className="text-zinc-400" /> Retirada de locação</div>
        <div className="flex items-center gap-1.5"><AlertTriangle size={12} className="text-orange-400" /> Devolução de locação</div>
      </div>
    </div>
  )
}
