import type { Metadata } from 'next'
import './globals.css'
import './landing.css'

export const metadata: Metadata = {
  title: 'VETRO | Inteligência comercial para incorporadoras',
  description: 'A inteligência por trás da operação comercial.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
