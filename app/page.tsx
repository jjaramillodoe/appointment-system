'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  HeroSection,
  StatisticsSection,
  ProgramsSection,
  FeaturesSection,
  HowItWorksSection,
  TestimonialsSection,
  FAQSection,
  CTASection,
} from '@/components/home';

const bandClass = 'w-full py-12 sm:py-16';
const innerClass = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8';

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-d79-mesh">
      <div
        className="h-1.5 w-full bg-gradient-to-r from-primary-900 via-yellow-500 to-primary-900"
        aria-hidden
      />
      <Header />

      <main className="w-full">
        <HeroSection />

        <div className={`${bandClass} bg-white/75`}>
          <div className={innerClass}>
            <StatisticsSection className="!mb-0" />
          </div>
        </div>

        <div className={`${bandClass} bg-yellow-50/55`}>
          <div className={innerClass}>
            <ProgramsSection className="!mb-0" />
          </div>
        </div>

        <div className={`${bandClass} bg-slate-50/85`}>
          <div className={innerClass}>
            <FeaturesSection className="!mb-0" />
          </div>
        </div>

        <div className={`${bandClass} bg-primary-50/45`}>
          <div className={innerClass}>
            <HowItWorksSection className="!mb-0" />
          </div>
        </div>

        <div className={`${bandClass} bg-white/80`}>
          <div className={innerClass}>
            <TestimonialsSection className="!mb-0" />
          </div>
        </div>

        <div className={`${bandClass} bg-slate-100/75`}>
          <div className={innerClass}>
            <FAQSection className="!mb-0" />
          </div>
        </div>

        <div
          className={`${bandClass} bg-gradient-to-br from-primary-50/70 via-white to-yellow-50/55`}
        >
          <div className={innerClass}>
            <CTASection className="!mb-0" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
