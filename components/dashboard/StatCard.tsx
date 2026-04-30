import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  variant?: 'default' | 'danger' | 'warning'
}

export default function StatCard({ title, value, subtitle, icon, variant = 'default' }: StatCardProps) {
  return (
    <div className={cn(
      'gold-card p-5 flex items-start gap-4 relative overflow-hidden',
      variant === 'danger' && 'border-red-800/40',
      variant === 'warning' && 'border-yellow-800/40',
    )}>
      {/* Top accent line */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl',
        variant === 'default' && 'bg-gradient-to-r from-gold/70 to-gold-light/30',
        variant === 'danger' && 'bg-red-600/50',
        variant === 'warning' && 'bg-yellow-600/50',
      )} />

      <div className={cn(
        'p-2.5 rounded-xl flex-shrink-0',
        variant === 'default' && 'bg-gold/10 text-gold',
        variant === 'danger' && 'bg-red-900/30 text-red-400',
        variant === 'warning' && 'bg-yellow-900/30 text-yellow-400',
      )}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{title}</p>
        <p className={cn(
          'text-2xl font-bold mt-1 font-display',
          variant === 'default' && 'text-white',
          variant === 'danger' && 'text-red-400',
          variant === 'warning' && 'text-yellow-400',
        )}>{value}</p>
        {subtitle && <p className="text-zinc-600 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
