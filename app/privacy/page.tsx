'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, FileText, Mail } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-d79-mesh">
      <div
        className="h-1.5 w-full bg-gradient-to-r from-primary-900 via-yellow-500 to-primary-900"
        aria-hidden
      />
      <Header />
      <main className="flex-1 py-10 sm:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center sm:text-left">
            <Link
              href="/"
              className="group mb-6 inline-flex items-center text-sm font-semibold text-primary-800 transition-colors hover:text-primary-600"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Home
            </Link>

            <div className="rounded-3xl border border-primary-200/70 bg-white/80 px-6 py-8 shadow-d79-hero backdrop-blur-md sm:px-10">
              <p className="mb-4 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-primary-200/80 bg-primary-50/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-800">
                <span className="text-yellow-700">District 79</span>
                <span className="text-primary-400" aria-hidden>
                  ·
                </span>
                <span>Adult Education</span>
              </p>
              <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row sm:items-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-400/25 to-yellow-400/30 blur-xl" />
                  <Shield className="relative h-12 w-12 text-primary-700" />
                </div>
                <h1 className="text-3xl font-bold sm:text-4xl">
                  <span className="bg-gradient-to-r from-primary-800 via-primary-600 to-yellow-600 bg-clip-text text-transparent">
                    Privacy Policy
                  </span>
                </h1>
              </div>
              <p className="text-lg text-primary-900/80">
                Your privacy is important to us. This policy explains how we collect, use, and protect your personal
                information.
              </p>
              <p className="mt-4 text-sm font-medium text-primary-800/70">
                Last updated:{' '}
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8 rounded-2xl border border-primary-200/70 bg-white/90 p-6 shadow-d79-card backdrop-blur-sm sm:p-8">
            {/* Introduction */}
            <section>
              <h2 className="mb-4 flex items-center text-2xl font-bold text-primary-900">
                <FileText className="mr-2 h-6 w-6 shrink-0 text-primary-600" />
                1. Introduction
              </h2>
              <p className="mb-4 leading-relaxed text-primary-900/85">
                The NYC Public Schools Adult Education District 79 ("we," "our," or "us") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
                Adult Education Intake System.
              </p>
              <p className="leading-relaxed text-primary-900/85">
                By using our services, you consent to the collection and use of information in accordance with this policy. 
                If you do not agree with our policies and practices, please do not use our services.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="mb-4 flex items-center text-2xl font-bold text-primary-900">
                <Eye className="mr-2 h-6 w-6 shrink-0 text-primary-600" />
                2. Information We Collect
              </h2>
              
              <h3 className="mt-6 text-xl font-semibold text-primary-900 mb-3">2.1 Personal Information</h3>
              <p className="mb-3 leading-relaxed text-primary-900/85">
                We collect personal information that you provide directly to us, including:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2 text-primary-900/85 mb-4">
                <li>Name (first, middle, last)</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Date of birth</li>
                <li>Home address and closest address to your preferred learning center</li>
                <li>Educational background and employment status</li>
                <li>Program interests and school preferences</li>
                <li>Emergency contact information</li>
                <li>Language preferences and barriers to learning</li>
              </ul>

              <h3 className="mt-6 text-xl font-semibold text-primary-900 mb-3">2.2 Automatically Collected Information</h3>
              <p className="mb-3 leading-relaxed text-primary-900/85">
                When you access our system, we automatically collect certain information, including:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2 text-primary-900/85">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Pages visited and time spent on pages</li>
                <li>Access dates and times</li>
              </ul>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="mb-4 flex items-center text-2xl font-bold text-primary-900">
                <Lock className="mr-2 h-6 w-6 shrink-0 text-primary-600" />
                3. How We Use Your Information
              </h2>
              <p className="mb-3 leading-relaxed text-primary-900/85">
                We use the information we collect to:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2 text-primary-900/85">
                <li>Process your registration and create your account</li>
                <li>Schedule and manage your intake appointments</li>
                <li>Match you with the closest and most appropriate learning center</li>
                <li>Send appointment confirmations and reminders via email and SMS</li>
                <li>Provide customer support and respond to your inquiries</li>
                <li>Improve our services and user experience</li>
                <li>Comply with legal obligations and protect our rights</li>
                <li>Send important updates about our programs and services (with your consent)</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-primary-900">4. Information Sharing and Disclosure</h2>
              <p className="mb-3 leading-relaxed text-primary-900/85">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2 text-primary-900/85">
                <li><strong>Service Providers:</strong> With trusted third-party service providers who assist us in operating our system, such as email delivery services and SMS providers</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
                <li><strong>Safety and Security:</strong> To protect the rights, property, or safety of NYC Public Schools, our users, or others</li>
                <li><strong>With Your Consent:</strong> In any other situation with your explicit consent</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-primary-900">5. Data Security</h2>
              <p className="mb-3 leading-relaxed text-primary-900/85">
                We implement appropriate technical and organizational security measures to protect your personal information, including:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2 text-primary-900/85">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Secure password storage using industry-standard hashing algorithms</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication requirements</li>
                <li>Secure data centers and network infrastructure</li>
              </ul>
              <p className="mt-4 leading-relaxed text-primary-900/85">
                However, no method of transmission over the Internet or electronic storage is 100% secure. 
                While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-primary-900">6. Your Rights and Choices</h2>
              <p className="mb-3 leading-relaxed text-primary-900/85">
                You have the right to:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2 text-primary-900/85">
                <li><strong>Access:</strong> Request access to your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information, subject to legal and operational requirements</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications (you may still receive essential service-related communications)</li>
                <li><strong>Account Management:</strong> Update your account information through your dashboard</li>
              </ul>
              <p className="mt-4 leading-relaxed text-primary-900/85">
                To exercise these rights, please contact us using the information provided in the Contact section below.
              </p>
            </section>

            {/* Cookies and Tracking */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-primary-900">7. Cookies and Tracking Technologies</h2>
              <p className="mb-3 leading-relaxed text-primary-900/85">
                We use cookies and similar tracking technologies to enhance your experience, including:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2 text-primary-900/85">
                <li>Session cookies to maintain your login state</li>
                <li>Preference cookies to remember your language and other settings</li>
                <li>Analytics cookies to understand how users interact with our system</li>
              </ul>
              <p className="mt-4 leading-relaxed text-primary-900/85">
                You can control cookies through your browser settings. However, disabling cookies may limit certain functionalities of the system.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-primary-900">8. Children's Privacy</h2>
              <p className="leading-relaxed text-primary-900/85">
                Our services are designed for adult learners (ages 21 and older). We do not knowingly collect personal information 
                from individuals under 21 years of age. If we become aware that we have collected information from a person under 21, 
                we will take steps to delete that information promptly.
              </p>
            </section>

            {/* Policy Updates */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-primary-900">9. Changes to This Privacy Policy</h2>
              <p className="leading-relaxed text-primary-900/85">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the 
                new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy 
                periodically for any changes.
              </p>
            </section>

            {/* Contact */}
            <section className="rounded-xl border border-primary-200/70 bg-gradient-to-br from-primary-50/95 via-white to-yellow-50/75 p-6 shadow-d79-card border-l-4 border-l-yellow-500">
              <h2 className="mb-4 flex items-center text-2xl font-bold text-primary-900">
                <Mail className="mr-2 h-6 w-6 shrink-0 text-primary-600" />
                10. Contact Us
              </h2>
              <p className="mb-4 leading-relaxed text-primary-900/85">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="space-y-2 text-primary-900/85">
                <p>
                  <strong className="text-primary-900">NYC Public Schools - Adult Education District 79</strong>
                </p>
                <p>
                  Email:{' '}
                  <a
                    href="mailto:privacy@adulteducation.org"
                    className="font-medium text-primary-700 underline decoration-yellow-500/70 underline-offset-2 transition hover:text-primary-600"
                  >
                    privacy@adulteducation.org
                  </a>
                </p>
                <p>
                  Phone:{' '}
                  <a
                    href="tel:5551234567"
                    className="font-medium text-primary-700 underline decoration-yellow-500/70 underline-offset-2 transition hover:text-primary-600"
                  >
                    (555) 123-4567
                  </a>
                </p>
                <p>Address: 52 Chambers Street, New York, NY 10007</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

