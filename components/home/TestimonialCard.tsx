'use client';

import { Star, Quote } from 'lucide-react';
import { useState } from 'react';

interface TestimonialCardProps {
  rating?: number;
  text: string;
  author: string;
  role: string;
  className?: string;
}

export default function TestimonialCard({
  rating = 5,
  text,
  author,
  role,
  className = ""
}: TestimonialCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`group relative card overflow-hidden border-2 border-transparent hover:border-primary-200 hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Quote icon decoration */}
      <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
        <Quote className="h-16 w-16 text-primary-600" />
      </div>

      <div className="relative">
        {/* Star rating with animation */}
        <div className="flex items-center mb-4 space-x-1">
          {[...Array(rating)].map((_, i) => (
            <Star
              key={i}
              className={`h-5 w-5 text-yellow-400 fill-current transform transition-all duration-300 ${
                isHovered ? 'scale-110' : 'scale-100'
              }`}
              style={{ transitionDelay: `${i * 50}ms` }}
            />
          ))}
        </div>

        {/* Testimonial text */}
        <p className="text-gray-600 mb-6 italic leading-relaxed relative z-10 group-hover:text-gray-700 transition-colors duration-300">
          <span className="text-2xl text-primary-300 opacity-50 leading-none">"</span>
          {text}
          <span className="text-2xl text-primary-300 opacity-50 leading-none">"</span>
        </p>

        {/* Author info */}
        <div className="border-t border-gray-200 pt-4 group-hover:border-primary-200 transition-colors duration-300">
          <div className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors duration-300">
            {author}
          </div>
          <div className="text-sm text-gray-500 mt-1">{role}</div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-primary-400 to-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
    </div>
  );
}

