'use client';

import { LucideIcon, CheckCircle, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface ProgramCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  className?: string;
}

export default function ProgramCard({
  icon: Icon,
  title,
  description,
  features,
  className = ""
}: ProgramCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`group relative card overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-primary-200 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative">
        {/* Icon with animation */}
        <div className="flex justify-center mb-6 relative">
          <div className="absolute inset-0 bg-primary-100 rounded-full blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
          <div className={`relative p-4 rounded-2xl bg-primary-50 transform transition-all duration-300 ${
            isHovered ? 'scale-110 rotate-3' : ''
          }`}>
            <Icon className="h-12 w-12 text-primary-600 transform transition-transform duration-300" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-center group-hover:text-primary-700 transition-colors duration-300">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 mb-6 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
          {description}
        </p>

        {/* Features with staggered animation */}
        <ul className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <li
              key={index}
              className="flex items-center text-sm text-gray-600 group-hover:text-gray-700 transition-all duration-300 transform group-hover:translate-x-1"
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 transform group-hover:scale-110 transition-transform duration-300" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Learn more indicator */}
        <div className="flex items-center justify-center text-primary-600 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <span className="text-sm font-medium mr-2">Learn more</span>
          <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" />
        </div>
      </div>
    </div>
  );
}

