import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { PDFFont, PDFPage } from 'pdf-lib'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const ML = 50
const MR = 545
const CW = 495
const PW = 595.28
const PH = 841.89

export interface PDFContratoData {
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
    telefone: string | null
    instagram: string | null
    email: string | null
  }
  locacao: {
    data_retirada: string | null
    data_devolucao: string | null
    itens: { descricao: string; quantidade: number }[]
    valor_total: number
    valor_sinal: number
    forma_pagamento_sinal: string | null
    data_pedido: string
  }
  data_contrato: string
}

const CLAUSULAS = [
  {
    titulo: '6.1. Retirada e Devolução',
    texto: 'É de exclusiva responsabilidade do Locatário a retirada e a devolução dos materiais locados no local, data e horário previamente acordados neste contrato, conforme Art. 475 do Código Civil Brasileiro. A liberação dos materiais somente será realizada ao responsável indicado neste instrumento, mediante assinatura do presente contrato.',
  },
  {
    titulo: '6.2. Atraso na Devolução',
    texto: 'Em caso de atraso na devolução dos materiais, será aplicada multa moratória de 10% (dez por cento) sobre o valor total da locação por dia de atraso, nos termos do Art. 408 do Código Civil Brasileiro. O Locatário será notificado por escrito (WhatsApp ou e-mail) antes da aplicação da penalidade.',
  },
  {
    titulo: '6.3. Responsabilidade por Danos',
    texto: 'Durante o período da locação, o Locatário é integralmente responsável pela conservação, guarda e integridade dos materiais locados, nos termos dos Arts. 927 e 186 do Código Civil. Em caso de avaria, perda, furto ou roubo, o Locatário se obriga a ressarcir o Locador pelo valor de mercado do(s) material(ais) afetado(s), conforme tabela de preços vigente da Marilin Decorações.',
  },
  {
    titulo: '6.4. Condições de Devolução',
    texto: 'Os materiais deverão ser devolvidos nas mesmas condições em que foram entregues: limpos, embalados adequadamente e em plenas condições de uso. Materiais devolvidos com sujeira excessiva ou sem embalagem adequada estarão sujeitos à cobrança de taxa de limpeza/reembalagem equivalente a 10% (dez por cento) sobre o valor total da locação, cobrada automaticamente no momento da vistoria de devolução.',
  },
  {
    titulo: '6.5. Sinal e Reserva',
    texto: 'A reserva dos materiais somente se efetivará mediante o pagamento de sinal equivalente a 50% (cinquenta por cento) do valor total da locação, conforme estabelecido no Art. 417 do Código Civil Brasileiro. Sem o pagamento do sinal, os materiais não serão reservados e poderão ser locados a terceiros.',
  },
  {
    titulo: '6.6. Desistência e Cancelamento',
    texto: 'Em caso de desistência após o pagamento do sinal, o valor pago ficará retido como crédito para uma próxima locação, válido por 90 (noventa) dias a contar da data de desistência. Cancelamentos com menos de 48 (quarenta e oito) horas de antecedência à data de retirada não gerarão direito a crédito ou reembolso, nos termos do Art. 395 do Código Civil.',
  },
  {
    titulo: '6.7. Caução',
    texto: 'Para locações com valor total de até R$ 200,00 (duzentos reais), não será exigida caução. Para locações acima de R$ 200,00 (duzentos reais), será cobrada caução equivalente a 30% (trinta por cento) do valor total da locação, a ser paga no ato da retirada dos materiais. O valor da caução será integralmente devolvido ao Locatário no ato da devolução dos materiais, desde que os mesmos estejam em perfeitas condições de uso, conforme vistoria realizada pelo Locador. Em caso de avaria, o valor da caução será utilizado para compensação dos danos, conforme cláusula 6.3.',
  },
  {
    titulo: '6.8. Aceite e Ciência das Condições dos Materiais',
    texto: 'O recebimento dos materiais pelo Locatário ou por terceiro por ele designado para realizar a retirada implica plena ciência e concordância com o estado de conservação e as condições dos itens locados no momento da entrega. Ao aceitar os materiais, o Locatário — ou o terceiro que os retirar em seu nome — declara que os recebeu em condições adequadas de uso e assume integral responsabilidade pela sua conservação durante o período de locação, nos termos do Art. 393 do Código Civil Brasileiro. Não serão aceitas reclamações sobre as condições dos materiais após a efetivação da retirada.',
  },
  {
    titulo: '6.9. Proibições',
    texto: 'É expressamente vedado ao Locatário: (a) sublocar, ceder ou emprestar os materiais a terceiros sem autorização prévia e por escrito do Locador; (b) realizar alterações, pinturas, cortes ou modificações nos materiais locados; (c) utilizar os materiais de forma inadequada ou diferente de sua finalidade original. O descumprimento de qualquer proibição implicará responsabilização integral pelos danos causados.',
  },
  {
    titulo: '6.10. Proteção de Dados (LGPD)',
    texto: 'Os dados pessoais coletados neste contrato serão utilizados exclusivamente para fins de identificação das partes e cumprimento das obrigações contratuais, em conformidade com a Lei n. 13.709/2018 (Lei Geral de Proteção de Dados - LGPD). O Locador se compromete a não compartilhar os dados do Locatário com terceiros sem sua expressa autorização.',
  },
  {
    titulo: '6.11. Foro e Resolução de Conflitos',
    texto: 'As partes elegem o foro da Comarca do Rio de Janeiro/RJ como competente para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja, nos termos do Art. 63 do Código de Processo Civil. Antes de qualquer medida judicial, as partes comprometem-se a buscar solução amigável em até 30 (trinta) dias.',
  },
  {
    titulo: '6.12. Disposições Gerais',
    texto: 'Este contrato é celebrado em conformidade com o Código Civil Brasileiro (Lei n. 10.406/2002), o Código de Defesa do Consumidor (Lei n. 8.078/1990) — aplicável quando o Locatário for pessoa física consumidora final — e demais legislação vigente. Qualquer alteração nas condições deste contrato somente será válida mediante aditivo escrito e assinado por ambas as partes.',
  },
]

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

function fmtDateBR(iso: string | null): string {
  if (!iso) return '—'
  const d = iso.split('T')[0].split('-')
  return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : iso
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

export async function gerarContratoPDF(data: PDFContratoData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const fontReg = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

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
    // wrap value if too long
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
  ct('Locação de Materiais para Decoração de Festas', y, 9)
  y -= 13
  ct('marilindecoracoes@gmail.com  |  (21) 98633-9197', y, 8)
  y -= 15
  hl(y, ML, MR, 1.5, 0.0)
  y -= 15

  // ─── TÍTULO DO CONTRATO ─────────────────────────────────────────────────
  ct('CONTRATO DE LOCAÇÃO DE MATERIAIS', y, 13, true)
  y -= 19
  ct(`Nº ${data.numero}`, y, 10)
  y -= 22

  // ─── SEÇÃO 1 ────────────────────────────────────────────────────────────
  secHeader('1. DADOS DO LOCADOR (MARILIN DECORAÇÕES)')
  lv('Empresa', 'MARILIN DECORAÇÕES LTDA')
  lv('CNPJ', '55.796.261/0001-51')
  lv('Endereço', 'Rua Otranto, 1002 - Vigário Geral - Rio de Janeiro')
  lv('Responsável', 'Mariza Linhares da Silva')
  lv('Telefone', '(21) 98633-9197')
  lv('E-mail', 'marilindecoracoes@gmail.com')
  y -= 7

  // ─── SEÇÃO 2 ────────────────────────────────────────────────────────────
  secHeader('2. DADOS DO LOCATÁRIO (CLIENTE)')
  const endParts = [data.cliente.rua, data.cliente.numero_casa, data.cliente.complemento].filter(Boolean)
  const cidParts = [data.cliente.cidade, data.cliente.estado, data.cliente.cep].filter(Boolean)
  lv('Empresa / Nome', data.cliente.nome || '—')
  lv('CNPJ / CPF', fmtCPF(data.cliente.cpf))
  lv('Endereço', endParts.length ? endParts.join(', ') : '—')
  lv('Cidade / Estado / CEP', cidParts.length ? cidParts.join(' / ') : '—')
  lv('Telefone / WhatsApp', data.cliente.telefone || '—')
  lv('Rede Social / Instagram', data.cliente.instagram || '—')
  lv('E-mail', data.cliente.email || '—')
  y -= 7

  // ─── SEÇÃO 3 ────────────────────────────────────────────────────────────
  secHeader('3. PERÍODO DA LOCAÇÃO')
  const halfW = Math.floor(CW / 2) - 2
  const midX = ML + Math.floor(CW / 2) + 2
  rc(ML, y - 16, halfW, 18, 0.15)
  rc(midX, y - 16, halfW, 18, 0.15)
  t('DATA DE RETIRADA', ML + 5, y - 10, 8, true, [1, 1, 1])
  t('DATA DE DEVOLUÇÃO', midX + 5, y - 10, 8, true, [1, 1, 1])
  y -= 18
  hl(y)
  t(fmtDateBR(data.locacao.data_retirada), ML + 5, y - 17, 10)
  t(fmtDateBR(data.locacao.data_devolucao), midX + 5, y - 17, 10)
  y -= 30
  y -= 5

  // ─── SEÇÃO 4 ────────────────────────────────────────────────────────────
  secHeader('4. MATERIAIS LOCADOS')
  // colunas: QTD | DESCRIÇÃO | VALOR UNIT. | VALOR TOTAL
  const cQ = ML           // QTD: 30pt
  const cD = ML + 32      // DESCRIÇÃO: 250pt
  const cU = ML + 285     // VALOR UNIT.: 125pt
  const cT = ML + 413     // VALOR TOTAL: 132pt até MR

  rc(ML, y - 14, CW, 16, 0.85)
  t('QTD', cQ + 2, y - 9, 8, true)
  t('DESCRIÇÃO DO MATERIAL', cD + 2, y - 9, 8, true)
  t('VALOR UNIT.', cU + 2, y - 9, 8, true)
  t('VALOR TOTAL', cT + 2, y - 9, 8, true)
  y -= 18

  if (data.locacao.itens.length === 0) {
    checkPage(18)
    t('—', cD + 2, y - 2, 9)
    y -= 16
  } else {
    for (const item of data.locacao.itens) {
      const lines = wrapText(item.descricao, fontReg, 9, 245)
      const rowH = Math.max(16, lines.length * 13 + 4)
      checkPage(rowH + 4)
      t(String(item.quantidade), cQ + 2, y - 12, 9)
      let ry = y - 12
      for (const ln of lines) {
        t(ln, cD + 2, ry, 9)
        ry -= 13
      }
      y -= rowH
      hl(y, ML, MR, 0.3, 0.82)
    }
  }

  y -= 4
  checkPage(70)
  hl(y, ML, MR, 0.8, 0.4)
  y -= 4
  t('SUBTOTAL DA LOCAÇÃO:', cU, y - 14, 9, true)
  t(fmtMoeda(data.locacao.valor_total), cT, y - 14, 9)
  t('SINAL (50%):', cU, y - 28, 9, true)
  t(fmtMoeda(data.locacao.valor_sinal), cT, y - 28, 9)
  t('CAUÇÃO (se aplicável):', cU, y - 42, 9, true)
  t('—', cT, y - 42, 9)
  t('VALOR TOTAL:', cU, y - 56, 9, true)
  t(fmtMoeda(data.locacao.valor_total), cT, y - 56, 9, false)
  y -= 66
  y -= 6

  // ─── SEÇÃO 5 ────────────────────────────────────────────────────────────
  secHeader('5. FORMA DE PAGAMENTO')
  const formas = ['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Outro']
  const pagoForma = (data.locacao.forma_pagamento_sinal ?? '').replace('Cartão de ', '')
  t('Forma de pagamento:', ML, y, 9, true)
  y -= 14
  let xOff = ML
  for (const f of formas) {
    const fw = fontReg.widthOfTextAtSize(f, 9) + 22
    if (xOff + fw > MR - 10 && xOff > ML) { xOff = ML; y -= 14 }
    const isChecked = data.locacao.forma_pagamento_sinal === f ||
      (f === 'PIX' && data.locacao.forma_pagamento_sinal === 'Pix')
    page.drawRectangle({ x: xOff, y: y - 2, width: 8, height: 8, borderColor: rgb(0, 0, 0), borderWidth: 0.5, color: rgb(1, 1, 1) })
    if (isChecked) t('X', xOff + 1, y - 1, 7, true)
    t(f, xOff + 11, y, 9)
    xOff += fw
  }
  y -= 18
  checkPage(18)
  t('Data do pagamento do sinal:', ML, y, 9, true)
  t(fmtDateBR(data.locacao.data_pedido), ML + fontBold.widthOfTextAtSize('Data do pagamento do sinal: ', 9), y, 9)
  t('Data do pagamento do restante: ______/______/______', ML + 250, y, 9)
  y -= 20

  // ─── SEÇÃO 6 ────────────────────────────────────────────────────────────
  secHeader('6. CLÁUSULAS E CONDIÇÕES GERAIS')
  for (const cl of CLAUSULAS) {
    checkPage(24)
    y -= 4
    para(cl.titulo, 0, 9, true)
    para(cl.texto, 12, 9, false)
  }

  // ─── SEÇÃO 7 ────────────────────────────────────────────────────────────
  checkPage(130)
  y -= 6
  secHeader('7. ASSINATURAS')
  t(`Rio de Janeiro, ${fmtDateExtenso(data.data_contrato)}.`, ML, y, 9)
  y -= 45

  // Linhas de assinatura
  hl(y, ML, ML + 210)
  hl(y, ML + 285, MR)
  y -= 14
  const locLabel = 'LOCATÁRIO'
  const locW = fontBold.widthOfTextAtSize(locLabel, 9)
  t(locLabel, ML + (210 - locW) / 2, y, 9, true)
  const marLabel = 'LOCADOR — MARILIN DECORAÇÕES LTDA'
  const marW = fontBold.widthOfTextAtSize(marLabel, 9)
  t(marLabel, ML + 285 + ((MR - ML - 285) - marW) / 2, y, 9, true)
  y -= 13
  const respLabel = 'Mariza Linhares da Silva'
  const respW = fontReg.widthOfTextAtSize(respLabel, 9)
  t(respLabel, ML + 285 + ((MR - ML - 285) - respW) / 2, y, 9)
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
