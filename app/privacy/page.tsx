'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, FileText, Mail } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-yellow-50 to-primary-100 flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors duration-300 mb-6 group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 transform group-hover:-translate-x-1 transition-transform duration-300" />
              Back to Home
            </Link>
            <div className="flex items-center mb-4">
              <div className="relative mr-3">
                <div className="absolute inset-0 bg-primary-200 rounded-full blur-lg opacity-50"></div>
                <Shield className="relative h-10 w-10 text-primary-600 transform hover:scale-110 transition-transform duration-300" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary-700 via-primary-600 to-yellow-600 bg-clip-text text-transparent">
                Privacy Policy
              </h1>
            </div>
            <p className="text-gray-600 text-lg mb-4">
              Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
            </p>
            <p className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Content */}
          <div className="card space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="h-6 w-6 mr-2 text-primary-600" />
                1. Introduction
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The NYC Public Schools Adult Education District 79 ("we," "our," or "us") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
                Adult Education Intake System.
              </p>
              <p className="text-gray-700 leading-relaxed">
                By using our services, you consent to the collection and use of information in accordance with this policy. 
                If you do not agree with our policies and practices, please do not use our services.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Eye className="h-6 w-6 mr-2 text-primary-600" />
                2. Information We Collect
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.1 Personal Information</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                We collect personal information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
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

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.2 Automatically Collected Information</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                When you access our system, we automatically collect certain information, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Pages visited and time spent on pages</li>
                <li>Access dates and times</li>
              </ul>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Lock className="h-6 w-6 mr-2 text-primary-600" />
                3. How We Use Your Information
              </h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Service Providers:</strong> With trusted third-party service providers who assist us in operating our system, such as email delivery services and SMS providers</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
                <li><strong>Safety and Security:</strong> To protect the rights, property, or safety of NYC Public Schools, our users, or others</li>
                <li><strong>With Your Consent:</strong> In any other situation with your explicit consent</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We implement appropriate technical and organizational security measures to protect your personal information, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Secure password storage using industry-standard hashing algorithms</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication requirements</li>
                <li>Secure data centers and network infrastructure</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                However, no method of transmission over the Internet or electronic storage is 100% secure. 
                While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights and Choices</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Access:</strong> Request access to your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information, subject to legal and operational requirements</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications (you may still receive essential service-related communications)</li>
                <li><strong>Account Management:</strong> Update your account information through your dashboard</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise these rights, please contact us using the information provided in the Contact section below.
              </p>
            </section>

            {/* Cookies and Tracking */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We use cookies and similar tracking technologies to enhance your experience, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Session cookies to maintain your login state</li>
                <li>Preference cookies to remember your language and other settings</li>
                <li>Analytics cookies to understand how users interact with our system</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                You can control cookies through your browser settings. However, disabling cookies may limit certain functionalities of the system.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our services are designed for adult learners (ages 21 and older). We do not knowingly collect personal information 
                from individuals under 21 years of age. If we become aware that we have collected information from a person under 21, 
                we will take steps to delete that information promptly.
              </p>
            </section>

            {/* Policy Updates */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the 
                new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy 
                periodically for any changes.
              </p>
            </section>

            {/* Contact */}
            <section className="bg-gradient-to-r from-primary-50 via-yellow-50 to-primary-50 border-2 border-primary-200 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Mail className="h-6 w-6 mr-2 text-primary-600" />
                10. Contact Us
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="space-y-2 text-gray-700">
                <p><strong>NYC Public Schools - Adult Education District 79</strong></p>
                <p>Email: <a href="mailto:privacy@adulteducation.org" className="text-primary-600 hover:text-primary-700 underline">privacy@adulteducation.org</a></p>
                <p>Phone: <a href="tel:5551234567" className="text-primary-600 hover:text-primary-700 underline">(555) 123-4567</a></p>
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

