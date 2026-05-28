import { createServerSupabaseClient } from '@/lib/supabase-server'
import ContratosList from '@/components/contratos/ContratosList'
import { FileText } from 'lucide-react'

export const revalidate = 0

export default async function ContratosPage() {
  const supabase = createServerSupabaseClient()
  const { data: contratos } = await supabase
    .from('contratos')
    .select('*, clientes(nome, cpf), locacoes(titulo, codigo), token_assinatura, status_assinatura, data_assinatura')
    .order('criado_em', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <FileText size={22} className="text-gold" />
            Contratos
          </h1>
          <p className="text-zinc-400 text-sm">{contratos?.length ?? 0} contrato{(contratos?.length ?? 0) !== 1 ? 's' : ''} gerado{(contratos?.length ?? 0) !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <ContratosList contratos={(contratos ?? []) as any} />
    </div>
  )
}
