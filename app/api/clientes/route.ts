import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { hashCPF } from '@/lib/cpf-crypto'

export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase.from('clientes').select('*').order('nome')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()
  const body = await request.json()
  const cpf_hash = hashCPF(body.cpf)
  const { data, error } = await supabase
    .from('clientes')
    .insert({ ...body, cpf_hash, total_gasto: 0 })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
