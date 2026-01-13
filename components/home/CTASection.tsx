'use client';

import Link from 'next/link';
import { ArrowRight, Phone, Mail, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface CTASectionProps {
  title?: string;
  description?: string;
  primaryCTA?: {
    text: string;
    href: string;
  };
  contact?: {
    phone?: string;
    email?: string;
  };
  className?: string;
}

export default function CTASection({
  title = "Ready to Get Started?",
  description = "Take the first step towards your educational goals. Our team is here to help you succeed.",
  primaryCTA = {
    text: "Register Now",
    href: "/register"
  },
  contact = {
    phone: "(555) 123-4567",
    email: "info@adulteducation.org"
  },
  className = ""
}: CTASectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} className={`mb-20 ${className}`}>
      <div className={`relative card text-center overflow-hidden border-2 border-primary-200 bg-gradient-to-br from-primary-50 via-white to-primary-50 transition-all duration-1000 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        {/* Animated background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary-400 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-400 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        {/* Sparkles decoration */}
        <div className="absolute top-4 right-4 opacity-20">
          <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" />
        </div>

        <div className="relative z-10">
          <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-primary-700 via-primary-600 to-yellow-600 bg-clip-text text-transparent">
            {title}
          </h3>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed px-4">
            {description}
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link
              href={primaryCTA.href}
              className="group relative btn-primary text-lg px-10 py-4 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              aria-label={primaryCTA.text}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative flex items-center">
                {primaryCTA.text}
                <ArrowRight className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Link>

            {(contact.phone || contact.email) && (
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-gray-600">
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone.replace(/\D/g, '')}`}
                    className="group flex items-center hover:text-primary-600 transition-colors duration-300"
                  >
                    <div className="p-2 rounded-full bg-primary-50 group-hover:bg-primary-100 transition-colors duration-300 mr-2">
                      <Phone className="h-4 w-4 text-primary-600" />
                    </div>
                    <span className="font-medium">{contact.phone}</span>
                  </a>
                )}
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="group flex items-center hover:text-primary-600 transition-colors duration-300"
                  >
                    <div className="p-2 rounded-full bg-primary-50 group-hover:bg-primary-100 transition-colors duration-300 mr-2">
                      <Mail className="h-4 w-4 text-primary-600" />
                    </div>
                    <span className="font-medium">{contact.email}</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 via-yellow-500 to-primary-400"></div>
      </div>
    </div>
  );
}

