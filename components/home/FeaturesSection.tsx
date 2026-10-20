'use client';

import { UserPlus, Calendar, GraduationCap } from 'lucide-react';
import FeatureCard from './FeatureCard';
import { useI18n } from '@/contexts/I18nContext';

interface Feature {
  icon: typeof UserPlus;
  title: string;
  description: string;
}

interface FeaturesSectionProps {
  features?: Feature[];
  className?: string;
}

const FEATURE_ICONS = [UserPlus, Calendar, GraduationCap];

export default function FeaturesSection({
  features,
  className = ""
}: FeaturesSectionProps) {
  const { t } = useI18n();
  const copy = t.home.features;
  features ??= copy.items.map((item, index) => ({ ...item, icon: FEATURE_ICONS[index] }));
  return (
    <div className={`mb-20 ${className}`}>
      <div className="mb-10 text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-700">
          {copy.eyebrow}
        </p>
        <h2 className="inline-block border-b-4 border-yellow-500 pb-2 text-3xl font-bold text-primary-900">
          {copy.title}
        </h2>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>
    </div>
  );
}

