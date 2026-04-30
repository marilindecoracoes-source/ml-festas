function clean(v: string | undefined): string {
  if (!v) return ''
  return v.trim().replace(/^["']|["']$/g, '')
}

export const env = {
  SUPABASE_URL: clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  SUPABASE_ANON_KEY: clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  SUPABASE_SERVICE_ROLE_KEY: clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  APP_URL: clean(process.env.NEXT_PUBLIC_APP_URL) || 'http://localhost:3000',
}
