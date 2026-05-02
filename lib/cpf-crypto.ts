import { createHmac } from 'crypto'

const KEY = process.env.CPF_ENCRYPTION_KEY!

export function hashCPF(cpf: string): string {
  const limpo = cpf.replace(/\D/g, '')
  return createHmac('sha256', KEY).update(limpo).digest('hex')
}