'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Shield, FileText } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { fmt } from '@/lib/i18n/config';

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white py-12 mt-16 border-t-4 border-yellow-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h2 className="text-lg font-bold mb-4 text-yellow-400">{t.footer.aboutTitle}</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              {t.footer.aboutText}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-lg font-bold mb-4 text-yellow-400">{t.footer.quickLinks}</h2>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/privacy" 
                  className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 text-sm flex items-center group"
                >
                  <Shield className="h-4 w-4 mr-2 group-hover:text-yellow-400" />
                  {t.footer.privacyPolicy}
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 text-sm flex items-center group"
                >
                  <FileText className="h-4 w-4 mr-2 group-hover:text-yellow-400" />
                  {t.footer.termsOfUse}
                </Link>
              </li>
              <li>
                <Link 
                  href="/login" 
                  className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 text-sm"
                >
                  {t.common.login}
                </Link>
              </li>
              <li>
                <Link 
                  href="/register" 
                  className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 text-sm"
                >
                  {t.common.register}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h2 className="text-lg font-bold mb-4 text-yellow-400">{t.footer.contactUs}</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Phone className="h-4 w-4 mr-2 mt-1 text-primary-400 flex-shrink-0" />
                <a 
                  href="tel:5551234567" 
                  className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 text-sm"
                >
                  (555) 123-4567
                </a>
              </li>
              <li className="flex items-start">
                <Mail className="h-4 w-4 mr-2 mt-1 text-primary-400 flex-shrink-0" />
                <a 
                  href="mailto:info@adulteducation.org" 
                  className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 text-sm break-all"
                >
                  info@adulteducation.org
                </a>
              </li>
              <li className="flex items-start">
                <MapPin className="h-4 w-4 mr-2 mt-1 text-primary-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">
                  52 Chambers Street<br />
                  New York, NY 10007
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm text-center md:text-left">
              {fmt(t.footer.copyright, { year: new Date().getFullYear() })}
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <Link 
                href="/privacy" 
                className="text-gray-400 hover:text-yellow-400 transition-colors duration-300"
              >
                {t.footer.privacy}
              </Link>
              <span className="text-gray-600">|</span>
              <Link 
                href="/terms" 
                className="text-gray-400 hover:text-yellow-400 transition-colors duration-300"
              >
                {t.footer.terms}
              </Link>
            </div>
          </div>
          <p className="text-center text-gray-500 text-xs mt-4">
            {t.footer.developedBy}
          </p>
        </div>
      </div>
    </footer>
  );
} 