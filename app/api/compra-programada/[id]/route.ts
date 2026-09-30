import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { gerarContratoCompraProgramadaPDF } from '@/lib/pdf-generator-compra-programada'
import type { PDFCompraProgramadaData } from '@/lib/pdf-generator-compra-programada'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceClient()

  const { data: contrato, error } = await supabase
    .from('compras_programadas')
    .select('*, clientes(*)')
    .eq('id', params.id)
    .single()

  if (error || !contrato) {
    return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
  }

  const cli = contrato.clientes as any

  const pdfData: PDFCompraProgramadaData = {
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
    },
    plano: {
      valor_parcela: contrato.valor_parcela,
      prazo_meses: contrato.prazo_meses,
      valor_credito: contrato.valor_credito,
      dia_vencimento: contrato.dia_vencimento,
    },
    data_contrato: contrato.criado_em,
    ...(contrato.status_assinatura === 'assinado' && contrato.data_assinatura ? {
      assinatura_digital: {
        nome: cli?.nome ?? '',
        cpf: contrato.cpf_confirmado ?? cli?.cpf ?? '',
        data: contrato.data_assinatura,
        ip: contrato.ip_assinatura ?? '',
      }
    } : {}),
  }

  const pdfBytes = await gerarContratoCompraProgramadaPDF(pdfData)

  const isDownload = req.nextUrl.searchParams.get('download') === 'true'
  const nomeArquivo = `compra-programada-${contrato.numero.replace('/', '-')}.pdf`

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': isDownload
        ? `attachment; filename="${nomeArquivo}"`
        : `inline; filename="${nomeArquivo}"`,
    },
  })
}
