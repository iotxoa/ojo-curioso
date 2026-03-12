import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'El ojo curioso',
  description: 'Tu escuela personal de fotografía',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark">
      <body>{children}</body>
    </html>
  )
}
