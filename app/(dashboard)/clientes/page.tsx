import { createServerSupabaseClient } from '@/lib/supabase-server'
import ClientesList from '@/components/clientes/ClientesList'

export const revalidate = 0

export default async function ClientesPage() {
  const supabase = createServerSupabaseClient()
  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .order('nome')

  return <ClientesList clientesIniciais={clientes ?? []} />
}
