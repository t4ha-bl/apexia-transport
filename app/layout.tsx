import type { Metadata } from 'next'
import './globals.css'
import { StoreInitializer } from '@/components/layout/StoreInitializer'

export const metadata: Metadata = {
  title: {
    default: 'Apexia Transport | Chauffeur Privé de Luxe au Maroc',
    template: '%s | Apexia Transport',
  },
  description:
    'Apexia Transport — Service de chauffeur privé haut de gamme au Maroc. Transferts aéroport, tours privés, mise à disposition 24h/24, 7j/7.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap" rel="stylesheet" />
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&display=swap" rel="stylesheet" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" type="image/png" href="/favicon.png" />
      </head>
      <body className="bg-offblack text-ghost font-sans antialiased overflow-x-hidden selection:bg-gold selection:text-offblack">
        <StoreInitializer />
        {children}
      </body>
    </html>
  )
}
