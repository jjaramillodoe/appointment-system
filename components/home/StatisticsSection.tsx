'use client';

import { useEffect, useRef, useState } from 'react';

interface Statistic {
  value: string;
  label: string;
  suffix?: string;
  prefix?: string;
}

interface StatisticsSectionProps {
  statistics?: Statistic[];
  className?: string;
}

const defaultStatistics: Statistic[] = [
  { value: "500", suffix: "+", label: "Students Enrolled" },
  { value: "95", suffix: "%", label: "Success Rate" },
  { value: "3", label: "Programs Offered" },
  { value: "24/7", label: "Online Support" }
];

export default function StatisticsSection({
  statistics = defaultStatistics,
  className = ""
}: StatisticsSectionProps) {
  const [countedValues, setCountedValues] = useState<string[]>(statistics.map(() => '0'));
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

  useEffect(() => {
    if (!isVisible) return;

    const animations = statistics.map((stat, index) => {
      const numericValue = parseFloat(stat.value);
      if (isNaN(numericValue)) {
        setCountedValues(prev => {
          const newValues = [...prev];
          newValues[index] = stat.value;
          return newValues;
        });
        return;
      }

      const duration = 2000; // 2 seconds
      const steps = 60;
      const increment = numericValue / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
          current = numericValue;
          clearInterval(timer);
        }

        setCountedValues(prev => {
          const newValues = [...prev];
          newValues[index] = Math.floor(current).toString();
          return newValues;
        });
      }, duration / steps);
    });
  }, [isVisible, statistics]);

  return (
    <div 
      ref={sectionRef}
      className={`grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-20 ${className}`}
    >
      {statistics.map((stat, index) => {
        const displayValue = isNaN(parseFloat(stat.value))
          ? stat.value
          : `${stat.prefix || ''}${countedValues[index]}${stat.suffix || ''}`;

        return (
          <div
            key={index}
            className={`text-center p-6 rounded-xl bg-white/60 backdrop-blur-sm border border-primary-100 hover:border-primary-300 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-primary-500 to-yellow-600 mb-2">
              {displayValue}
            </div>
            <div className="text-gray-600 font-medium">{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
}

