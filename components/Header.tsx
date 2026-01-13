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

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-3">
            <Image
              src="/logo.png"
              alt="Adult Education Logo"
              width={48}
              height={48}
              className="h-12 w-12 rounded-full shadow-md border border-primary-200 bg-white"
              priority
            />
            <span className="ml-2 text-2xl font-bold text-gray-900 tracking-tight">
              Adult Education Intake
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            <Link
              href="/login"
              className="btn-secondary flex items-center"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </Link>
            <Link
              href="/register"
              className="btn-primary flex items-center"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Register
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
} 