import React from 'react';
import PolicyLayout, { PolicySection } from '../components/PolicyLayout';

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout title="Privacy Policy" updated="4 July 2026">
      <PolicySection title="Overview">
        <p>
          Dillo Textiles Pvt. Ltd. ("Dillo", "we", "us", "our") respects your privacy and is
          committed to protecting the personal information you share with us when you visit
          our website or purchase our products.
        </p>
      </PolicySection>

      <PolicySection title="Information We Collect">
        <p>We collect the following information when you use our website:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Name, email address, phone number and shipping/billing address</li>
          <li>Order history and product preferences</li>
          <li>Payment information, processed securely through our payment partner Razorpay</li>
          <li>Device and browser information collected automatically for security and analytics</li>
        </ul>
      </PolicySection>

      <PolicySection title="How We Use Your Information">
        <ul className="list-disc pl-5 space-y-1">
          <li>To process and deliver your orders</li>
          <li>To communicate order updates, offers and live show alerts</li>
          <li>To improve our website, products and customer service</li>
          <li>To prevent fraud and ensure secure transactions</li>
        </ul>
      </PolicySection>

      <PolicySection title="Payment Security">
        <p>
          All payments on our website are processed through Razorpay, a PCI-DSS compliant
          payment gateway. We do not store your card, UPI or net banking credentials on our
          servers.
        </p>
      </PolicySection>

      <PolicySection title="Sharing of Information">
        <p>
          We do not sell or rent your personal information. We share information only with
          trusted service providers such as payment gateways and logistics partners, solely to
          fulfil your orders.
        </p>
      </PolicySection>

      <PolicySection title="Your Rights">
        <p>
          You may request access, correction or deletion of your personal data at any time by
          writing to us at <a href="mailto:info@dillo.in" className="text-dillo-red hover:underline">info@dillo.in</a>.
        </p>
      </PolicySection>

      <PolicySection title="Contact Us">
        <p>
          Dillo Textiles Pvt. Ltd.<br />
          2, ST-ANDIYAPPAPILLAI STREET, KOTTAMPATTI MAIN ROAD, NATHAM,<br />
          Dindigul, Tamil Nadu 624401<br />
          Phone: <a href="tel:+919876543210" className="text-dillo-red hover:underline">+91 98765 43210</a><br />
          Email: <a href="mailto:info@dillo.in" className="text-dillo-red hover:underline">info@dillo.in</a>
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}