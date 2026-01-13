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
    <div className={`grid md:grid-cols-3 gap-8 mb-20 ${className}`}>
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
        />
      ))}
    </div>
  );
}

