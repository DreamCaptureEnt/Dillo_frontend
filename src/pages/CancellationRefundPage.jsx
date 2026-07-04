import React from 'react';
import PolicyLayout, { PolicySection } from '../components/PolicyLayout';

export default function CancellationRefundPage() {
  return (
    <PolicyLayout title="Cancellation & Refund Policy" updated="4 July 2026">
      <PolicySection title="Order Cancellation">
        <ul className="list-disc pl-5 space-y-1">
          <li>Orders can be cancelled free of charge within 2 hours of placing them, as long as they have not been shipped.</li>
          <li>Once an order has been shipped, it cannot be cancelled; you may request a return once the product is delivered.</li>
          <li>To cancel an order, contact us at <a href="mailto:info@dillo.in" className="text-dillo-red hover:underline">info@dillo.in</a> or call <a href="tel:+919876543210" className="text-dillo-red hover:underline">+91 98765 43210</a> with your order number.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Returns & Exchange">
        <ul className="list-disc pl-5 space-y-1">
          <li>Returns are accepted within 7 days of delivery for unused products in original packaging with tags intact.</li>
          <li>Products purchased during Live Show sessions can be exchanged but are not eligible for return unless defective or damaged.</li>
          <li>Customised or altered readymade garments are not eligible for return or exchange.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Damaged or Incorrect Items">
        <p>
          If you receive a damaged, defective or incorrect item, please share unboxing photos
          or a video with us within 48 hours of delivery at{' '}
          <a href="mailto:info@dillo.in" className="text-dillo-red hover:underline">info@dillo.in</a>{' '}
          for a free replacement or full refund.
        </p>
      </PolicySection>

      <PolicySection title="Refund Process">
        <ul className="list-disc pl-5 space-y-1">
          <li>Once a return is received and inspected, refunds are processed within 5–7 business days.</li>
          <li>Refunds are credited to the original payment method used at checkout via Razorpay.</li>
          <li>Depending on your bank, it may take an additional 3–5 business days for the amount to reflect in your account.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Non-Refundable Items">
        <ul className="list-disc pl-5 space-y-1">
          <li>Products marked "Final Sale" or purchased during clearance offers</li>
          <li>Products without original tags or packaging</li>
          <li>Custom-stitched or altered garments</li>
        </ul>
      </PolicySection>

      <PolicySection title="Contact Us">
        <p>
          For any cancellation or refund query, reach us at{' '}
          <a href="mailto:info@dillo.in" className="text-dillo-red hover:underline">info@dillo.in</a>{' '}
          or <a href="tel:+919876543210" className="text-dillo-red hover:underline">+91 98765 43210</a>.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}