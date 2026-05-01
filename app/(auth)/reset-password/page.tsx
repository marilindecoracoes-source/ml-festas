'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Loader2, Eye, EyeOff } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const code = searchParams.get('code')
    let unsubscribe: (() => void) | undefined

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          toast.error('Link inválido ou expirado.')
        } else {
          setSessionReady(true)
        }
      })
    } else {
      // Hash-based flow: supabase client auto-processes #access_token from URL
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
          setSessionReady(true)
        }
      })
      unsubscribe = () => subscription.unsubscribe()

      // Also check immediately if session already established
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setSessionReady(true)
      })
    }

    return () => unsubscribe?.()
  }, [searchParams])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.')
      return
    }
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error('Erro ao redefinir senha. Tente novamente.')
      setLoading(false)
      return
    }
    toast.success('Senha redefinida com sucesso!')
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0b0b13' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <img src="/logo.png" alt="ML Festas" className="h-24 w-24 mx-auto object-contain rounded-full mb-4" />
          <h1 className="text-2xl font-bold text-white" style={{ letterSpacing: '-0.025em' }}>Redefinir senha</h1>
          <p className="text-zinc-400 mt-1 text-sm">Digite sua nova senha abaixo</p>
        </div>

        <div className="gold-card p-8">
          {!sessionReady ? (
            <div className="flex items-center justify-center py-8 gap-3 text-zinc-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Verificando link...</span>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Nova senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
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

              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Confirmar nova senha</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="input-dark pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="gold-btn w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-zinc-600 text-xs mt-8">
          ML Festas © {new Date().getFullYear()} — Sistema de gestão
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
