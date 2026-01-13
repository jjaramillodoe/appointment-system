'use client';

import { LucideIcon } from 'lucide-react';
import { useState } from 'react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  className = ""
}: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`group relative card text-center overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-primary-200 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 via-primary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative">
        {/* Icon with enhanced animation */}
        <div className="flex justify-center mb-6 relative">
          <div className="absolute inset-0 bg-primary-200 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
          <div className={`relative p-4 rounded-full bg-primary-50 transform transition-all duration-300 ${
            isHovered ? 'scale-110 -rotate-6' : 'scale-100 rotate-0'
          }`}>
            <Icon className={`h-12 w-12 text-primary-600 transform transition-all duration-300 ${
              isHovered ? 'scale-110' : ''
            }`} />
          </div>
        </div>

        {/* Title with hover effect */}
        <h3 className="text-xl font-semibold text-gray-900 mb-4 group-hover:text-primary-700 transition-colors duration-300">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
          {description}
        </p>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 to-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
    </div>
  );
}

