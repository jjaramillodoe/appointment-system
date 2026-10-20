'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ArrowLeft, FileText, Scale, AlertCircle, CheckCircle, Mail } from 'lucide-react';

export default function TermsPage() {
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
                  <Scale className="relative h-12 w-12 text-primary-700" />
                </div>
                <h1 className="text-3xl font-bold sm:text-4xl">
                  <span className="bg-gradient-to-r from-primary-800 via-primary-600 to-yellow-600 bg-clip-text text-transparent">
                    Terms of Use
                  </span>
                </h1>
              </div>
              <p className="text-lg text-primary-900/80">
                Please read these terms carefully before using our Adult Education Intake System.
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
                1. Agreement to Terms
              </h2>
              <p className="mb-4 leading-relaxed text-primary-900/85">
                By accessing or using the NYC Public Schools Adult Education District 79 Intake System ("the System"), 
                you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree 
                with any of these terms, you are prohibited from using or accessing the System.
              </p>
              <p className="leading-relaxed text-primary-900/85">
                These terms apply to all visitors, users, and others who access or use the System.
              </p>
            </section>

            {/* Eligibility */}
            <section>
              <h2 className="mb-4 flex items-center text-2xl font-bold text-primary-900">
                <CheckCircle className="mr-2 h-6 w-6 shrink-0 text-primary-600" />
                2. Eligibility and Age Requirement
              </h2>
              <div className="mb-4 rounded-xl border border-primary-200/70 bg-gradient-to-br from-primary-50/95 via-white to-yellow-50/75 p-4 shadow-d79-card border-l-4 border-l-yellow-500">
                <div className="flex items-start">
                  <AlertCircle className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
                  <div>
                    <p className="mb-2 font-semibold text-primary-900">Age requirement</p>
                    <p className="leading-relaxed text-primary-900/85">
                      You must be at least <strong>21 years old</strong> to register for adult education services through this System. 
                      By using the System, you represent and warrant that you meet this age requirement.
                    </p>
                  </div>
                </div>
              </div>
              <p className="leading-relaxed text-primary-900/85">
                You must also provide accurate, current, and complete information during the registration process. 
                Failure to do so may result in the termination of your account.
              </p>
            </section>

            {/* Use License */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-primary-900">3. Use License</h2>
              <p className="mb-3 leading-relaxed text-primary-900/85">
                Permission is granted to use the System for personal, non-commercial purposes to:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2 text-primary-900/85 mb-4">
                <li>Register for adult education services</li>
                <li>Schedule intake appointments</li>
                <li>Access your account and appointment information</li>
                <li>Update your personal information</li>
              </ul>
              <p className="mb-3 leading-relaxed text-primary-900/85">
                This license does not include the right to:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2 text-primary-900/85">
                <li>Modify or copy the System's materials</li>
                <li>Use the System for any commercial purpose or for any public display</li>
                <li>Attempt to decompile or reverse engineer any software contained in the System</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or mirror the materials on any other server</li>
              </ul>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-primary-900">4. User Accounts and Security</h2>
              <h3 className="mt-6 text-xl font-semibold text-primary-900 mb-3">4.1 Account Creation</h3>
              <p className="mb-3 leading-relaxed text-primary-900/85">
                To access certain features of the System, you must register and create an account. You agree to:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2 text-primary-900/85 mb-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>

              <h3 className="mt-6 text-xl font-semibold text-primary-900 mb-3">4.2 Account Termination</h3>
              <p className="leading-relaxed text-primary-900/85">
                We reserve the right to suspend or terminate your account at any time, with or without notice, 
                for conduct that we believe violates these Terms of Use or is harmful to other users, us, or third parties, 
                or for any other reason.
              </p>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-primary-900">5. Acceptable Use Policy</h2>
              <p className="mb-3 leading-relaxed text-primary-900/85">
                You agree not to use the System to:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2 text-primary-900/85">
                <li>Violate any applicable federal, state, local, or international law or regulation</li>
                <li>Transmit any material that is abusive, harassing, defamatory, obscene, or otherwise objectionable</li>
                <li>Impersonate or attempt to impersonate NYC Public Schools, an employee, another user, or any other person or entity</li>
                <li>Engage in any conduct that restricts or inhibits anyone's use or enjoyment of the System</li>
                <li>Introduce any viruses, trojan horses, worms, or other malicious or harmful code</li>
                <li>Attempt to gain unauthorized access to any portion of the System or any other systems or networks</li>
                <li>Collect or store personal data about other users without their express permission</li>
                <li>Use any robot, spider, or other automatic device to access the System for any purpose without our express written permission</li>
              </ul>
            </section>

            {/* Appointments */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-primary-900">6. Appointments and Cancellations</h2>
              <h3 className="mt-6 text-xl font-semibold text-primary-900 mb-3">6.1 Scheduling</h3>
              <p className="mb-4 leading-relaxed text-primary-900/85">
                The System allows you to schedule intake appointments for adult education services. Appointment availability 
                is subject to capacity and scheduling constraints. We do not guarantee that your preferred time slot will be available.
              </p>

              <h3 className="mt-6 text-xl font-semibold text-primary-900 mb-3">6.2 Cancellations and Changes</h3>
              <p className="mb-3 leading-relaxed text-primary-900/85">
                You may cancel or reschedule appointments through your account dashboard, subject to the following:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2 text-primary-900/85">
                <li>Cancellations must be made at least 24 hours in advance</li>
                <li>Repeated no-shows or late cancellations may result in restricted scheduling privileges</li>
                <li>We reserve the right to cancel or reschedule appointments due to operational needs or emergencies</li>
              </ul>

              <h3 className="mt-6 text-xl font-semibold text-primary-900 mb-3">6.3 Attendance</h3>
              <p className="leading-relaxed text-primary-900/85">
                You are responsible for attending scheduled appointments on time. Late arrivals may result in rescheduling. 
                Please bring required documentation as specified during registration.
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-primary-900">7. Intellectual Property Rights</h2>
              <p className="leading-relaxed text-primary-900/85">
                The System and its original content, features, and functionality are owned by NYC Public Schools and are 
                protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. 
                You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, 
                republish, download, store, or transmit any of the material on the System without our prior written consent.
              </p>
            </section>

            {/* Disclaimer */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-primary-900">8. Disclaimer</h2>
              <p className="mb-4 leading-relaxed text-primary-900/85">
                The materials on the System are provided on an "as is" basis. NYC Public Schools makes no warranties, 
                expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, 
                implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement 
                of intellectual property or other violation of rights.
              </p>
              <p className="leading-relaxed text-primary-900/85">
                Further, NYC Public Schools does not warrant or make any representations concerning the accuracy, likely results, 
                or reliability of the use of the materials on the System or otherwise relating to such materials or on any sites 
                linked to the System.
              </p>
            </section>

            {/* Limitations */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-primary-900">9. Limitations</h2>
              <p className="leading-relaxed text-primary-900/85">
                In no event shall NYC Public Schools or its suppliers be liable for any damages (including, without limitation, 
                damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use 
                the materials on the System, even if NYC Public Schools or an authorized representative has been notified orally 
                or in writing of the possibility of such damage.
              </p>
            </section>

            {/* Revisions */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-primary-900">10. Revisions and Errata</h2>
              <p className="leading-relaxed text-primary-900/85">
                The materials appearing on the System could include technical, typographical, or photographic errors. 
                NYC Public Schools does not warrant that any of the materials on the System are accurate, complete, or current. 
                We may make changes to the materials contained on the System at any time without notice.
              </p>
            </section>

            {/* Links */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-primary-900">11. Links</h2>
              <p className="leading-relaxed text-primary-900/85">
                NYC Public Schools has not reviewed all of the sites linked to the System and is not responsible for the contents 
                of any such linked site. The inclusion of any link does not imply endorsement by NYC Public Schools. 
                Use of any such linked website is at the user's own risk.
              </p>
            </section>

            {/* Modifications */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-primary-900">12. Terms of Use Modifications</h2>
              <p className="leading-relaxed text-primary-900/85">
                NYC Public Schools may revise these Terms of Use at any time without notice. By using the System, 
                you are agreeing to be bound by the then current version of these Terms of Use. We recommend reviewing 
                these terms periodically.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-primary-900">13. Governing Law</h2>
              <p className="leading-relaxed text-primary-900/85">
                These Terms of Use shall be governed by and construed in accordance with the laws of the State of New York, 
                without regard to its conflict of law provisions. Any disputes arising under or in connection with these terms 
                shall be subject to the exclusive jurisdiction of the courts of New York State.
              </p>
            </section>

            {/* Contact */}
            <section className="rounded-xl border border-primary-200/70 bg-gradient-to-br from-primary-50/95 via-white to-yellow-50/75 p-6 shadow-d79-card border-l-4 border-l-yellow-500">
              <h2 className="mb-4 flex items-center text-2xl font-bold text-primary-900">
                <Mail className="mr-2 h-6 w-6 shrink-0 text-primary-600" />
                14. Contact Information
              </h2>
              <p className="mb-4 leading-relaxed text-primary-900/85">
                If you have any questions about these Terms of Use, please contact us:
              </p>
              <div className="space-y-2 text-primary-900/85">
                <p>
                  <strong className="text-primary-900">NYC Public Schools - Adult Education District 79</strong>
                </p>
                <p>
                  Email:{' '}
                  <a
                    href="mailto:legal@adulteducation.org"
                    className="font-medium text-primary-700 underline decoration-yellow-500/70 underline-offset-2 transition hover:text-primary-600"
                  >
                    legal@adulteducation.org
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

