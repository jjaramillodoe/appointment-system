'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Shield, FileText } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-12 mt-16 border-t-4 border-primary-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-yellow-400">About</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              NYC Public Schools Adult Education District 79 provides comprehensive adult education 
              services to help you achieve your educational and career goals.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-yellow-400">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/privacy" 
                  className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 text-sm flex items-center group"
                >
                  <Shield className="h-4 w-4 mr-2 group-hover:text-yellow-400" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 text-sm flex items-center group"
                >
                  <FileText className="h-4 w-4 mr-2 group-hover:text-yellow-400" />
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link 
                  href="/login" 
                  className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 text-sm"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link 
                  href="/register" 
                  className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 text-sm"
                >
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-yellow-400">Contact Us</h3>
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
              &copy; {new Date().getFullYear()} NYC Public Schools - Adult Education District 79. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <Link 
                href="/privacy" 
                className="text-gray-400 hover:text-yellow-400 transition-colors duration-300"
              >
                Privacy
              </Link>
              <span className="text-gray-600">|</span>
              <Link 
                href="/terms" 
                className="text-gray-400 hover:text-yellow-400 transition-colors duration-300"
              >
                Terms
              </Link>
            </div>
          </div>
          <p className="text-center text-gray-500 text-xs mt-4">
            Developed by Javier Jaramillo
          </p>
        </div>
      </div>
    </footer>
  );
} 