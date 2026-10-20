'use client';

import { BookOpen, Users, Award } from 'lucide-react';
import ProgramCard from './ProgramCard';
import { useI18n } from '@/contexts/I18nContext';

interface Program {
  icon: typeof BookOpen;
  title: string;
  description: string;
  features: string[];
}

interface ProgramsSectionProps {
  title?: string;
  description?: string;
  programs?: Program[];
  className?: string;
}

const PROGRAM_ICONS = [BookOpen, Users, Award];

export default function ProgramsSection({
  title,
  description,
  programs,
  className = ""
}: ProgramsSectionProps) {
  const { t } = useI18n();
  const copy = t.home.programs;
  title ??= copy.title;
  description ??= copy.description;
  programs ??= copy.items.map((item, index) => ({ ...item, icon: PROGRAM_ICONS[index] }));
  return (
    <div className={`mb-20 ${className}`}>
      <div className="mb-12 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary-700">
          {copy.eyebrow}
        </p>
        <h2 className="mb-4 inline-block border-b-4 border-yellow-500 pb-2 text-3xl font-bold text-primary-900">
          {title}
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-primary-900/75">
          {description}
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {programs.map((program, index) => (
          <ProgramCard
            key={index}
            icon={program.icon}
            title={program.title}
            description={program.description}
            features={program.features}
          />
        ))}
      </div>
    </div>
  );
}

