import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'ML Festas — Gestão',
  description: 'Sistema de gestão ML Festas — Locação e Venda',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`text-white antialiased ${inter.variable}`} style={{ backgroundColor: '#111111' }}>{children}</body>
    </html>
  )
}
