import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'gold' | 'green' | 'red' | 'yellow' | 'gray' | 'blue' | 'purple'
  className?: string
}

const variants = {
  gold:   'bg-amber-900/30 text-amber-400 border border-amber-700/40',
  green:  'bg-green-900/30 text-green-400 border border-green-700/40',
  red:    'bg-red-900/30 text-red-400 border border-red-700/40',
  yellow: 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/40',
  gray:   'bg-zinc-800 text-zinc-400 border border-zinc-700',
  blue:   'bg-blue-900/30 text-blue-400 border border-blue-700/40',
  purple: 'bg-purple-900/30 text-purple-400 border border-purple-700/40',
}

export default function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span className={cn('status-badge', variants[variant], className)}>
      {children}
    </span>
  )
}
