import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

export function formatarData(data: string | null | undefined): string {
  if (!data) return '—'
  try {
    const d = parseISO(data)
    if (!isValid(d)) return '—'
    return format(d, 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return '—'
  }
}

export function formatarCPF(cpf: string): string {
  return cpf
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function limparCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

export function validarCPF(cpf: string): boolean {
  const cleaned = limparCPF(cpf)
  if (cleaned.length !== 11) return false
  if (/^(\d)\1+$/.test(cleaned)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i)
  let rem = (sum * 10) % 11
  if (rem === 10 || rem === 11) rem = 0
  if (rem !== parseInt(cleaned[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i)
  rem = (sum * 10) % 11
  if (rem === 10 || rem === 11) rem = 0
  return rem === parseInt(cleaned[10])
}

export function gerarCodigoPedido(sequencial: number): string {
  return `ML-${String(sequencial).padStart(4, '0')}`
}

export function gerarTituloPedido(nomeCliente: string, numeroPedido: number): string {
  if (numeroPedido === 1) return nomeCliente
  return `${nomeCliente} — Pedido ${String(numeroPedido).padStart(2, '0')}`
}

export function calcularRestante(total: number, sinal: number): number {
  return Math.max(0, total - sinal)
}

export function mesAtual(): string {
  return format(new Date(), 'yyyy-MM')
}

export function nomeMes(mesAno: string): string {
  const [ano, mes] = mesAno.split('-')
  const d = new Date(parseInt(ano), parseInt(mes) - 1, 1)
  return format(d, 'MMM', { locale: ptBR })
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
