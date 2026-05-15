import type { Metadata, Viewport } from 'next'
import { Newsreader } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { ThemeProvider, THEME_SCRIPT } from '@/components/shared/ThemeProvider'

const display = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SquadStay',
  description: 'Plan group holidays together',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SquadStay',
    startupImage: '/icons/apple-touch-icon.png',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#E0533A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${display.variable}`}>
      {/* Prevent flash of wrong theme — runs before React hydrates */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
