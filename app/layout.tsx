import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Adult Education Appointment System',
  description: 'Schedule your adult education intake appointment',
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