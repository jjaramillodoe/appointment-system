'use client';

import TestimonialCard from './TestimonialCard';
import { useI18n } from '@/contexts/I18nContext';

interface Testimonial {
  rating?: number;
  text: string;
  author: string;
  role: string;
}

interface TestimonialsSectionProps {
  title?: string;
  testimonials?: Testimonial[];
  className?: string;
}

const TESTIMONIAL_AUTHORS = ["Maria Rodriguez", "James Wilson", "Sarah Johnson"];

export default function TestimonialsSection({
  title,
  testimonials,
  className = ""
}: TestimonialsSectionProps) {
  const { t } = useI18n();
  const copy = t.home.testimonials;
  title ??= copy.title;
  testimonials ??= copy.items.map((item, index) => ({ ...item, rating: 5, author: TESTIMONIAL_AUTHORS[index] }));
  return (
    <div className={`mb-20 ${className}`}>
      <div className="mb-12 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary-700">
          {copy.eyebrow}
        </p>
        <h3 className="inline-block border-b-4 border-yellow-500 pb-2 text-3xl font-bold text-primary-900">
          {title}
        </h3>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <TestimonialCard
            key={index}
            rating={testimonial.rating}
            text={testimonial.text}
            author={testimonial.author}
            role={testimonial.role}
          />
        ))}
      </div>
    </div>
  );
}

