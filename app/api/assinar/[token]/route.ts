import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = createServiceClient()

  const { data: contrato, error } = await supabase
    .from('contratos')
    .select('id, numero, status_assinatura, data_assinatura, criado_em, clientes(nome, cpf), locacoes(titulo, data_retirada, data_devolucao, valor_total)')
    .eq('token_assinatura', params.token)
    .single()

  if (error || !contrato) {
    return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
  }

  return NextResponse.json(contrato)
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = createServiceClient()

  // Busca contrato pelo token
  const { data: contrato, error } = await supabase
    .from('contratos')
    .select('id, status_assinatura, clientes(cpf)')
    .eq('token_assinatura', params.token)
    .single()

  if (error || !contrato) {
    return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
  }

  if (contrato.status_assinatura === 'assinado') {
    return NextResponse.json({ error: 'Contrato já foi assinado' }, { status: 409 })
  }

  const { cpf } = await req.json()
  if (!cpf) {
    return NextResponse.json({ error: 'CPF é obrigatório' }, { status: 400 })
  }

  // Valida CPF contra o cadastro (compara apenas dígitos)
  const cpfDigits = cpf.replace(/\D/g, '')
  const cli = contrato.clientes as any
  const cpfCadastro = (cli?.cpf ?? '').replace(/\D/g, '')

  if (cpfDigits !== cpfCadastro) {
    return NextResponse.json({ error: 'CPF não confere com o cadastro' }, { status: 422 })
  }

  // Captura IP do cliente
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'desconhecido'

  const { error: updErr } = await supabase
    .from('contratos')
    .update({
      status_assinatura: 'assinado',
      data_assinatura: new Date().toISOString(),
      ip_assinatura: ip,
      cpf_confirmado: cpfDigits,
    })
    .eq('id', contrato.id)

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
