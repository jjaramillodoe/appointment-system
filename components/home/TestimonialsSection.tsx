'use client';

import TestimonialCard from './TestimonialCard';

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

const defaultTestimonials: Testimonial[] = [
  {
    rating: 5,
    text: "The ESL program helped me improve my English so much. Now I can communicate better at work and feel more confident in my daily life.",
    author: "Maria Rodriguez",
    role: "ESL Student"
  },
  {
    rating: 5,
    text: "The ABE program gave me the skills I needed to get my GED. The instructors were patient and supportive throughout my journey.",
    author: "James Wilson",
    role: "ABE Graduate"
  },
  {
    rating: 5,
    text: "The CTE program helped me get certified and find a better job. The career counseling was invaluable in helping me plan my future.",
    author: "Sarah Johnson",
    role: "CTE Graduate"
  }
];

export default function TestimonialsSection({
  title = "What Our Students Say",
  testimonials = defaultTestimonials,
  className = ""
}: TestimonialsSectionProps) {
  return (
    <div className={`mb-20 ${className}`}>
      <div className="mb-12 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary-700">
          Voices from our community
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

