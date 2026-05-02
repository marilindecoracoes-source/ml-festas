import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { env } from '@/lib/env'

const attempts = new Map<string, { count: number; resetAt: number }>()
const LIMIT = 5
const WINDOW_MS = 15 * 60 * 1000

function getIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= LIMIT) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  const ip = getIp(request)

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
      { status: 429 }
    )
  }

  const { email, password } = await request.json()

  const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = []

  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        pendingCookies.push(...cookiesToSet)
      },
    },
  })

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  })
  return response
}
