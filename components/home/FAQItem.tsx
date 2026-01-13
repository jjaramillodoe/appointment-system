'use client';

import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export default function FAQItem({
  question,
  answer,
  isOpen: controlledIsOpen,
  onToggle,
  className = ""
}: FAQItemProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const handleToggle = onToggle || (() => setInternalIsOpen(!internalIsOpen));

  return (
    <div 
      className={`group card border-2 transition-all duration-300 ${
        isOpen 
          ? 'border-primary-300 shadow-lg bg-primary-50/30' 
          : 'border-transparent hover:border-primary-200 hover:shadow-md'
      } ${className}`}
    >
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg p-2 -m-2"
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Hide' : 'Show'} answer to: ${question}`}
      >
        <div className="flex items-start flex-1 pr-4">
          <HelpCircle className={`h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0 transform transition-transform duration-300 ${
            isOpen ? 'rotate-12' : ''
          }`} />
          <h4 className={`text-lg font-semibold transition-colors duration-300 ${
            isOpen ? 'text-primary-700' : 'text-gray-900 group-hover:text-primary-600'
          }`}>
            {question}
          </h4>
        </div>
        <div className={`flex-shrink-0 p-1 rounded-full transition-all duration-300 ${
          isOpen ? 'bg-primary-100 rotate-180' : 'bg-gray-100 group-hover:bg-primary-50'
        }`}>
          <ChevronDown className={`h-5 w-5 text-primary-600 transform transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`} />
        </div>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}
        role="region"
        aria-labelledby={`faq-question-${question.slice(0, 10)}`}
      >
        <p className="text-gray-600 leading-relaxed pl-8 pr-4 transform transition-transform duration-300">
          {answer}
        </p>
      </div>
    </div>
  );
}

