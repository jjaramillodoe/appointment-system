'use client';

import { BookOpen, Users, Award } from 'lucide-react';
import ProgramCard from './ProgramCard';

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

const defaultPrograms: Program[] = [
  {
    icon: BookOpen,
    title: "Adult Basic Education (ABE)",
    description: "Build essential reading, writing, and math skills. Perfect for adults looking to improve their basic literacy and numeracy skills.",
    features: [
      "Reading and writing improvement",
      "Math skills development",
      "GED preparation"
    ]
  },
  {
    icon: Users,
    title: "English as a Second Language (ESL)",
    description: "Learn English in a supportive environment. Develop speaking, listening, reading, and writing skills for everyday life and work.",
    features: [
      "Conversational English",
      "Business English",
      "Cultural integration"
    ]
  },
  {
    icon: Award,
    title: "Career & Technical Education (CTE)",
    description: "Gain practical skills for today's job market. Learn industry-specific skills and prepare for certification programs.",
    features: [
      "Industry certifications",
      "Job readiness skills",
      "Career counseling"
    ]
  }
];

export default function ProgramsSection({
  title = "Our Programs",
  description = "Choose from our comprehensive range of adult education programs designed to meet your specific needs and goals.",
  programs = defaultPrograms,
  className = ""
}: ProgramsSectionProps) {
  return (
    <div className={`mb-20 ${className}`}>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
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

