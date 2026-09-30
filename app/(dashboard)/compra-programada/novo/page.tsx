import { Wallet } from 'lucide-react'
import NovoContratoForm from '@/components/compra-programada/NovoContratoForm'

export default function NovoContratoCompraProgramadaPage() {
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <Wallet size={22} className="text-gold" />
          Novo Contrato de Compra Programada
        </h1>
        <p className="text-zinc-400 text-sm">Escolha o cliente e os termos do plano.</p>
      </div>

      <NovoContratoForm />
    </div>
  )
}
