'use client';

import Image from 'next/image';
import Link from 'next/link';
import { UserPlus, LogIn, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
}

export default function HeroSection({
  title = "Transform Your Future with",
  subtitle = "Adult Education",
  description = "Take the first step towards your educational and career goals. Our comprehensive adult education programs help you build essential skills, learn English, and prepare for new opportunities. Start your journey today!",
  primaryCTA = {
    text: "Start Your Journey",
    href: "/register"
  },
  secondaryCTA = {
    text: "Sign In",
    href: "/login"
  },
  logoPath = "/logo.png",
  logoAlt = "Adult Education Logo Large"
}: HeroSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div 
      ref={sectionRef}
      className={`flex flex-col items-center text-center mb-16 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {/* Logo with animation */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary-200 rounded-full blur-xl opacity-30 animate-pulse"></div>
        <Image
          src={logoPath}
          alt={logoAlt}
          width={96}
          height={96}
          className="relative h-24 w-24 rounded-full shadow-2xl border-2 border-primary-200 bg-white transform hover:scale-110 transition-transform duration-300"
          priority
        />
      </div>

      {/* Title with gradient effect */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
        <span className="block mb-2">{title}</span>
        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-primary-500 to-yellow-600 animate-gradient">
          {subtitle}
        </span>
      </h1>

      {/* Description */}
      <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-3xl leading-relaxed px-4">
        {description}
      </p>

      {/* CTAs with enhanced hover effects */}
      <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
        <Link
          href={primaryCTA.href}
          className="group relative btn-primary text-lg px-10 py-4 flex items-center justify-center shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          aria-label={primaryCTA.text}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          <span className="relative flex items-center">
            <UserPlus className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
            {primaryCTA.text}
          </span>
        </Link>
        <Link
          href={secondaryCTA.href}
          className="group btn-secondary text-lg px-10 py-4 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border-2 hover:border-primary-300"
          aria-label={secondaryCTA.text}
        >
          <LogIn className="h-6 w-6 mr-3 group-hover:translate-x-1 transition-transform duration-300" />
          {secondaryCTA.text}
        </Link>
      </div>

      {/* Decorative elements - hidden on mobile for better performance */}
      <div className="hidden lg:block absolute top-20 left-10 w-20 h-20 bg-primary-200 rounded-full opacity-20 blur-2xl animate-blob pointer-events-none"></div>
      <div className="hidden lg:block absolute top-40 right-10 w-32 h-32 bg-yellow-300 rounded-full opacity-20 blur-3xl animate-blob animation-delay-2000 pointer-events-none"></div>
    </div>
  );
}

