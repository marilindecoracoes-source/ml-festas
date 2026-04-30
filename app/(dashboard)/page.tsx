import { createServerSupabaseClient } from '@/lib/supabase-server'
import StatCard from '@/components/dashboard/StatCard'
import RevenueChart from '@/components/dashboard/RevenueChart'
import StatusChart from '@/components/dashboard/StatusChart'
import { formatarMoeda, formatarData } from '@/lib/utils'
import {
  DollarSign, ShoppingBag, Users, AlertTriangle, Calendar, Package, Tent
} from 'lucide-react'
import Link from 'next/link'
import { subMonths, format, startOfMonth, endOfMonth, parseISO, isAfter } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { FaturamentoMensal, PedidosPorStatus, ProximaEntrega } from '@/types'

export const revalidate = 0

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const hoje = new Date()
  const inicioMes = startOfMonth(hoje).toISOString()
  const fimMes = endOfMonth(hoje).toISOString()
  const em7Dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const [encRes, locRes, cliRes] = await Promise.all([
    supabase.from('encomendas').select('status, valor_total, valor_sinal, restante_pago, data_entrega, created_at, titulo, id, clientes(nome)'),
    supabase.from('locacoes').select('status, valor_total, valor_sinal, restante_pago, data_retirada, data_devolucao, created_at, titulo, id, clientes(nome)'),
    supabase.from('clientes').select('id, created_at'),
  ])

  const encomendas = encRes.data ?? []
  const locacoes = locRes.data ?? []
  const clientes = cliRes.data ?? []

  function calcFaturamentoItem(item: { valor_total: number, valor_sinal: number, restante_pago: boolean }) {
    if (item.restante_pago) return item.valor_total ?? 0
    if ((item.valor_sinal ?? 0) > 0) return item.valor_sinal ?? 0
    return 0
  }

  // Faturamento do mês
  const fatEncomendas = encomendas
    .filter(e => e.created_at >= inicioMes && e.created_at <= fimMes)
    .reduce((sum, e) => sum + calcFaturamentoItem(e as any), 0)

  const fatLocacoes = locacoes
    .filter(l => l.created_at >= inicioMes && l.created_at <= fimMes)
    .reduce((sum, l) => sum + calcFaturamentoItem(l as any), 0)

  // Pedidos em aberto
  const abertasEnc = encomendas.filter(e => e.status !== 'Material Retirado').length
  const abertasLoc = locacoes.filter(l => l.status !== 'Devolvido').length

  // Clientes novos
  const clientesNovos = clientes.filter(c => c.created_at >= inicioMes && c.created_at <= fimMes).length

  // Locações em atraso
  const locacoesAtraso = locacoes.filter(l =>
    l.status !== 'Devolvido' && l.data_devolucao && l.data_devolucao < hoje.toISOString()
  ).length

  // Próximas entregas (7 dias)
  const proximasEntregas: ProximaEntrega[] = []
  encomendas
    .filter(e => e.status !== 'Material Retirado' && e.data_entrega && e.data_entrega >= hoje.toISOString() && e.data_entrega <= em7Dias)
    .forEach(e => proximasEntregas.push({
      id: e.id, tipo: 'encomenda', titulo: e.titulo,
      data: e.data_entrega!, clienteNome: (e.clientes as any)?.nome ?? '', acao: 'entrega',
    }))
  locacoes
    .filter(l => l.status !== 'Devolvido' && l.data_retirada && l.data_retirada >= hoje.toISOString() && l.data_retirada <= em7Dias)
    .forEach(l => proximasEntregas.push({
      id: l.id, tipo: 'locacao', titulo: l.titulo,
      data: l.data_retirada!, clienteNome: (l.clientes as any)?.nome ?? '', acao: 'retirada',
    }))
  locacoes
    .filter(l => l.status !== 'Devolvido' && l.data_devolucao && l.data_devolucao >= hoje.toISOString() && l.data_devolucao <= em7Dias)
    .forEach(l => proximasEntregas.push({
      id: l.id, tipo: 'locacao', titulo: l.titulo,
      data: l.data_devolucao!, clienteNome: (l.clientes as any)?.nome ?? '', acao: 'devolucao',
    }))
  proximasEntregas.sort((a, b) => a.data.localeCompare(b.data))

  // Faturamento últimos 6 meses
  const faturamentoMensal: FaturamentoMensal[] = []
  for (let i = 5; i >= 0; i--) {
    const mes = subMonths(hoje, i)
    const inicio = startOfMonth(mes).toISOString()
    const fim = endOfMonth(mes).toISOString()
    const label = format(mes, 'MMM', { locale: ptBR })
    const fatMesEnc = encomendas
      .filter(e => e.created_at >= inicio && e.created_at <= fim)
      .reduce((s, e) => s + calcFaturamentoItem(e as any), 0)
    const fatMesLoc = locacoes
      .filter(l => l.created_at >= inicio && l.created_at <= fim)
      .reduce((s, l) => s + calcFaturamentoItem(l as any), 0)
    faturamentoMensal.push({ mes: label, encomendas: fatMesEnc, locacoes: fatMesLoc })
  }

  // Pedidos por status
  const statusMap = new Map<string, { quantidade: number; tipo: 'encomenda' | 'locacao' }>()
  encomendas.filter(e => e.status !== 'Material Retirado').forEach(e => {
    const key = `${e.status}_encomenda`
    const cur = statusMap.get(key) ?? { quantidade: 0, tipo: 'encomenda' as const }
    statusMap.set(key, { ...cur, quantidade: cur.quantidade + 1 })
  })
  locacoes.filter(l => l.status !== 'Devolvido').forEach(l => {
    const key = `${l.status}_locacao`
    const cur = statusMap.get(key) ?? { quantidade: 0, tipo: 'locacao' as const }
    statusMap.set(key, { ...cur, quantidade: cur.quantidade + 1 })
  })
  const pedidosPorStatus: PedidosPorStatus[] = Array.from(statusMap.entries()).map(([key, val]) => ({
    status: key.split('_')[0],
    quantidade: val.quantidade,
    tipo: val.tipo,
  }))

  const acaoLabel = { entrega: 'Entrega', retirada: 'Retirada', devolucao: 'Devolução' }
  const acaoBadge = {
    entrega: 'bg-gold/20 text-gold',
    retirada: 'bg-zinc-700 text-zinc-200',
    devolucao: 'bg-orange-900/30 text-orange-400',
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Visão geral do negócio</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Faturamento do mês"
          value={formatarMoeda(fatEncomendas + fatLocacoes)}
          subtitle={`Enc: ${formatarMoeda(fatEncomendas)} · Loc: ${formatarMoeda(fatLocacoes)}`}
          icon={<DollarSign size={20} />}
        />
        <StatCard
          title="Pedidos em aberto"
          value={abertasEnc + abertasLoc}
          subtitle={`${abertasEnc} encomendas · ${abertasLoc} locações`}
          icon={<ShoppingBag size={20} />}
        />
        <StatCard
          title="Clientes novos no mês"
          value={clientesNovos}
          icon={<Users size={20} />}
        />
        <StatCard
          title="Locações em atraso"
          value={locacoesAtraso}
          icon={<AlertTriangle size={20} />}
          variant={locacoesAtraso > 0 ? 'danger' : 'default'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={faturamentoMensal} />
        <StatusChart data={pedidosPorStatus} />
      </div>

      {/* Próximas entregas */}
      <div className="gold-card p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-gold" />
          Próximas entregas e devoluções (7 dias)
        </h3>
        {proximasEntregas.length === 0 ? (
          <p className="text-zinc-500 text-sm">Nenhum evento nos próximos 7 dias.</p>
        ) : (
          <div className="space-y-2">
            {proximasEntregas.map((item, i) => (
              <Link
                key={i}
                href={`/${item.tipo === 'encomenda' ? 'encomendas' : 'locacoes'}/${item.id}`}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-800 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  {item.tipo === 'encomenda'
                    ? <Package size={15} className="text-gold" />
                    : item.acao === 'devolucao'
                    ? <AlertTriangle size={15} className="text-orange-400" />
                    : <Tent size={15} className="text-zinc-400" />
                  }
                  <div>
                    <p className="text-sm text-white group-hover:text-gold transition-colors">{item.titulo}</p>
                    <p className="text-xs text-zinc-500">{item.clienteNome}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${acaoBadge[item.acao]}`}>
                    {acaoLabel[item.acao]}
                  </span>
                  <span className="text-sm text-zinc-400">{formatarData(item.data)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
