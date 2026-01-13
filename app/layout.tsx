import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Adult Education Appointment System',
  description: 'Schedule your adult education appointment',
  // Favicon is automatically detected from app/favicon.ico
  // Additional icons can be added as app/icon.png, app/apple-icon.png, etc.
  metadataBase: new URL('https://appointment-system.vercel.app'),
  openGraph: {
    title: 'Adult Education Appointment System',
    description: 'Schedule your adult education intake appointment',
    url: 'https://appointment-system.vercel.app',
    siteName: 'Adult Education Appointment System',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Adult Education Appointment System',
    description: 'Schedule your adult education intake appointment',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Analytics />
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
} 