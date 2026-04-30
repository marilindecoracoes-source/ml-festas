import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { gerarContratoPDF } from '@/lib/pdf-generator'
import type { PDFContratoData } from '@/lib/pdf-generator'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceClient()

  const { data: contrato, error } = await supabase
    .from('contratos')
    .select('*, clientes(*), locacoes(*, locacao_itens(*))')
    .eq('id', params.id)
    .single()

  if (error || !contrato) {
    return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
  }

  const cli = contrato.clientes as any
  const loc = contrato.locacoes as any
  const itens = (loc?.locacao_itens ?? []).map((i: any) => ({ descricao: i.descricao, quantidade: i.quantidade ?? 1 }))

  const pdfData: PDFContratoData = {
    numero: contrato.numero,
    cliente: {
      nome: cli?.nome ?? '',
      cpf: cli?.cpf ?? '',
      rua: cli?.rua ?? null,
      numero_casa: cli?.numero ?? null,
      complemento: cli?.complemento ?? null,
      bairro: cli?.bairro ?? null,
      cidade: cli?.cidade ?? null,
      estado: cli?.estado ?? null,
      cep: cli?.cep ?? null,
      telefone: cli?.telefone ?? null,
      instagram: cli?.instagram ?? null,
      email: cli?.email ?? null,
    },
    locacao: {
      data_retirada: loc?.data_retirada ?? null,
      data_devolucao: loc?.data_devolucao ?? null,
      itens,
      valor_total: loc?.valor_total ?? 0,
      valor_sinal: loc?.valor_sinal ?? 0,
      forma_pagamento_sinal: loc?.forma_pagamento_sinal ?? null,
      data_pedido: loc?.data_pedido ?? contrato.criado_em,
    },
    data_contrato: contrato.criado_em,
  }

  const pdfBytes = await gerarContratoPDF(pdfData)

  const isDownload = req.nextUrl.searchParams.get('download') === 'true'
  const nomeArquivo = `contrato-${contrato.numero.replace('/', '-')}.pdf`

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': isDownload
        ? `attachment; filename="${nomeArquivo}"`
        : `inline; filename="${nomeArquivo}"`,
    },
  })
}
