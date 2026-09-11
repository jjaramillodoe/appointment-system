'use client';

import { UserPlus, Calendar, GraduationCap } from 'lucide-react';
import FeatureCard from './FeatureCard';

interface Feature {
  icon: typeof UserPlus;
  title: string;
  description: string;
}

interface FeaturesSectionProps {
  features?: Feature[];
  className?: string;
}

const defaultFeatures: Feature[] = [
  {
    icon: UserPlus,
    title: "Easy Registration",
    description: "Complete your registration in just a few simple steps. Our streamlined process makes getting started quick and hassle-free."
  },
  {
    icon: Calendar,
    title: "Flexible Scheduling",
    description: "Choose from available time slots that work with your schedule. We offer appointments throughout the week to accommodate your needs."
  },
  {
    icon: GraduationCap,
    title: "Expert Support",
    description: "Get personalized guidance from experienced educators who are committed to helping you achieve your educational and career goals."
  }
];

export default function FeaturesSection({
  features = defaultFeatures,
  className = ""
}: FeaturesSectionProps) {
  return (
    <div className={`mb-20 ${className}`}>
      <div className="mb-10 text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-700">
          Why register with us
        </p>
        <h2 className="inline-block border-b-4 border-yellow-500 pb-2 text-3xl font-bold text-primary-900">
          Built for New Yorkers
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

