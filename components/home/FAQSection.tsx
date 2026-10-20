'use client';

import { useState } from 'react';
import FAQItem from './FAQItem';
import { useI18n } from '@/contexts/I18nContext';

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title?: string;
  faqs?: FAQ[];
  className?: string;
}

export default function FAQSection({
  title,
  faqs,
  className = ""
}: FAQSectionProps) {
  const { t } = useI18n();
  const copy = t.home.faq;
  title ??= copy.title;
  faqs ??= copy.items;
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

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
      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            isOpen={openFaq === index}
            onToggle={() => toggleFaq(index)}
          />
        ))}
      </div>
    </div>
  );
}

