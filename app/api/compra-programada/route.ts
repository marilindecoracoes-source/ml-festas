import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { cliente_id, valor_parcela, prazo_meses, valor_credito, dia_vencimento } = await req.json()
    if (!cliente_id) return NextResponse.json({ error: 'cliente_id obrigatório' }, { status: 400 })

    const supabase = createServiceClient()

    const { data: cliente, error: cliErr } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', cliente_id)
      .single()

    if (cliErr || !cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    // Gera número sequencial por ano
    const year = new Date().getFullYear()
    const { data: lastContrato } = await supabase
      .from('compras_programadas')
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

    const { data: contrato, error: ctErr } = await supabase
      .from('compras_programadas')
      .insert({
        numero,
        cliente_id,
        valor_parcela: valor_parcela ?? 100,
        prazo_meses: prazo_meses ?? 10,
        valor_credito: valor_credito ?? 1000,
        dia_vencimento: dia_vencimento ?? 5,
        token_assinatura: crypto.randomUUID(),
        status_assinatura: 'pendente',
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
