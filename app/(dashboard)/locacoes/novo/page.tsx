import PedidoForm from '@/components/kanban/PedidoForm'

export default function NovaLocacaoPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Nova Locação</h1>
        <p className="text-zinc-400 text-sm">Preencha os dados da locação abaixo</p>
      </div>
      <PedidoForm tipo="locacao" />
    </div>
  )
}
