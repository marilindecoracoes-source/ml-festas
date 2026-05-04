import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatarMoeda, formatarData } from '@/lib/utils'
import {
  Target, TrendingUp, TrendingDown, DollarSign, Users, AlertTriangle,
  Clock, Calendar, BarChart2, Lock, Star,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns'

export const revalidate = 0

const METAS = [
  { mes: 1,  nome: 'Janeiro',   receita: 52000,  lucro: 4160,  margem: 8,  clientesAtivos: 38, fase: 'Crítico' },
  { mes: 2,  nome: 'Fevereiro', receita: 68000,  lucro: 9520,  margem: 14, clientesAtivos: 60, fase: 'Normal'  },
  { mes: 3,  nome: 'Março',     receita: 80000,  lucro: 11200, margem: 14, clientesAtivos: 60, fase: 'Normal'  },
  { mes: 4,  nome: 'Abril',     receita: 85000,  lucro: 11900, margem: 14, clientesAtivos: 60, fase: 'Normal'  },
  { mes: 5,  nome: 'Maio',      receita: 92000,  lucro: 12880, margem: 14, clientesAtivos: 60, fase: 'Normal'  },
  { mes: 6,  nome: 'Junho',     receita: 110000, lucro: 18700, margem: 17, clientesAtivos: 75, fase: 'Pico'    },
  { mes: 7,  nome: 'Julho',     receita: 105000, lucro: 17850, margem: 17, clientesAtivos: 75, fase: 'Pico'    },
  { mes: 8,  nome: 'Agosto',    receita: 90000,  lucro: 12600, margem: 14, clientesAtivos: 60, fase: 'Normal'  },
  { mes: 9,  nome: 'Setembro',  receita: 86000,  lucro: 12040, margem: 14, clientesAtivos: 60, fase: 'Normal'  },
  { mes: 10, nome: 'Outubro',   receita: 82000,  lucro: 11480, margem: 14, clientesAtivos: 60, fase: 'Normal'  },
  { mes: 11, nome: 'Novembro',  receita: 75000,  lucro: 7500,  margem: 10, clientesAtivos: 45, fase: 'Baixo'   },
  { mes: 12, nome: 'Dezembro',  receita: 55000,  lucro: 4400,  margem: 8,  clientesAtivos: 38, fase: 'Crítico' },
]

type Fase = 'Crítico' | 'Normal' | 'Pico' | 'Baixo'
const faseCls: Record<Fase, string> = {
  'Crítico': 'bg-red-900/30 text-red-400 border border-red-700/30',
  'Normal':  'bg-blue-900/30 text-blue-400 border border-blue-700/30',
  'Pico':    'bg-green-900/30 text-green-400 border border-green-700/30',
  'Baixo':   'bg-yellow-900/30 text-yellow-400 border border-yellow-700/30',
}

type EventoTipo = 'entrega' | 'retirada' | 'devolucao'
const eventoCls: Record<EventoTipo, string> = {
  entrega:   'bg-gold/20 text-gold',
  retirada:  'bg-zinc-700 text-zinc-200',
  devolucao: 'bg-orange-900/30 text-orange-400',
}
const eventoLabel: Record<EventoTipo, string> = {
  entrega: 'Entrega', retirada: 'Retirada', devolucao: 'Devolução',
}

function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0)
  const cor = pct < 50 ? 'bg-red-500' : pct < 80 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className={`h-2 bg-zinc-800 rounded-full overflow-hidden ${className}`}>
      <div className={`h-full rounded-full transition-all ${cor}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
      <span className="text-gold">{icon}</span>
      {children}
    </h2>
  )
}

function AdminLock({ label }: { label: string }) {
  return (
    <div className="gold-card p-5 flex flex-col items-center justify-center h-32 gap-3">
      <Lock size={22} className="text-zinc-600" />
      <p className="text-zinc-600 text-sm">{label} restrito ao administrador</p>
    </div>
  )
}

export default async function RelatoriosPage() {
  const supabase = createServerSupabaseClient()
  const hoje = new Date()
  const mesAtual = hoje.getMonth() + 1
  const anoAtual = hoje.getFullYear()
  const inicioMes    = startOfMonth(hoje).toISOString()
  const fimMes       = endOfMonth(hoje).toISOString()
  const inicioMesAnt = startOfMonth(subMonths(hoje, 1)).toISOString()
  const fimMesAnt    = endOfMonth(subMonths(hoje, 1)).toISOString()
  const em7Dias      = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const hojeISO      = hoje.toISOString()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: perfil } = user
    ? await supabase.from('perfis').select('role').eq('id', user.id).single()
    : { data: null }
  if (perfil?.role !== 'admin') redirect('/')
  const isAdmin = true

  const [encRes, locRes, cliRes] = await Promise.all([
    supabase.from('encomendas').select('id, cliente_id, status, valor_total, valor_sinal, restante_pago, created_at, data_entrega, titulo, clientes(nome)'),
    supabase.from('locacoes').select('id, cliente_id, status, valor_total, valor_sinal, restante_pago, created_at, data_retirada, data_devolucao, titulo, clientes(nome)'),
    supabase.from('clientes').select('id, nome, total_gasto'),
  ])

  const encomendas = encRes.data ?? []
  const locacoes   = locRes.data ?? []
  const clientes   = cliRes.data ?? []

  function calcFat(item: { valor_total: number; valor_sinal: number; restante_pago: boolean }) {
    if (item.restante_pago) return item.valor_total ?? 0
    if ((item.valor_sinal ?? 0) > 0) return item.valor_sinal ?? 0
    return 0
  }

  // --- Mês atual ---
  const encMes     = encomendas.filter(e => e.created_at >= inicioMes && e.created_at <= fimMes)
  const locMes     = locacoes.filter(l => l.created_at >= inicioMes && l.created_at <= fimMes)
  const fatEncMes  = encMes.reduce((s, e) => s + calcFat(e as any), 0)
  const fatLocMes  = locMes.reduce((s, l) => s + calcFat(l as any), 0)
  const fatTotalMes = fatEncMes + fatLocMes

  // --- Mês anterior ---
  const fatMesAnt =
    encomendas.filter(e => e.created_at >= inicioMesAnt && e.created_at <= fimMesAnt).reduce((s, e) => s + calcFat(e as any), 0) +
    locacoes.filter(l => l.created_at >= inicioMesAnt && l.created_at <= fimMesAnt).reduce((s, l) => s + calcFat(l as any), 0)
  const variacaoMes = fatMesAnt > 0 ? ((fatTotalMes - fatMesAnt) / fatMesAnt) * 100 : 0

  // --- Meta ---
  const meta = METAS.find(m => m.mes === mesAtual)!
  const clientesAtivosMes = new Set([...encMes.map(e => e.cliente_id), ...locMes.map(l => l.cliente_id)]).size

  // --- A receber ---
  const aReceberEnc = encomendas.filter(e => !e.restante_pago).reduce((s, e) => s + Math.max(0, (e.valor_total ?? 0) - (e.valor_sinal ?? 0)), 0)
  const aReceberLoc = locacoes.filter(l => !l.restante_pago).reduce((s, l) => s + Math.max(0, (l.valor_total ?? 0) - (l.valor_sinal ?? 0)), 0)

  // --- Última compra por cliente ---
  const ultimaCompra = new Map<string, Date>()
  ;[...encomendas, ...locacoes].forEach(item => {
    const d = new Date(item.created_at)
    const cur = ultimaCompra.get(item.cliente_id)
    if (!cur || d > cur) ultimaCompra.set(item.cliente_id, d)
  })

  const sem30 = clientes.filter(c => { const uc = ultimaCompra.get(c.id); if (!uc) return false; const d = differenceInDays(hoje, uc); return d >= 30 && d < 60 })
  const sem60 = clientes.filter(c => { const uc = ultimaCompra.get(c.id); if (!uc) return false; const d = differenceInDays(hoje, uc); return d >= 60 && d < 90 })
  const sem90 = clientes.filter(c => { const uc = ultimaCompra.get(c.id); if (!uc) return false; return differenceInDays(hoje, uc) >= 90 })

  // --- Top 5 ---
  const top5 = [...clientes].filter(c => (c.total_gasto ?? 0) > 0).sort((a, b) => (b.total_gasto ?? 0) - (a.total_gasto ?? 0)).slice(0, 5)

  // --- Taxa de retorno & ticket médio ---
  const pedidosPorCliente = new Map<string, number>()
  ;[...encomendas, ...locacoes].forEach(item => pedidosPorCliente.set(item.cliente_id, (pedidosPorCliente.get(item.cliente_id) ?? 0) + 1))
  const comRetorno  = Array.from(pedidosPorCliente.values()).filter(n => n > 1).length
  const taxaRetorno = pedidosPorCliente.size > 0 ? (comRetorno / pedidosPorCliente.size) * 100 : 0
  const totalPedidosMes = encMes.length + locMes.length
  const ticketMedio     = totalPedidosMes > 0 ? fatTotalMes / totalPedidosMes : 0

  // --- Locações atrasadas ---
  const locAtraso = locacoes.filter(l => l.status !== 'Devolvido' && l.data_devolucao && new Date(l.data_devolucao) < hoje)

  // --- Faturamento por mês do ano ---
  const fatPorMes = METAS.map((m, i) => {
    const mesDate = new Date(anoAtual, i, 1)
    if (startOfMonth(mesDate) > startOfMonth(hoje)) return { ...m, real: null as number | null }
    const ini = startOfMonth(mesDate).toISOString()
    const fim = endOfMonth(mesDate).toISOString()
    const real =
      encomendas.filter(e => e.created_at >= ini && e.created_at <= fim).reduce((s, e) => s + calcFat(e as any), 0) +
      locacoes.filter(l => l.created_at >= ini && l.created_at <= fim).reduce((s, l) => s + calcFat(l as any), 0)
    return { ...m, real }
  })
  const maxFatMes = Math.max(...fatPorMes.map(m => Math.max(m.receita, m.real ?? 0)), 1)

  // --- Próximos eventos 7 dias ---
  const eventos: { tipo: EventoTipo; titulo: string; data: string; clienteNome: string; id: string; tabela: string }[] = [
    ...encomendas
      .filter(e => e.status !== 'Material Retirado' && e.data_entrega && e.data_entrega >= hojeISO && e.data_entrega <= em7Dias)
      .map(e => ({ tipo: 'entrega' as const, titulo: e.titulo ?? '', data: e.data_entrega!, clienteNome: (e.clientes as any)?.nome ?? '', id: e.id, tabela: 'encomendas' })),
    ...locacoes
      .filter(l => l.status !== 'Devolvido' && l.data_retirada && l.data_retirada >= hojeISO && l.data_retirada <= em7Dias)
      .map(l => ({ tipo: 'retirada' as const, titulo: l.titulo ?? '', data: l.data_retirada!, clienteNome: (l.clientes as any)?.nome ?? '', id: l.id, tabela: 'locacoes' })),
    ...locacoes
      .filter(l => l.status !== 'Devolvido' && l.data_devolucao && l.data_devolucao >= hojeISO && l.data_devolucao <= em7Dias)
      .map(l => ({ tipo: 'devolucao' as const, titulo: l.titulo ?? '', data: l.data_devolucao!, clienteNome: (l.clientes as any)?.nome ?? '', id: l.id, tabela: 'locacoes' })),
  ].sort((a, b) => a.data.localeCompare(b.data))

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Relatórios</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Análise de desempenho e métricas do negócio</p>
      </div>

      {/* ── SEÇÃO 1 — Meta do Mês ── */}
      <section className="space-y-4">
        <SectionHeading icon={<Target size={15} />}>
          Meta do Mês — {meta.nome} {anoAtual}
          <span className={`text-xs px-2 py-0.5 rounded-full font-normal normal-case tracking-normal ${faseCls[meta.fase as Fase]}`}>
            {meta.fase}
          </span>
        </SectionHeading>

        {isAdmin ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Receita */}
            <div className="gold-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Receita do mês</p>
                <span className="text-xs text-zinc-500">{Math.min(100, meta.receita > 0 ? (fatTotalMes / meta.receita) * 100 : 0).toFixed(0)}% da meta</span>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-2xl font-bold font-display text-white">{formatarMoeda(fatTotalMes)}</span>
                  <span className="text-sm text-zinc-500">meta: {formatarMoeda(meta.receita)}</span>
                </div>
                <ProgressBar value={fatTotalMes} max={meta.receita} />
                <div className="flex justify-between mt-1.5 text-xs text-zinc-600">
                  <span>R$ 0</span>
                  <span>Faltam {formatarMoeda(Math.max(0, meta.receita - fatTotalMes))}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/5">
                <div className="text-center">
                  <p className="text-xs text-zinc-500">Meta lucro</p>
                  <p className="text-sm font-semibold text-white">{formatarMoeda(meta.lucro)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500">Margem</p>
                  <p className="text-sm font-semibold text-white">{meta.margem}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500">Pedidos</p>
                  <p className="text-sm font-semibold text-white">{totalPedidosMes}</p>
                </div>
              </div>
            </div>

            {/* Clientes ativos */}
            <div className="gold-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Clientes ativos no mês</p>
                <span className="text-xs text-zinc-500">{Math.min(100, meta.clientesAtivos > 0 ? (clientesAtivosMes / meta.clientesAtivos) * 100 : 0).toFixed(0)}% da meta</span>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-2xl font-bold font-display text-white">{clientesAtivosMes}</span>
                  <span className="text-sm text-zinc-500">meta: {meta.clientesAtivos}</span>
                </div>
                <ProgressBar value={clientesAtivosMes} max={meta.clientesAtivos} />
                <div className="flex justify-between mt-1.5 text-xs text-zinc-600">
                  <span>0</span>
                  <span>Faltam {Math.max(0, meta.clientesAtivos - clientesAtivosMes)} clientes</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <AdminLock label="Metas" />
        )}
      </section>

      {/* ── SEÇÃO 2 — Financeiro ── */}
      <section className="space-y-4">
        <SectionHeading icon={<DollarSign size={15} />}>Financeiro</SectionHeading>

        {isAdmin ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="gold-card p-5">
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Encomendas — mês</p>
              <p className="text-xl font-bold font-display text-white">{formatarMoeda(fatEncMes)}</p>
              <p className="text-xs text-zinc-600 mt-1">{encMes.length} pedido{encMes.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="gold-card p-5">
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Locações — mês</p>
              <p className="text-xl font-bold font-display text-white">{formatarMoeda(fatLocMes)}</p>
              <p className="text-xs text-zinc-600 mt-1">{locMes.length} pedido{locMes.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="gold-card p-5">
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">A receber (total)</p>
              <p className="text-xl font-bold font-display text-white">{formatarMoeda(aReceberEnc + aReceberLoc)}</p>
              <p className="text-xs text-zinc-600 mt-1">Enc: {formatarMoeda(aReceberEnc)} · Loc: {formatarMoeda(aReceberLoc)}</p>
            </div>
            <div className="gold-card p-5">
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Variação mensal</p>
              <div className="flex items-center gap-2 mt-1">
                <p className={`text-xl font-bold font-display ${variacaoMes >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {variacaoMes >= 0 ? '+' : ''}{variacaoMes.toFixed(1)}%
                </p>
                {variacaoMes >= 0
                  ? <TrendingUp size={17} className="text-green-400" />
                  : <TrendingDown size={17} className="text-red-400" />
                }
              </div>
              <p className="text-xs text-zinc-600 mt-1">vs {formatarMoeda(fatMesAnt)} no mês anterior</p>
            </div>
          </div>
        ) : (
          <AdminLock label="Financeiro" />
        )}
      </section>

      {/* ── SEÇÃO 3 — Clientes ── */}
      <section className="space-y-4">
        <SectionHeading icon={<Users size={15} />}>Clientes</SectionHeading>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Inatividade */}
          <div className="gold-card p-5 space-y-3">
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock size={15} className="text-zinc-500" />
              Clientes sem comprar
            </p>
            <div className="space-y-1">
              {[
                { label: '30 a 59 dias', count: sem30.length, cls: 'text-yellow-400 bg-yellow-900/20' },
                { label: '60 a 89 dias', count: sem60.length, cls: 'text-orange-400 bg-orange-900/20' },
                { label: '90+ dias',     count: sem90.length, cls: 'text-red-400 bg-red-900/20'      },
              ].map(({ label, count, cls }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm text-zinc-300">{label}</span>
                  <span className={`text-sm font-bold px-3 py-0.5 rounded-full ${cls}`}>
                    {count} cliente{count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-white/5 grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-xs text-zinc-500">Taxa de retorno</p>
                <p className="text-lg font-bold text-white">{taxaRetorno.toFixed(0)}%</p>
                <p className="text-xs text-zinc-600">{comRetorno} de {pedidosPorCliente.size} clientes</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-500">Ticket médio — mês</p>
                <p className="text-lg font-bold text-white">{isAdmin ? formatarMoeda(ticketMedio) : '---'}</p>
                <p className="text-xs text-zinc-600">{totalPedidosMes} pedido{totalPedidosMes !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          {/* Top 5 */}
          <div className="gold-card p-5 space-y-3">
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              <Star size={15} className="text-gold" />
              Top 5 — maior gasto total
            </p>
            {top5.length === 0 ? (
              <p className="text-zinc-600 text-sm py-4 text-center">Nenhum dado disponível.</p>
            ) : (
              <div className="space-y-1">
                {top5.map((c, i) => (
                  <Link
                    key={c.id}
                    href={`/clientes/${c.id}`}
                    className="flex items-center justify-between py-2 hover:bg-zinc-800 -mx-2 px-2 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-zinc-600 w-4 flex-shrink-0">{i + 1}.</span>
                      <span className="text-sm text-zinc-200 group-hover:text-gold transition-colors">{c.nome}</span>
                    </div>
                    {isAdmin ? (
                      <span className="text-sm font-semibold text-white flex-shrink-0">{formatarMoeda(c.total_gasto ?? 0)}</span>
                    ) : (
                      <span className="text-sm text-zinc-600 flex-shrink-0">---</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 4 — Operacional ── */}
      <section className="space-y-4">
        <SectionHeading icon={<BarChart2 size={15} />}>Operacional</SectionHeading>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Locações atrasadas */}
          <div className="gold-card p-5 space-y-3">
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-400" />
              Devoluções atrasadas
              {locAtraso.length > 0 && (
                <span className="ml-auto text-xs bg-red-900/30 text-red-400 border border-red-700/30 px-2 py-0.5 rounded-full">
                  {locAtraso.length}
                </span>
              )}
            </p>
            {locAtraso.length === 0 ? (
              <p className="text-zinc-600 text-sm py-4 text-center">Nenhuma locação em atraso.</p>
            ) : (
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {locAtraso.map(l => (
                  <Link
                    key={l.id}
                    href={`/locacoes/${l.id}`}
                    className="flex items-center justify-between py-2 hover:bg-zinc-800 -mx-2 px-2 rounded-lg transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-200 group-hover:text-gold transition-colors truncate">{l.titulo}</p>
                      <p className="text-xs text-zinc-600">{(l.clientes as any)?.nome}</p>
                    </div>
                    <span className="text-xs text-red-400 flex-shrink-0 ml-3">
                      {differenceInDays(hoje, new Date(l.data_devolucao!))}d atraso
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Próximos eventos */}
          <div className="gold-card p-5 space-y-3">
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              <Calendar size={15} className="text-gold" />
              Próximos 7 dias
            </p>
            {eventos.length === 0 ? (
              <p className="text-zinc-600 text-sm py-4 text-center">Nenhum evento nos próximos 7 dias.</p>
            ) : (
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {eventos.map((ev, i) => (
                  <Link
                    key={i}
                    href={`/${ev.tabela}/${ev.id}`}
                    className="flex items-center justify-between py-2 hover:bg-zinc-800 -mx-2 px-2 rounded-lg transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-200 group-hover:text-gold transition-colors truncate">{ev.titulo}</p>
                      <p className="text-xs text-zinc-600">{ev.clienteNome}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${eventoCls[ev.tipo]}`}>{eventoLabel[ev.tipo]}</span>
                      <span className="text-xs text-zinc-500">{formatarData(ev.data)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Faturamento por mês do ano — somente admin */}
        {isAdmin && (
          <div className="gold-card p-5 space-y-4">
            <p className="text-sm font-semibold text-white">Faturamento por mês — {anoAtual}</p>
            <div className="space-y-3">
              {fatPorMes.map(m => {
                const barMeta = (m.receita / maxFatMes) * 100
                const barReal = m.real !== null ? (m.real / maxFatMes) * 100 : null
                const isCurrent = m.mes === mesAtual
                const realPct   = m.real !== null && m.receita > 0 ? (m.real / m.receita) * 100 : 0
                const realCor   = realPct >= 100 ? 'bg-green-500' : realPct >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                return (
                  <div key={m.mes} className={m.real === null ? 'opacity-30' : ''}>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`w-20 flex-shrink-0 ${isCurrent ? 'text-gold font-semibold' : 'text-zinc-500'}`}>
                        {m.nome}
                      </span>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-700 w-3">M</span>
                          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-zinc-600 rounded-full" style={{ width: `${barMeta}%` }} />
                          </div>
                        </div>
                        {barReal !== null && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-zinc-700 w-3">R</span>
                            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${realCor}`} style={{ width: `${barReal}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right w-36 flex-shrink-0">
                        <p className="text-zinc-600">{formatarMoeda(m.receita)}</p>
                        {m.real !== null && (
                          <p className={m.real >= m.receita ? 'text-green-400' : 'text-zinc-300'}>{formatarMoeda(m.real)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-zinc-700">M = Meta · R = Real · Verde ≥ meta · Amarelo ≥ 80% · Vermelho &lt; 80%</p>
          </div>
        )}
      </section>
    </div>
  )
}
