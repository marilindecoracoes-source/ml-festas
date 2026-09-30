import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { PDFFont, PDFPage } from 'pdf-lib'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import fs from 'fs'
import path from 'path'

const ML = 50
const MR = 545
const CW = 495
const PW = 595.28
const PH = 841.89

export interface PDFCompraProgramadaData {
  numero: string
  cliente: {
    nome: string
    cpf: string
    rua: string | null
    numero_casa: string | null
    complemento: string | null
    bairro: string | null
    cidade: string | null
    estado: string | null
    cep: string | null
  }
  plano: {
    valor_parcela: number
    prazo_meses: number
    valor_credito: number
    dia_vencimento: number
  }
  data_contrato: string
  assinatura_digital?: {
    nome: string
    cpf: string
    data: string
    ip: string
  }
}

function wrapText(s: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = s.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w
    if (cur && font.widthOfTextAtSize(test, size) > maxW) {
      lines.push(cur)
      cur = w
    } else {
      cur = test
    }
  }
  if (cur) lines.push(cur)
  return lines.length ? lines : ['']
}

function fmtMoeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtCPF(cpf: string): string {
  const c = cpf.replace(/\D/g, '')
  if (c.length !== 11) return cpf
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`
}

function fmtDateExtenso(iso: string): string {
  try {
    return format(parseISO(iso.split('T')[0]), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
  } catch {
    return iso
  }
}

export async function gerarContratoCompraProgramadaPDF(data: PDFCompraProgramadaData): Promise<Uint8Array> {
  const { plano } = data
  const totalPlano = plano.valor_parcela * plano.prazo_meses
  const diaVenc = String(plano.dia_vencimento).padStart(2, '0')

  const CLAUSULAS: { titulo: string; texto: string }[] = [
    {
      titulo: '2. PLANO CONTRATADO',
      texto: '',
    },
    {
      titulo: '2.1.',
      texto: `O(a) PARTICIPANTE aderirá a um plano de ${plano.prazo_meses} (${plano.prazo_meses === 10 ? 'dez' : plano.prazo_meses}) parcelas mensais de ${fmtMoeda(plano.valor_parcela)}, com vencimento no dia ${diaVenc} de cada mês, totalizando ${fmtMoeda(totalPlano)}.`,
    },
    {
      titulo: '2.2.',
      texto: `O total pago será convertido em crédito nominal de ${fmtMoeda(plano.valor_credito)} para compra de mercadorias da ML FESTAS. O crédito não é dinheiro, investimento ou aplicação e não poderá ser sacado ou trocado por espécie, ressalvados direitos obrigatórios previstos em lei.`,
    },
    {
      titulo: '2.3.',
      texto: 'A ML FESTAS não cobra taxa de adesão, administração ou comissão específica pelo funcionamento deste programa. A operação tem finalidade comercial de facilitar a forma de pagamento das mercadorias.',
    },
    {
      titulo: '3. SORTEIO E LIBERAÇÃO ANTECIPADA DO CRÉDITO',
      texto: '',
    },
    {
      titulo: '3.1.',
      texto: 'O grupo poderá ter até 10 cotas. Será realizado 01 (um) sorteio por mês entre os participantes adimplentes que ainda não tenham utilizado o crédito antecipadamente.',
    },
    {
      titulo: '3.2.',
      texto: 'O sorteio somente será realizado após a confirmação do pagamento de todas as cotas do grupo referentes ao mês.',
    },
    {
      titulo: '3.3.',
      texto: 'Se alguma cota não for paga até o vencimento, a ML FESTAS poderá remarcar a data do sorteio para aguardar a regularização do pagamento ou a substituição do participante inadimplente por outra pessoa que assuma a cota.',
    },
    {
      titulo: '3.4.',
      texto: `Quem for sorteado poderá utilizar antecipadamente o crédito de ${fmtMoeda(plano.valor_credito)}, mas continuará obrigado a pagar normalmente todas as parcelas restantes até a quitação do plano.`,
    },
    {
      titulo: '3.5.',
      texto: `Quem concluir as ${plano.prazo_meses} parcelas sem ter utilizado antecipadamente o crédito terá igualmente direito ao crédito integral de ${fmtMoeda(plano.valor_credito)} em mercadorias.`,
    },
    {
      titulo: '4. MERCADORIAS, ESTOQUE E RETIRADA',
      texto: '',
    },
    {
      titulo: '4.1.',
      texto: 'O crédito poderá ser utilizado somente em itens, linhas ou categorias de produtos que a ML FESTAS já comercialize regularmente. A empresa não fica obrigada a desenvolver ou passar a trabalhar com produto novo solicitado pelo participante.',
    },
    {
      titulo: '4.2.',
      texto: 'Se o produto escolhido estiver em estoque, será separado após a confirmação do pedido. O participante terá 30 (trinta) dias corridos, contados do aviso de disponibilidade, para retirá-lo.',
    },
    {
      titulo: '4.3.',
      texto: 'Se um item regularmente comercializado estiver sem estoque, ele poderá ficar como encomenda. Nesse caso, o prazo de 30 dias para retirada começa somente depois que a ML FESTAS comunicar que o produto chegou e está disponível.',
    },
    {
      titulo: '4.4.',
      texto: 'Se o item for descontinuado ou se tornar definitivamente indisponível, o participante poderá escolher outro produto comercializado pela ML FESTAS, utilizando o mesmo saldo de crédito.',
    },
    {
      titulo: '4.5.',
      texto: `Se a compra ultrapassar ${fmtMoeda(plano.valor_credito)}, a diferença será paga pelo participante. Se ficar saldo de crédito, ele permanecerá vinculado à compra de mercadorias da ML FESTAS, conforme disponibilidade e prazo operacional informado pela empresa.`,
    },
    {
      titulo: '5. ATRASO NO PAGAMENTO',
      texto: '',
    },
    {
      titulo: '5.1.',
      texto: 'O atraso de parcela sujeita o valor vencido à multa moratória de 2% e juros de 1% ao mês, calculados proporcionalmente ao período de atraso, além de atualização quando legalmente cabível.',
    },
    {
      titulo: '5.2.',
      texto: 'Enquanto estiver inadimplente, o participante não poderá participar do sorteio nem utilizar crédito ainda não liberado.',
    },
    {
      titulo: '5.3.',
      texto: 'Se o participante já tiver recebido mercadorias ou utilizado o crédito antecipadamente, o atraso ou abandono do plano não elimina a obrigação de pagar as parcelas restantes.',
    },
    {
      titulo: '6. DESISTÊNCIA E SUBSTITUIÇÃO DA COTA',
      texto: '',
    },
    {
      titulo: '6.1.',
      texto: 'Se o participante desejar sair do programa antes de utilizar o crédito, deverá comunicar a ML FESTAS por escrito. A saída não gera devolução imediata dos valores já pagos pela ML FESTAS.',
    },
    {
      titulo: '6.2.',
      texto: 'Para evitar prejuízo ao participante e ao grupo, a ML FESTAS poderá buscar uma nova pessoa para assumir a cota. A substituição dependerá da aceitação do novo participante, regularização dos valores da cota e assinatura/aceite do respectivo termo de transferência.',
    },
    {
      titulo: '6.3.',
      texto: 'Quando a cota for efetivamente assumida por um substituto, os valores referentes às parcelas já pagas pelo participante que está saindo serão acertados conforme o valor efetivamente recebido para a assunção da cota, sem que a ML FESTAS seja obrigada a antecipar recursos próprios para esse reembolso.',
    },
    {
      titulo: '6.4.',
      texto: 'Até que a substituição seja concluída, a cota permanece vinculada ao participante original e às obrigações já assumidas. Esta cláusula será aplicada sem prejuízo de direitos legais que não possam ser afastados por contrato.',
    },
    {
      titulo: '7. COMUNICAÇÕES E DISPOSIÇÕES FINAIS',
      texto: '',
    },
    {
      titulo: '7.1.',
      texto: 'Avisos de pagamento, remarcação de sorteio, contemplação, disponibilidade de mercadoria, encomenda e demais comunicações poderão ser realizados pelo WhatsApp ou outro contato informado pelo participante.',
    },
    {
      titulo: '7.2.',
      texto: 'Este contrato, os comprovantes de pagamento, o registro da contemplação e o termo de retirada formam o conjunto documental da operação.',
    },
    {
      titulo: '7.3.',
      texto: 'O participante declara ter lido e compreendido as regras do plano, especialmente a continuidade das parcelas após eventual antecipação do crédito, as regras de estoque/encomenda e a forma de substituição da cota em caso de desistência.',
    },
  ]

  const doc = await PDFDocument.create()
  const fontReg = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  const sigPath = path.join(process.cwd(), 'public', 'assinatura.jpg')
  const sigBytes = fs.readFileSync(sigPath)
  const sigImage = await doc.embedJpg(sigBytes)

  let page: PDFPage = doc.addPage([PW, PH])
  let y = 790

  function checkPage(needed: number) {
    if (y - needed < 55) {
      page = doc.addPage([PW, PH])
      y = 790
    }
  }

  function t(s: string, x: number, yp: number, size: number, bold = false, colr: [number, number, number] = [0, 0, 0]) {
    page.drawText(s, {
      x, y: yp, size,
      font: bold ? fontBold : fontReg,
      color: rgb(colr[0], colr[1], colr[2]),
    })
  }

  function ct(s: string, yp: number, size: number, bold = false) {
    const font = bold ? fontBold : fontReg
    const w = font.widthOfTextAtSize(s, size)
    t(s, (PW - w) / 2, yp, size, bold)
  }

  function hl(yp: number, x1 = ML, x2 = MR, thick = 0.5, gray = 0.55) {
    page.drawLine({ start: { x: x1, y: yp }, end: { x: x2, y: yp }, thickness: thick, color: rgb(gray, gray, gray) })
  }

  function rc(x: number, yp: number, w: number, h: number, fill: number) {
    page.drawRectangle({ x, y: yp, width: w, height: h, color: rgb(fill, fill, fill) })
  }

  function para(s: string, indent = 0, size = 9, bold = false) {
    const font = bold ? fontBold : fontReg
    const lines = wrapText(s, font, size, CW - indent)
    for (const ln of lines) {
      checkPage(size * 2)
      t(ln, ML + indent, y, size, bold)
      y -= size * 1.55
    }
  }

  function secHeader(s: string) {
    checkPage(28)
    rc(ML, y - 4, CW, 18, 0.87)
    t(s, ML + 5, y + 2, 9, true)
    y -= 16
    hl(y)
    y -= 9
  }

  function lv(label: string, value: string) {
    checkPage(16)
    const lw = fontBold.widthOfTextAtSize(`${label}: `, 9)
    t(`${label}: `, ML, y, 9, true)
    const maxValW = CW - lw
    const valLines = wrapText(value, fontReg, 9, maxValW)
    t(valLines[0], ML + lw, y, 9)
    y -= 13
    for (let i = 1; i < valLines.length; i++) {
      checkPage(14)
      t(valLines[i], ML + lw, y, 9)
      y -= 13
    }
  }

  // ─── CABEÇALHO ──────────────────────────────────────────────────────────
  ct('MARILIN DECORAÇÕES LTDA', y, 18, true)
  y -= 23
  ct('ML Festas | Compra Programada', y, 9)
  y -= 13
  ct('marilindecoracoes@gmail.com  |  (21) 98633-9197', y, 8)
  y -= 15
  hl(y, ML, MR, 1.5, 0.0)
  y -= 15

  // ─── TÍTULO ─────────────────────────────────────────────────────────────
  ct('CONTRATO DE COMPRA PROGRAMADA', y, 13, true)
  y -= 19
  ct(`Nº ${data.numero}`, y, 10)
  y -= 20

  // ─── QUADRO RESUMO ──────────────────────────────────────────────────────
  const halfW = Math.floor(CW / 2) - 2
  const midX = ML + Math.floor(CW / 2) + 2
  rc(ML, y - 16, halfW, 18, 0.15)
  rc(midX, y - 16, halfW, 18, 0.15)
  t('PARCELA', ML + 5, y - 10, 8, true, [1, 1, 1])
  t('PRAZO', midX + 5, y - 10, 8, true, [1, 1, 1])
  y -= 18
  hl(y)
  t(`${fmtMoeda(plano.valor_parcela)} / mês`, ML + 5, y - 17, 10)
  t(`${plano.prazo_meses} meses`, midX + 5, y - 17, 10)
  y -= 30
  rc(ML, y - 16, halfW, 18, 0.15)
  rc(midX, y - 16, halfW, 18, 0.15)
  t('CRÉDITO', ML + 5, y - 10, 8, true, [1, 1, 1])
  t('VENCIMENTO', midX + 5, y - 10, 8, true, [1, 1, 1])
  y -= 18
  hl(y)
  t(fmtMoeda(plano.valor_credito), ML + 5, y - 17, 10)
  t(`Dia ${diaVenc}`, midX + 5, y - 17, 10)
  y -= 30
  y -= 6

  // ─── SEÇÃO 1 ────────────────────────────────────────────────────────────
  secHeader('1. PARTES E ADESÃO')
  para(
    'FORNECEDORA: ML FESTAS, razão social MARILIN DECORACOES LTDA, CNPJ/CPF nº 55.796.261/0001-51, endereço Praça Corsega, 45 – Vigário Geral no CEP: 21241-160.',
    0, 9, false
  )
  y -= 3
  const endParts = [data.cliente.rua, data.cliente.numero_casa, data.cliente.complemento, data.cliente.bairro].filter(Boolean)
  const cidParts = [data.cliente.cidade, data.cliente.estado, data.cliente.cep].filter(Boolean)
  const enderecoCompleto = [...endParts, ...cidParts].join(', ') || '—'
  para(
    `PARTICIPANTE: Nome ${data.cliente.nome || '—'}, CPF nº ${fmtCPF(data.cliente.cpf)}, endereço ${enderecoCompleto}.`,
    0, 9, false
  )
  y -= 8

  // ─── CLÁUSULAS 2–7 ──────────────────────────────────────────────────────
  for (const cl of CLAUSULAS) {
    if (cl.texto === '') {
      checkPage(26)
      y -= 2
      secHeader(cl.titulo)
    } else {
      checkPage(20)
      para(cl.titulo, 0, 9, true)
      para(cl.texto, 12, 9, false)
      y -= 3
    }
  }

  // ─── CIÊNCIA DO PARTICIPANTE ────────────────────────────────────────────
  checkPage(60)
  y -= 4
  rc(ML, y - 50, CW, 54, 0.95)
  const cienciaTexto = `CIÊNCIA DO PARTICIPANTE: Estou ciente de que pago ${fmtMoeda(plano.valor_parcela)} por mês durante ${plano.prazo_meses} meses, que o sorteio depende do pagamento de todas as cotas do mês e que, se eu for contemplado antes do fim, continuarei pagando as parcelas restantes.`
  const cienciaLines = wrapText(cienciaTexto, fontReg, 8.5, CW - 16)
  let cy = y - 14
  for (const ln of cienciaLines) {
    t(ln, ML + 8, cy, 8.5, ln === cienciaLines[0])
    cy -= 12
  }
  y -= 60

  // ─── ASSINATURAS ────────────────────────────────────────────────────────
  checkPage(160)
  y -= 6
  secHeader('ASSINATURAS')
  t(`Rio de Janeiro, ${fmtDateExtenso(data.data_contrato)}.`, ML, y, 9)
  y -= 70

  const SIG_MAX_W = 140
  const SIG_MAX_H = 45
  const scaleW = SIG_MAX_W / sigImage.width
  const scaleH = SIG_MAX_H / sigImage.height
  const sigScale = Math.min(scaleW, scaleH)
  const sigW = sigImage.width * sigScale
  const sigH = sigImage.height * sigScale
  const sigX = ML + 285 + (210 - sigW) / 2
  page.drawImage(sigImage, { x: sigX, y: y + 6, width: sigW, height: sigH })

  hl(y, ML, ML + 210)
  hl(y, ML + 285, MR)
  y -= 14
  const partLabel = 'PARTICIPANTE'
  const partW = fontBold.widthOfTextAtSize(partLabel, 9)
  t(partLabel, ML + (210 - partW) / 2, y, 9, true)
  const mlLabel = 'ML FESTAS / RESPONSÁVEL'
  const mlW = fontBold.widthOfTextAtSize(mlLabel, 9)
  t(mlLabel, ML + 285 + ((MR - ML - 285) - mlW) / 2, y, 9, true)
  y -= 13
  const respLabel = 'Mariza Linhares da Silva'
  const respW = fontReg.widthOfTextAtSize(respLabel, 9)
  t(respLabel, ML + 285 + ((MR - ML - 285) - respW) / 2, y, 9)

  if (data.assinatura_digital) {
    const sig = data.assinatura_digital
    const fmtDataSig = (() => {
      try {
        const date = parseISO(sig.data)
        const parts = new Intl.DateTimeFormat('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit', hour12: false,
        }).formatToParts(date)
        const g = (tp: string) => parts.find(p => p.type === tp)?.value ?? ''
        return `${g('day')}/${g('month')}/${g('year')} às ${g('hour')}:${g('minute')}`
      } catch {
        return sig.data
      }
    })()
    y -= 13
    const digLabel = `Assinado digitalmente por ${sig.nome}`
    const digW = fontBold.widthOfTextAtSize(digLabel, 8)
    t(digLabel, ML + (210 - digW) / 2, y, 8, true)
    y -= 11
    const digData = `Em ${fmtDataSig} — IP: ${sig.ip}`
    const digDataW = fontReg.widthOfTextAtSize(digData, 7)
    t(digData, ML + (210 - digDataW) / 2, y, 7)
    y -= 10
    const digCpf = `CPF: ${sig.cpf}`
    const digCpfW = fontReg.widthOfTextAtSize(digCpf, 7)
    t(digCpf, ML + (210 - digCpfW) / 2, y, 7)
  }
  y -= 35

  // Rodapé
  checkPage(30)
  hl(y, ML, MR, 0.5, 0.7)
  y -= 12
  const rodape1 = 'Contrato elaborado em conformidade com o Código Civil Brasileiro (Lei n. 10.406/2002) e o Código de Defesa do Consumidor (Lei n. 8.078/1990).'
  const rod1W = fontReg.widthOfTextAtSize(rodape1, 7)
  t(rodape1, (PW - rod1W) / 2, y, 7)
  y -= 11
  const rodape2 = 'Marilin Decorações LTDA — Rio de Janeiro/RJ  |  Todos os direitos reservados.'
  const rod2W = fontReg.widthOfTextAtSize(rodape2, 7)
  t(rodape2, (PW - rod2W) / 2, y, 7)

  return doc.save()
}
