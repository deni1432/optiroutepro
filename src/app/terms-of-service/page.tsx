'use client';

import SharedNavbar from '@/components/shared-navbar';
import SharedFooter from '@/components/shared-footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SharedNavbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-muted-foreground mb-4">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Welcome to OptiRoutePro. These Terms of Service ("Terms") govern your use of our website and services.
              By accessing or using OptiRoutePro, you agree to be bound by these Terms. If you disagree with any part of the terms,
              you may not access the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Definitions</h2>
            <ul className="list-disc pl-6 mt-2 mb-4">
              <li><strong>"Service"</strong> refers to the OptiRoutePro website and route optimization services.</li>
              <li><strong>"User"</strong> refers to the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service.</li>
              <li><strong>"Subscription"</strong> refers to the paid access to premium features of the Service.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
            <p>
              To use certain features of the Service, you must register for an account. You must provide accurate, current, and complete information during the registration process and keep your account information up-to-date.
            </p>
            <p className="mt-2">
              You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Subscriptions</h2>
            <p>
              Some parts of the Service are billed on a subscription basis ("Subscription"). You will be billed in advance on a recurring and periodic basis ("Billing Cycle"). Billing cycles are set on a monthly basis.
            </p>
            <p className="mt-2">
              At the end of each Billing Cycle, your Subscription will automatically renew under the exact same conditions unless you cancel it or we cancel it.
            </p>
            <p className="mt-2">
              You may cancel your Subscription renewal either through your online account management page or by contacting our customer support team.
            </p>
            <p className="mt-2">
              A valid payment method, including credit card, is required to process the payment for your Subscription. You shall provide accurate and complete billing information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Free Trial</h2>
            <p>
              We may, at our sole discretion, offer a Subscription with a free trial for a limited period of time ("Free Trial").
            </p>
            <p className="mt-2">
              You may be required to enter your billing information in order to sign up for the Free Trial. If you do enter your billing information when signing up for the Free Trial, you will not be charged by us until the Free Trial has expired.
            </p>
            <p className="mt-2">
              At any time and without notice, we reserve the right to (i) modify the terms and conditions of the Free Trial offer, or (ii) cancel such Free Trial offer.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Fee Changes</h2>
            <p>
              OptiRoutePro, in its sole discretion and at any time, may modify the Subscription fees. Any Subscription fee change will become effective at the end of the then-current Billing Cycle.
            </p>
            <p className="mt-2">
              We will provide you with reasonable prior notice of any change in Subscription fees to give you an opportunity to terminate your Subscription before such change becomes effective.
            </p>
            <p className="mt-2">
              Your continued use of the Service after the Subscription fee change comes into effect constitutes your agreement to pay the modified Subscription fee amount.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Refunds</h2>
            <p>
              Except when required by law, paid Subscription fees are non-refundable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Content</h2>
            <p>
              Our Service allows you to input, upload, and store content, including addresses, routes, and other information ("Content"). You are responsible for the Content that you input or upload through the Service.
            </p>
            <p className="mt-2">
              You retain any and all of your rights to any Content you submit, upload, or display on or through the Service and you are responsible for protecting those rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Third-Party Services</h2>
            <p>
              Our Service may contain links to third-party websites or services that are not owned or controlled by OptiRoutePro.
            </p>
            <p className="mt-2">
              OptiRoutePro has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third-party websites or services. You further acknowledge and agree that OptiRoutePro shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such content, goods, or services available on or through any such websites or services.
            </p>
            <p className="mt-2">
              We strongly advise you to read the terms and conditions and privacy policies of any third-party websites or services that you visit.
            </p>
            <p className="mt-2">
              We use the following third-party services:
            </p>
            <ul className="list-disc pl-6 mt-2 mb-4">
              <li><strong>HERE Maps API</strong>: For geocoding and route optimization.</li>
              <li><strong>Clerk</strong>: For authentication services.</li>
              <li><strong>Stripe</strong>: For payment processing.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
            <p>
              In no event shall OptiRoutePro, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Disclaimer</h2>
            <p>
              Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
            </p>
            <p className="mt-2">
              Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
            <p className="mt-2">
              By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="mt-2">
              Email: help@optiroutepro.com
            </p>
          </section>
        </div>

        <div className="mt-8 mb-16">
          <Button asChild variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </main>

      <SharedFooter />
    </div>
  );
}
