'use client';

import { useState } from 'react';
import FAQItem from './FAQItem';

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title?: string;
  faqs?: FAQ[];
  className?: string;
}

const defaultFAQs: FAQ[] = [
  {
    question: "What is the age requirement for adult education services?",
    answer: "You must be at least 21 years old to register for our adult education services. This ensures we can provide appropriate educational programs tailored to adult learners."
  },
  {
    question: "How long does the intake appointment take?",
    answer: "The intake appointment typically takes 30 minutes. During this time, we'll discuss your educational goals, assess your current skills, and help you choose the right program for your needs."
  },
  {
    question: "What programs do you offer?",
    answer: "We offer Adult Basic Education (ABE), English as a Second Language (ESL), and Career and Technical Education (CTE) programs. Each program is designed to help you achieve your educational and career goals."
  },
  {
    question: "Is there a cost for the services?",
    answer: "Our adult education services are provided at no cost to eligible participants. We believe education should be accessible to everyone who wants to learn and grow."
  },
  {
    question: "What should I bring to my intake appointment?",
    answer: "Please bring a valid photo ID and any previous educational records if available. We'll also need your contact information and address details, which you can provide during registration."
  }
];

export default function FAQSection({
  title = "Frequently Asked Questions",
  faqs = defaultFAQs,
  className = ""
}: FAQSectionProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className={`mb-20 ${className}`}>
      <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">
        {title}
      </h3>
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

