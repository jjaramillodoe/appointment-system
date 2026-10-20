'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';

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

export default function StatisticsSection({
  statistics: statisticsProp,
  className = ""
}: StatisticsSectionProps) {
  const { t } = useI18n();
  const labels = t.home.stats;
  const statistics = useMemo<Statistic[]>(() => statisticsProp ?? [
    { value: "500", suffix: "+", label: labels.studentsEnrolled },
    { value: "95", suffix: "%", label: labels.successRate },
    { value: "3", label: labels.programsOffered },
    { value: "24/7", label: labels.onlineSupport }
  ], [statisticsProp, labels]);
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
            className={`text-center rounded-xl border border-primary-100/90 bg-white/85 p-6 shadow-d79-card backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg border-l-4 border-l-yellow-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-800 via-primary-600 to-yellow-600 mb-2">
              {displayValue}
            </div>
            <div className="text-gray-600 font-medium">{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
}

