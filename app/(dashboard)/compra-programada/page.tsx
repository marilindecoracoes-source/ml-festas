import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import ComprasProgramadasList from '@/components/compra-programada/ComprasProgramadasList'
import { Wallet, Plus } from 'lucide-react'

export const revalidate = 0

export default async function CompraProgramadaPage() {
  const supabase = createServerSupabaseClient()
  const { data: contratos } = await supabase
    .from('compras_programadas')
    .select('*, clientes(nome, cpf, telefone)')
    .order('criado_em', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Wallet size={22} className="text-gold" />
            Compra Programada
          </h1>
          <p className="text-zinc-400 text-sm">{contratos?.length ?? 0} contrato{(contratos?.length ?? 0) !== 1 ? 's' : ''} criado{(contratos?.length ?? 0) !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/compra-programada/novo" className="gold-btn flex items-center justify-center gap-2 px-4 py-2.5 w-full sm:w-auto">
          <Plus size={16} />
          Novo Contrato
        </Link>
      </div>

      <ComprasProgramadasList contratos={(contratos ?? []) as any} />
    </div>
  )
}
