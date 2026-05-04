'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  LayoutDashboard, BarChart2, Users, Package, Tent, Calendar, FileText,
  Link2, LogOut, Menu, X
} from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2, adminOnly: true },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/encomendas', label: 'Encomendas', icon: Package },
  { href: '/locacoes', label: 'Locações', icon: Tent },
  { href: '/contratos', label: 'Contratos', icon: FileText },
  { href: '/calendario', label: 'Calendário', icon: Calendar },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('perfis').select('role').eq('id', user.id).single().then(({ data }) => {
        setIsAdmin(data?.role === 'admin')
      })
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function copyConsultaLink() {
    const url = `${window.location.origin}/consulta`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado!')
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex justify-center items-center px-4 pt-5 pb-4 border-b border-white/[0.06]">
        <Image src="/logo.png" alt="ML Festas" width={84} height={84} style={{ objectFit: 'contain' }} priority />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {navItems.filter(item => !item.adminOnly || isAdmin).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={isActive(href) ? 'sidebar-item-active' : 'sidebar-item'}
          >
            <Icon size={17} />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}

        <button
          onClick={copyConsultaLink}
          className="sidebar-item w-full text-left"
        >
          <Link2 size={17} />
          <span className="text-sm font-medium">Link de Consulta</span>
        </button>
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-white/[0.06] pt-3">
        <button onClick={handleLogout} className="sidebar-item w-full text-left text-red-500/70 hover:text-red-400 hover:bg-red-950/20">
          <LogOut size={17} />
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-white/[0.06] fixed inset-y-0 left-0 z-30" style={{ backgroundColor: '#0a0a0a' }}>
        <SidebarContent />
      </aside>

      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl border border-white/10 text-white"
        style={{ backgroundColor: '#0a0a0a' }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 border-r border-white/[0.06] transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: '#0a0a0a' }}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
