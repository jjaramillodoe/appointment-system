import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { I18nProvider } from '@/contexts/I18nContext'
import { cookies, headers } from 'next/headers'
import { LOCALE_COOKIE, isLocale, localeFromAcceptLanguage } from '@/lib/i18n/config'
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Saved choice wins; otherwise follow the browser's language on first visit
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value
  const locale = isLocale(saved) ? saved : localeFromAcceptLanguage((await headers()).get('accept-language'))

  return (
    <html lang={locale}>
      <body className={inter.className} suppressHydrationWarning>
        <I18nProvider initialLocale={locale}>
          <AuthProvider>
            <Analytics />
            <div className="min-h-screen bg-gray-50">
              {children}
            </div>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  )
} 