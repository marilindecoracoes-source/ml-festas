import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { locacao_id } = await req.json()
    if (!locacao_id) return NextResponse.json({ error: 'locacao_id obrigatório' }, { status: 400 })

    const supabase = createServiceClient()

    // Busca locação com cliente e itens
    const { data: locacao, error: locErr } = await supabase
      .from('locacoes')
      .select('*, clientes(*), locacao_itens(*)')
      .eq('id', locacao_id)
      .single()

    if (locErr || !locacao) {
      return NextResponse.json({ error: 'Locação não encontrada' }, { status: 404 })
    }

    // Gera número sequencial por ano
    const year = new Date().getFullYear()
    const { data: lastContrato } = await supabase
      .from('contratos')
      .select('numero')
      .ilike('numero', `%/${year}`)
      .order('numero', { ascending: false })
      .limit(1)

    let seq = 1
    if (lastContrato && lastContrato.length > 0) {
      const parsed = parseInt(lastContrato[0].numero.split('/')[0])
      if (!isNaN(parsed)) seq = parsed + 1
    }

    const numero = `${String(seq).padStart(3, '0')}/${year}`

    // Salva registro do contrato
    const { data: contrato, error: ctErr } = await supabase
      .from('contratos')
      .insert({
        numero,
        locacao_id,
        cliente_id: locacao.cliente_id,
      })
      .select()
      .single()

    if (ctErr) {
      return NextResponse.json({ error: ctErr.message }, { status: 500 })
    }

    return NextResponse.json({ numero, id: contrato.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno' }, { status: 500 })
  }
}
