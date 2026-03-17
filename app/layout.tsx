import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'El ojo curioso',
  description: 'Curso de iniciación a la fotografía. Aprende a ver, encuadrar y fotografiar el mundo con tu propia mirada.',
  keywords: ['fotografía', 'curso de fotografía', 'aprender fotografía', 'el ojo curioso'],
  authors: [{ name: 'El ojo curioso' }],

  // Favicon e iconos
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
    shortcut: '/favicon.ico',
  },

  // Open Graph — lo que aparece al compartir en WhatsApp, redes, etc.
  openGraph: {
    title: 'El ojo curioso',
    description: 'Curso de iniciación a la fotografía. Aprende a ver, encuadrar y fotografiar el mundo con tu propia mirada.',
    siteName: 'El ojo curioso',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'El ojo curioso — Curso de fotografía',
      },
    ],
  },

  // Twitter/X card
  twitter: {
    card: 'summary_large_image',
    title: 'El ojo curioso',
    description: 'Curso de iniciación a la fotografía.',
    images: ['/og-image.jpg'],
  },

  // No indexar en buscadores (es una app privada)
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark">
      <body>{children}</body>
    </html>
  )
}
