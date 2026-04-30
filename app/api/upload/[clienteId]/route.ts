import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { writeFile, unlink, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

export async function POST(
  request: NextRequest,
  { params }: { params: { clienteId: string } }
) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'clientes', params.clienteId)
  if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true })

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filename = `${Date.now()}_${safeName}`
  const filePath = path.join(uploadDir, filename)
  await writeFile(filePath, buffer)

  const supabase = createServiceClient()
  const ext = path.extname(file.name).toLowerCase()
  const tipo = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? 'Imagem' : 'PDF'

  const { data, error } = await supabase.from('cliente_documentos').insert({
    cliente_id: params.clienteId,
    nome_arquivo: filename,
    tipo,
    caminho: `/uploads/clientes/${params.clienteId}/${filename}`,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { clienteId: string } }
) {
  const { searchParams } = new URL(request.url)
  const docId = searchParams.get('docId')
  if (!docId) return NextResponse.json({ error: 'No docId' }, { status: 400 })

  const supabase = createServiceClient()
  const { data: doc } = await supabase.from('cliente_documentos').select('nome_arquivo').eq('id', docId).single()

  if (doc) {
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'clientes', params.clienteId, doc.nome_arquivo)
    try { await unlink(filePath) } catch {}
  }

  await supabase.from('cliente_documentos').delete().eq('id', docId)
  return NextResponse.json({ ok: true })
}
