'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ArrowLeft, FileText, Scale, AlertCircle, CheckCircle, Mail } from 'lucide-react';

export default function TermsPage() {
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
                <Scale className="relative h-10 w-10 text-primary-600 transform hover:scale-110 transition-transform duration-300" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary-700 via-primary-600 to-yellow-600 bg-clip-text text-transparent">
                Terms of Use
              </h1>
            </div>
            <p className="text-gray-600 text-lg mb-4">
              Please read these terms carefully before using our Adult Education Intake System.
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
                1. Agreement to Terms
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By accessing or using the NYC Public Schools Adult Education District 79 Intake System ("the System"), 
                you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree 
                with any of these terms, you are prohibited from using or accessing the System.
              </p>
              <p className="text-gray-700 leading-relaxed">
                These terms apply to all visitors, users, and others who access or use the System.
              </p>
            </section>

            {/* Eligibility */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="h-6 w-6 mr-2 text-primary-600" />
                2. Eligibility and Age Requirement
              </h2>
              <div className="bg-gradient-to-r from-primary-50 via-yellow-50 to-primary-50 border-2 border-primary-200 rounded-xl p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-800 font-semibold mb-2">Age Requirement</p>
                    <p className="text-gray-700 leading-relaxed">
                      You must be at least <strong>21 years old</strong> to register for adult education services through this System. 
                      By using the System, you represent and warrant that you meet this age requirement.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                You must also provide accurate, current, and complete information during the registration process. 
                Failure to do so may result in the termination of your account.
              </p>
            </section>

            {/* Use License */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Use License</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Permission is granted to use the System for personal, non-commercial purposes to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                <li>Register for adult education services</li>
                <li>Schedule intake appointments</li>
                <li>Access your account and appointment information</li>
                <li>Update your personal information</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-3">
                This license does not include the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Modify or copy the System's materials</li>
                <li>Use the System for any commercial purpose or for any public display</li>
                <li>Attempt to decompile or reverse engineer any software contained in the System</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or mirror the materials on any other server</li>
              </ul>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Accounts and Security</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.1 Account Creation</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                To access certain features of the System, you must register and create an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.2 Account Termination</h3>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to suspend or terminate your account at any time, with or without notice, 
                for conduct that we believe violates these Terms of Use or is harmful to other users, us, or third parties, 
                or for any other reason.
              </p>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Acceptable Use Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                You agree not to use the System to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Appointments and Cancellations</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.1 Scheduling</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The System allows you to schedule intake appointments for adult education services. Appointment availability 
                is subject to capacity and scheduling constraints. We do not guarantee that your preferred time slot will be available.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.2 Cancellations and Changes</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                You may cancel or reschedule appointments through your account dashboard, subject to the following:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Cancellations must be made at least 24 hours in advance</li>
                <li>Repeated no-shows or late cancellations may result in restricted scheduling privileges</li>
                <li>We reserve the right to cancel or reschedule appointments due to operational needs or emergencies</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.3 Attendance</h3>
              <p className="text-gray-700 leading-relaxed">
                You are responsible for attending scheduled appointments on time. Late arrivals may result in rescheduling. 
                Please bring required documentation as specified during registration.
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property Rights</h2>
              <p className="text-gray-700 leading-relaxed">
                The System and its original content, features, and functionality are owned by NYC Public Schools and are 
                protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. 
                You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, 
                republish, download, store, or transmit any of the material on the System without our prior written consent.
              </p>
            </section>

            {/* Disclaimer */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Disclaimer</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The materials on the System are provided on an "as is" basis. NYC Public Schools makes no warranties, 
                expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, 
                implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement 
                of intellectual property or other violation of rights.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Further, NYC Public Schools does not warrant or make any representations concerning the accuracy, likely results, 
                or reliability of the use of the materials on the System or otherwise relating to such materials or on any sites 
                linked to the System.
              </p>
            </section>

            {/* Limitations */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitations</h2>
              <p className="text-gray-700 leading-relaxed">
                In no event shall NYC Public Schools or its suppliers be liable for any damages (including, without limitation, 
                damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use 
                the materials on the System, even if NYC Public Schools or an authorized representative has been notified orally 
                or in writing of the possibility of such damage.
              </p>
            </section>

            {/* Revisions */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Revisions and Errata</h2>
              <p className="text-gray-700 leading-relaxed">
                The materials appearing on the System could include technical, typographical, or photographic errors. 
                NYC Public Schools does not warrant that any of the materials on the System are accurate, complete, or current. 
                We may make changes to the materials contained on the System at any time without notice.
              </p>
            </section>

            {/* Links */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Links</h2>
              <p className="text-gray-700 leading-relaxed">
                NYC Public Schools has not reviewed all of the sites linked to the System and is not responsible for the contents 
                of any such linked site. The inclusion of any link does not imply endorsement by NYC Public Schools. 
                Use of any such linked website is at the user's own risk.
              </p>
            </section>

            {/* Modifications */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Terms of Use Modifications</h2>
              <p className="text-gray-700 leading-relaxed">
                NYC Public Schools may revise these Terms of Use at any time without notice. By using the System, 
                you are agreeing to be bound by the then current version of these Terms of Use. We recommend reviewing 
                these terms periodically.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms of Use shall be governed by and construed in accordance with the laws of the State of New York, 
                without regard to its conflict of law provisions. Any disputes arising under or in connection with these terms 
                shall be subject to the exclusive jurisdiction of the courts of New York State.
              </p>
            </section>

            {/* Contact */}
            <section className="bg-gradient-to-r from-primary-50 via-yellow-50 to-primary-50 border-2 border-primary-200 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Mail className="h-6 w-6 mr-2 text-primary-600" />
                14. Contact Information
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about these Terms of Use, please contact us:
              </p>
              <div className="space-y-2 text-gray-700">
                <p><strong>NYC Public Schools - Adult Education District 79</strong></p>
                <p>Email: <a href="mailto:legal@adulteducation.org" className="text-primary-600 hover:text-primary-700 underline">legal@adulteducation.org</a></p>
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

