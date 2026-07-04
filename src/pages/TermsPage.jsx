import React from 'react';
import PolicyLayout, { PolicySection } from '../components/PolicyLayout';

export default function TermsPage() {
  return (
    <PolicyLayout title="Terms & Conditions" updated="4 July 2026">
      <PolicySection title="Introduction">
        <p>
          These Terms & Conditions govern your use of the Dillo website and your purchase of
          products from Dillo Textiles Pvt. Ltd. By accessing our website or placing an order,
          you agree to these terms.
        </p>
      </PolicySection>

      <PolicySection title="Products & Pricing">
        <ul className="list-disc pl-5 space-y-1">
          <li>All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise.</li>
          <li>Product colours may vary slightly from images due to screen settings and lighting.</li>
          <li>We reserve the right to modify prices, descriptions or availability without prior notice.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Orders & Payment">
        <ul className="list-disc pl-5 space-y-1">
          <li>Orders are confirmed only after successful payment via Razorpay (cards, UPI, net banking and wallets).</li>
          <li>We reserve the right to cancel any order due to stock unavailability or payment discrepancies, with a full refund issued in such cases.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Live Shows">
        <p>
          Products showcased during live shows are subject to availability at the time of
          checkout confirmation. Prices announced during a live show apply only to orders
          placed during that session.
        </p>
      </PolicySection>

      <PolicySection title="Intellectual Property">
        <p>
          All content on this website, including images, logos and text, is the property of
          Dillo Textiles Pvt. Ltd. and may not be reproduced without written permission.
        </p>
      </PolicySection>

      <PolicySection title="Limitation of Liability">
        <p>
          Dillo is not liable for delays or failures caused by circumstances beyond our
          reasonable control, including courier delays, natural disasters or third-party
          service disruptions.
        </p>
      </PolicySection>

      <PolicySection title="Governing Law">
        <p>
          These terms are governed by the laws of India, and any disputes shall be subject to
          the exclusive jurisdiction of the courts in Dindigul, Tamil Nadu.
        </p>
      </PolicySection>

      <PolicySection title="Contact Us">
        <p>
          Dillo Textiles Pvt. Ltd.<br />
          2, ST-ANDIYAPPAPILLAI STREET, KOTTAMPATTI MAIN ROAD, NATHAM,<br />
          Dindigul, Tamil Nadu 624401<br />
          Email: <a href="mailto:info@dillo.in" className="text-dillo-red hover:underline">info@dillo.in</a>
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}