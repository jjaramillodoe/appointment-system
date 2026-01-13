'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  description: string;
}

interface HowItWorksSectionProps {
  title?: string;
  steps?: Step[];
  className?: string;
}

const defaultSteps: Step[] = [
  {
    number: 1,
    title: "Register",
    description: "Create your account with basic information and tell us about your educational goals"
  },
  {
    number: 2,
    title: "Schedule",
    description: "Choose your preferred 30-minute appointment time from our available slots"
  },
  {
    number: 3,
    title: "Attend",
    description: "Meet with our team for your intake session and discuss your educational path"
  },
  {
    number: 4,
    title: "Begin",
    description: "Start your educational journey with the program that best fits your needs"
  }
];

export default function HowItWorksSection({
  title = "How It Works",
  steps = defaultSteps,
  className = ""
}: HowItWorksSectionProps) {
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
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} className={`mb-20 ${className}`}>
      <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">
        {title}
      </h3>
      <div className="relative">
        {/* Connecting line (hidden on mobile) */}
        <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary-300 via-primary-400 to-primary-300 transform translate-y-8"></div>
        
        <div className="grid md:grid-cols-4 gap-8 relative">
          {steps.map((step, index) => {
            const isAnimated = isVisible && index < (isVisible ? steps.length : 0);
            
            return (
              <div
                key={step.number}
                className={`text-center relative transform transition-all duration-700 ${
                  isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                {/* Step number circle */}
                <div className="relative mb-6 inline-block">
                  <div className="absolute inset-0 bg-primary-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-primary-600 to-primary-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto text-2xl font-bold shadow-xl transform hover:scale-110 transition-transform duration-300 group">
                    {step.number}
                    {/* Checkmark overlay on hover */}
                    <CheckCircle className="absolute inset-0 m-auto h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  
                  {/* Connection dot (hidden on mobile) */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-3 h-3 bg-primary-400 rounded-full border-2 border-white shadow-md"></div>
                  )}
                </div>

                {/* Step content */}
                <h4 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-700 transition-colors duration-300">
                  {step.title}
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

