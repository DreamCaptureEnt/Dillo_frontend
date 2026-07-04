import React from 'react';

export default function PolicyLayout({ title, updated, children }) {
  return (
    <div className="bg-white">
      {/* Page header */}
      <div className="bg-dillo-charcoal text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="font-display text-3xl md:text-4xl font-bold">{title}</h1>
          {updated && (
            <p className="font-body text-sm text-white/70 mt-2">Last updated: {updated}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="policy-content font-body text-dillo-charcoal/90 space-y-8">
          {children}
        </div>
      </div>
    </div>
  );
}

export function PolicySection({ title, children }) {
  return (
    <section>
      <h2 className="font-cinzel text-sm font-semibold tracking-widest text-dillo-red uppercase mb-3">
        {title}
      </h2>
      <div className="font-body text-[15px] leading-relaxed text-dillo-charcoal/90 space-y-3">
        {children}
      </div>
    </section>
  );
}