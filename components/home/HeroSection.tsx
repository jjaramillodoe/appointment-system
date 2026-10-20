'use client';

import Image from 'next/image';
import Link from 'next/link';
import { UserPlus, LogIn } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  primaryCTA?: {
    text: string;
    href: string;
  };
  secondaryCTA?: {
    text: string;
    href: string;
  };
  logoPath?: string;
  logoAlt?: string;
  /** Path under `/public` (e.g. `/hero-graduation.jpg`) */
  backgroundImageSrc?: string;
  backgroundImageAlt?: string;
}

export default function HeroSection({
  title,
  subtitle,
  description,
  primaryCTA,
  secondaryCTA,
  logoPath = '/logo.png',
  logoAlt,
  backgroundImageSrc = '/hero-graduation.jpg',
  backgroundImageAlt,
}: HeroSectionProps) {
  const { t } = useI18n();
  const hero = t.home.hero;
  title ??= hero.title;
  subtitle ??= hero.subtitle;
  description ??= hero.description;
  primaryCTA ??= { text: hero.primaryCta, href: '/register' };
  secondaryCTA ??= { text: hero.secondaryCta, href: '/login' };
  logoAlt ??= hero.logoAlt;
  backgroundImageAlt ??= hero.imageAlt;
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div
      ref={sectionRef}
      className={`relative w-full transition-all duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
    >
      <div className="relative min-h-[420px] w-full overflow-hidden sm:min-h-[500px]">
        <Image
          src={backgroundImageSrc}
          alt={backgroundImageAlt}
          fill
          priority
          className="object-cover object-[center_30%] sm:object-center"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary-900/88 via-primary-800/72 to-primary-900/90"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-primary-900/55 via-transparent to-yellow-500/10"
          aria-hidden
        />

        <div className="relative z-10 mx-auto flex min-h-[420px] w-full max-w-7xl flex-col items-center justify-center px-4 py-14 text-center sm:min-h-[500px] sm:px-6 sm:py-20 lg:px-8">
          <p className="mb-6 inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-white/25 bg-black/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/95 shadow-sm backdrop-blur-sm sm:text-sm">
            <span className="text-yellow-200">{t.common.nycPublicSchools}</span>
            <span className="hidden text-white/40 sm:inline" aria-hidden>
              ·
            </span>
            <span>{t.common.district79}</span>
            <span className="hidden text-white/40 sm:inline" aria-hidden>
              ·
            </span>
            <span className="text-white">{t.common.adultEducation}</span>
          </p>

          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-yellow-300/20 blur-2xl" />
            <Image
              src={logoPath}
              alt={logoAlt}
              width={96}
              height={96}
              className="relative h-24 w-24 rounded-full border-2 border-yellow-300/90 bg-white/95 shadow-xl ring-4 ring-white/20 transition-transform duration-300 hover:scale-105"
              priority
            />
          </div>

          <h1 className="mb-6 max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="mb-2 block text-white drop-shadow-sm">{title}</span>
            <span className="block bg-gradient-to-r from-yellow-200 via-yellow-100 to-amber-200 bg-clip-text text-transparent drop-shadow-sm animate-gradient">
              {subtitle}
            </span>
          </h1>

          <p className="mb-10 max-w-3xl px-1 text-lg leading-relaxed text-white/90 sm:text-xl">
            {description}
          </p>

          <div className="flex w-full max-w-lg flex-col justify-center gap-4 sm:max-w-none sm:flex-row sm:gap-6">
            <Link
              href={primaryCTA.href}
              className="group relative flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-10 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              aria-label={primaryCTA.text}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-yellow-500/90 to-yellow-400/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative flex items-center">
                <UserPlus className="mr-3 h-6 w-6 transition-transform duration-300 group-hover:rotate-12" />
                {primaryCTA.text}
              </span>
            </Link>
            <Link
              href={secondaryCTA.href}
              className="group flex items-center justify-center rounded-xl border-2 border-white/50 bg-white/10 px-10 py-4 text-lg font-semibold text-white shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-yellow-200 hover:bg-white/20"
              aria-label={secondaryCTA.text}
            >
              <LogIn className="mr-3 h-6 w-6 transition-transform duration-300 group-hover:translate-x-1" />
              {secondaryCTA.text}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
