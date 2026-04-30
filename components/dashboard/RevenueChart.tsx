'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { FaturamentoMensal } from '@/types'

interface RevenueChartProps {
  data: FaturamentoMensal[]
}

function formatarValorEixo(valor: number) {
  if (valor >= 1000) return `R$ ${(valor / 1000).toFixed(1)}k`
  return `R$ ${valor}`
}

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="gold-card p-5">
      <h3 className="text-white font-semibold mb-4">Faturamento — Últimos 6 meses</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="mes" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatarValorEixo} />
          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, color: '#fff' }}
            formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} />
          <Bar dataKey="encomendas" name="Encomendas" fill="#C9A84C" radius={[4, 4, 0, 0]} />
          <Bar dataKey="locacoes" name="Locações" fill="#71717a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
