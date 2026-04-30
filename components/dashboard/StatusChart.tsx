'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { PedidosPorStatus } from '@/types'

interface StatusChartProps {
  data: PedidosPorStatus[]
}

const COLORS = ['#C9A84C', '#F0C040', '#71717a', '#a1a1aa', '#3f3f46', '#d4af37']

export default function StatusChart({ data }: StatusChartProps) {
  const chartData = data.map((d) => ({
    name: `${d.status} (${d.tipo === 'encomenda' ? 'Enc.' : 'Loc.'})`,
    value: d.quantidade,
  }))

  return (
    <div className="gold-card p-5">
      <h3 className="text-white font-semibold mb-4">Pedidos por Status</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, color: '#fff' }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
