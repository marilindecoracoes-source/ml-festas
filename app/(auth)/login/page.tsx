'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('access_token') && hash.includes('type=recovery')) {
      router.replace('/reset-password' + hash)
    }
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (res.status === 429) {
      toast.error('Muitas tentativas. Tente novamente em 15 minutos.')
      setLoading(false)
      return
    }
    if (!res.ok) {
      toast.error('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="ML Festas" width={120} height={120} style={{ objectFit: 'contain' }} priority />
          </div>
          <h1 className="text-3xl font-display font-bold text-white">ML Festas</h1>
          <p className="text-zinc-400 mt-1 text-sm">Locação e Venda</p>
        </div>

        {/* Card */}
        <div className="gold-card p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Acesso ao Sistema</h2>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-dark"
                placeholder="admin@mlfestas.com.br"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-dark pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="gold-btn w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-8">
          ML Festas © {new Date().getFullYear()} — Sistema de gestão
        </p>
      </div>
    </div>
  )
}
