import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'gold' | 'green' | 'red' | 'yellow' | 'gray' | 'blue'
  className?: string
}

const variants = {
  gold: 'bg-gold/20 text-gold border border-gold/30',
  green: 'bg-green-900/30 text-green-400 border border-green-800/40',
  red: 'bg-red-900/30 text-red-400 border border-red-800/40',
  yellow: 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/40',
  gray: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
  blue: 'bg-blue-900/30 text-blue-400 border border-blue-800/40',
}

export default function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span className={cn('status-badge', variants[variant], className)}>
      {children}
    </span>
  )
}
