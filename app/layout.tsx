import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ML Festas — Gestão',
  description: 'Sistema de gestão ML Festas — Locação e Venda',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="text-white antialiased" style={{ backgroundColor: '#0b0b13' }}>{children}</body>
    </html>
  )
}
