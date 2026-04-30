import ClienteForm from '@/components/clientes/ClienteForm'

export default function NovoClientePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Novo Cliente</h1>
        <p className="text-zinc-400 text-sm">Preencha os dados do cliente abaixo</p>
      </div>
      <ClienteForm />
    </div>
  )
}
