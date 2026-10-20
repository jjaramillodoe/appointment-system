'use client';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
  }
}

import Link from 'next/link';
import Image from 'next/image';
import { LogIn, UserPlus } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { useI18n } from '@/contexts/I18nContext';

export default function Header() {
  const { t } = useI18n();
  return (
    <header className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 text-white shadow-d79-card border-b-4 border-yellow-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center py-5 sm:py-6">
          <div className="flex items-center space-x-3">
            <Image
              src="/logo.png"
              alt={t.header.logoAlt}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full shadow-lg border-2 border-yellow-400/90 bg-white ring-2 ring-black/20"
              priority
            />
            <div className="ml-1 min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-yellow-400/95">
                {t.header.tagline}
              </p>
              <span className="block text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
                {t.header.title}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-2 sm:pt-0">
            <LanguageSelector />
            <Link
              href="/login"
              className="inline-flex items-center rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/25 backdrop-blur-sm transition hover:bg-white/20"
            >
              <LogIn className="h-4 w-4 mr-2" aria-hidden />
              {t.common.login}
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-primary-900 shadow-md transition hover:bg-yellow-400"
            >
              <UserPlus className="h-4 w-4 mr-2" aria-hidden />
              {t.common.register}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
} 