'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Loader2, Search } from 'lucide-react'
import type { Cliente } from '@/types'

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  cpf: z.string().min(11, 'CPF inválido'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  data_nascimento: z.string().optional(),
  cep: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  instagram: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  cliente?: Cliente
}

export default function ClienteForm({ cliente }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: cliente?.nome ?? '',
      cpf: cliente?.cpf ?? '',
      email: cliente?.email ?? '',
      telefone: cliente?.telefone ?? '',
      data_nascimento: cliente?.data_nascimento ?? '',
      cep: cliente?.cep ?? '',
      rua: cliente?.rua ?? '',
      numero: cliente?.numero ?? '',
      complemento: cliente?.complemento ?? '',
      bairro: cliente?.bairro ?? '',
      cidade: cliente?.cidade ?? '',
      estado: cliente?.estado ?? '',
      instagram: (cliente as any)?.instagram ?? '',
    },
  })

  async function buscarCep(cep: string) {
    const cleaned = cep.replace(/\D/g, '')
    if (cleaned.length !== 8) return
    setBuscandoCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setValue('rua', data.logradouro)
        setValue('bairro', data.bairro)
        setValue('cidade', data.localidade)
        setValue('estado', data.uf)
      } else {
        toast.error('CEP não encontrado.')
      }
    } catch {
      toast.error('Erro ao buscar CEP.')
    } finally {
      setBuscandoCep(false)
    }
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    const supabase = createClient()
    const cpfLimpo = data.cpf.replace(/\D/g, '')
    const telefoneLimpo = (data.telefone ?? '').replace(/\D/g, '')
    const whatsapp_link = telefoneLimpo ? `https://wa.me/55${telefoneLimpo}` : null
    const payload = {
      nome: data.nome,
      cpf: cpfLimpo,
      email: data.email || null,
      telefone: data.telefone || null,
      whatsapp_link,
      data_nascimento: data.data_nascimento || null,
      cep: data.cep || null,
      rua: data.rua || null,
      numero: data.numero || null,
      complemento: data.complemento || null,
      bairro: data.bairro || null,
      cidade: data.cidade || null,
      estado: data.estado || null,
      instagram: data.instagram || null,
    }

    if (cliente?.id) {
      const { error } = await supabase.from('clientes').update(payload).eq('id', cliente.id)
      if (error) { toast.error('Erro ao salvar cliente.'); setLoading(false); return }
      toast.success('Cliente atualizado!')
      router.push(`/clientes/${cliente.id}`)
    } else {
      const { data: novo, error } = await supabase.from('clientes').insert({ ...payload, total_gasto: 0 }).select().single()
      if (error) { toast.error('Erro ao criar cliente.'); setLoading(false); return }
      toast.success('Cliente criado!')
      router.push(`/clientes/${novo.id}`)
    }
    router.refresh()
  }

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm text-zinc-400 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Dados pessoais */}
      <section className="gold-card p-6 space-y-4">
        <h2 className="text-base font-semibold text-gold font-display border-b border-zinc-800 pb-2">Dados Pessoais</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome completo *" error={errors.nome?.message}>
            <input {...register('nome')} className="input-dark" placeholder="Maria da Silva" />
          </Field>
          <Field label="CPF *" error={errors.cpf?.message}>
            <input
              {...register('cpf')}
              className="input-dark"
              placeholder="000.000.000-00"
              maxLength={14}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, '')
                  .replace(/(\d{3})(\d)/, '$1.$2')
                  .replace(/(\d{3})(\d)/, '$1.$2')
                  .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
                setValue('cpf', v)
              }}
            />
          </Field>
          <Field label="Data de nascimento">
            <input {...register('data_nascimento')} type="date" className="input-dark" />
          </Field>
          <Field label="E-mail" error={errors.email?.message}>
            <input {...register('email')} type="email" className="input-dark" placeholder="maria@email.com" />
          </Field>
          <Field label="Telefone">
            <input
              {...register('telefone')}
              className="input-dark"
              placeholder="(11) 99999-9999"
              maxLength={15}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, '')
                  .replace(/(\d{2})(\d)/, '($1) $2')
                  .replace(/(\d{5})(\d)/, '$1-$2')
                setValue('telefone', v)
              }}
            />
          </Field>
          <Field label="Instagram / Rede Social">
            <input {...register('instagram')} className="input-dark" placeholder="@usuario" />
          </Field>
        </div>
      </section>

      {/* Endereço */}
      <section className="gold-card p-6 space-y-4">
        <h2 className="text-base font-semibold text-gold font-display border-b border-zinc-800 pb-2">Endereço</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="CEP">
            <div className="relative">
              <input
                {...register('cep')}
                className="input-dark pr-10"
                placeholder="00000-000"
                maxLength={9}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2')
                  setValue('cep', v)
                  if (v.replace(/\D/g, '').length === 8) buscarCep(v)
                }}
              />
              {buscandoCep && <Loader2 size={14} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />}
            </div>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Rua / Logradouro">
              <input {...register('rua')} className="input-dark" placeholder="Rua das Flores" />
            </Field>
          </div>
          <Field label="Número">
            <input {...register('numero')} className="input-dark" placeholder="123" />
          </Field>
          <Field label="Complemento">
            <input {...register('complemento')} className="input-dark" placeholder="Apto 42" />
          </Field>
          <Field label="Bairro">
            <input {...register('bairro')} className="input-dark" placeholder="Centro" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Cidade">
              <input {...register('cidade')} className="input-dark" placeholder="São Paulo" />
            </Field>
          </div>
          <Field label="Estado (UF)">
            <input {...register('estado')} className="input-dark" placeholder="SP" maxLength={2} />
          </Field>
        </div>
      </section>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="ghost-btn">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="gold-btn flex items-center gap-2">
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? 'Salvando...' : cliente ? 'Salvar alterações' : 'Criar cliente'}
        </button>
      </div>
    </form>
  )
}
