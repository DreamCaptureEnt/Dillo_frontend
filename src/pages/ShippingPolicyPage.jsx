import React from 'react';
import PolicyLayout, { PolicySection } from '../components/PolicyLayout';

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout title="Shipping & Delivery Policy" updated="4 July 2026">
      <PolicySection title="Shipping Coverage">
        <p>
          We ship all orders across India through trusted courier partners. Currently, we do
          not offer international shipping.
        </p>
      </PolicySection>

      <PolicySection title="Processing Time">
        <ul className="list-disc pl-5 space-y-1">
          <li>Orders are processed and dispatched within 1–3 business days of payment confirmation.</li>
          <li>Orders placed during Live Show sessions may take up to 5 business days to dispatch due to demand.</li>
          <li>Orders are not processed on Sundays and public holidays.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Delivery Timelines">
        <ul className="list-disc pl-5 space-y-1">
          <li>Tamil Nadu: 2–4 business days after dispatch</li>
          <li>Rest of India: 4–7 business days after dispatch</li>
          <li>Delivery timelines may vary due to courier delays, weather or regional restrictions.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Shipping Charges">
        <ul className="list-disc pl-5 space-y-1">
          <li>Free shipping on prepaid orders above ₹1,999.</li>
          <li>A flat shipping fee applies to orders below this amount, shown at checkout.</li>
          <li>Cash on Delivery orders carry an additional handling fee, shown at checkout.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Order Tracking">
        <p>
          Once your order is shipped, you will receive a tracking link via SMS and email. You
          can also track your order from the "Track Order" page using your order number.
        </p>
      </PolicySection>

      <PolicySection title="Failed Delivery">
        <p>
          If a delivery attempt fails due to an incorrect address or unavailability, our
          courier partner will attempt redelivery. Orders undelivered after 3 attempts will be
          returned to us, and the customer will be contacted for further action.
        </p>
      </PolicySection>

      <PolicySection title="Contact Us">
        <p>
          For shipping queries, contact us at{' '}
          <a href="mailto:info@dillo.in" className="text-dillo-red hover:underline">info@dillo.in</a>{' '}
          or <a href="tel:+919876543210" className="text-dillo-red hover:underline">+91 98765 43210</a>.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}