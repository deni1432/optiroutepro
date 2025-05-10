'use client';

import SharedNavbar from '@/components/shared-navbar';
import SharedFooter from '@/components/shared-footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SharedNavbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-muted-foreground mb-4">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p>
              Welcome to OptiRoutePro. We respect your privacy and are committed to protecting your personal data.
              This privacy policy will inform you about how we look after your personal data when you visit our website
              and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">The Data We Collect</h2>
            <p>
              We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
            </p>
            <ul className="list-disc pl-6 mt-2 mb-4">
              <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data</strong> includes email address.</li>
              <li><strong>Technical Data</strong> includes internet protocol (IP) address, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
              <li><strong>Usage Data</strong> includes information about how you use our website and services.</li>
              <li><strong>Location Data</strong> includes addresses and coordinates you input for route optimization.</li>
            </ul>
            <p>
              We do not collect any Special Categories of Personal Data about you (this includes details about your race or ethnicity, religious or philosophical beliefs, sex life, sexual orientation, political opinions, trade union membership, information about your health, and genetic and biometric data).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Data</h2>
            <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
            <ul className="list-disc pl-6 mt-2 mb-4">
              <li>To register you as a new customer.</li>
              <li>To process and deliver our services, including route optimization.</li>
              <li>To manage our relationship with you.</li>
              <li>To improve our website, products/services, marketing, or customer relationships.</li>
              <li>To recommend products or services that may be of interest to you.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
            <p>We use the following third-party services to provide our functionality:</p>
            <ul className="list-disc pl-6 mt-2 mb-4">
              <li><strong>HERE Maps API</strong>: We use HERE Maps for geocoding and route optimization. When you input addresses, they are sent to HERE's servers for processing. HERE's privacy policy can be found at <a href="https://www.here.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://www.here.com/privacy</a>.</li>
              <li><strong>Clerk</strong>: We use Clerk for authentication services. Clerk collects and processes personal information according to their privacy policy at <a href="https://clerk.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://clerk.com/privacy</a>.</li>
              <li><strong>Stripe</strong>: We use Stripe for payment processing. Stripe's privacy policy can be found at <a href="https://stripe.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://stripe.com/privacy</a>.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to track the activity on our service and hold certain information.
              Cookies are files with a small amount of data which may include an anonymous unique identifier.
            </p>
            <p className="mt-2">
              We use the following types of cookies:
            </p>
            <ul className="list-disc pl-6 mt-2 mb-4">
              <li><strong>Essential Cookies</strong>: Necessary for the website to function properly.</li>
              <li><strong>Analytical/Performance Cookies</strong>: Allow us to recognize and count the number of visitors and see how visitors move around our website.</li>
              <li><strong>Functionality Cookies</strong>: Enable us to personalize content for you.</li>
            </ul>
            <p>
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Legal Rights</h2>
            <p>
              Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
            </p>
            <ul className="list-disc pl-6 mt-2 mb-4">
              <li>Request access to your personal data.</li>
              <li>Request correction of your personal data.</li>
              <li>Request erasure of your personal data.</li>
              <li>Object to processing of your personal data.</li>
              <li>Request restriction of processing your personal data.</li>
              <li>Request transfer of your personal data.</li>
              <li>Right to withdraw consent.</li>
            </ul>
            <p>
              If you wish to exercise any of these rights, please contact us at help@optiroutepro.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our privacy practices, please contact us at:
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
