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
  CTASection
} from '@/components/home';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-yellow-50 to-primary-100">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <HeroSection />
        
        <StatisticsSection />
        
        <ProgramsSection />
        
        <FeaturesSection />
        
        <HowItWorksSection />
        
        <TestimonialsSection />
        
        <FAQSection />
        
        <CTASection />
      </main>
      
      <Footer />
    </div>
  );
} 