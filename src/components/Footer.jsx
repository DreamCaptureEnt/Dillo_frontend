import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Youtube, Instagram, Facebook, ArrowRight } from 'lucide-react';
import DilloLogo from './../assets/Logo.png';

export default function Footer() {
  return (
    <footer className="bg-dillo-charcoal text-white border-t border-dillo-gold/20">
      {/* Newsletter strip */}
      <div className="bg-dillo-red py-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-2xl font-bold">Join Dillo Family</h3>
            <p className="font-body text-white/80 text-sm mt-1">
              Get exclusive offers, new arrivals & live show alerts
            </p>
          </div>
          <form className="flex flex-col sm:flex-row gap-0 w-full md:w-auto max-w-md" onSubmit={e => e.preventDefault()}>
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 px-4 py-3 text-dillo-charcoal text-sm font-body focus:outline-none min-w-0 sm:min-w-[240px]"
            />
            <button type="submit" className="bg-dillo-charcoal hover:bg-black text-white px-5 py-3 
              transition-colors font-body font-semibold text-sm flex items-center gap-2">
              Subscribe <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <img
            src={DilloLogo}
            alt="Dillo"
            width={562}
            height={444}
            className="h-10 w-auto object-contain"
          />
          <p className="font-body text-sm text-white/80 mt-4 leading-relaxed">
            Salem's premier destination for authentic silk sarees, handloom fabrics, 
            and readymade ethnic wear. Directly from weavers to your wardrobe.
          </p>
          <div className="flex gap-4 mt-6">
            <a href="https://youtube.com" target="_blank" rel="noreferrer"
              className="w-9 h-9 bg-white/15 hover:bg-dillo-red flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5">
              <Youtube size={16} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer"
              className="w-9 h-9 bg-white/15 hover:bg-dillo-red flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5">
              <Instagram size={16} />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer"
              className="w-9 h-9 bg-white/15 hover:bg-dillo-red flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5">
              <Facebook size={16} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-cinzel text-sm font-semibold tracking-widest text-dillo-gold uppercase mb-5">
            Quick Links
          </h4>
          <ul className="space-y-3">
            {[
              { label: 'Sarees', href: '/products?category=sarees' },
              { label: 'New Arrivals', href: '/new-arrivals' },
              { label: 'Live Show', href: '/live-show' },
              { label: 'Cost to Cost Sale', href: '/cost-to-cost' },
              { label: 'Readymade', href: '/products?category=readymade' },
              { label: 'About Us', href: '/about' },
            ].map(link => (
              <li key={link.label}>
                <Link
                  to={link.href}
                  className="font-body text-sm text-white/80 hover:text-dillo-gold transition-colors flex items-center gap-2"
                >
                  <ArrowRight size={12} className="text-dillo-red flex-shrink-0" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h4 className="font-cinzel text-sm font-semibold tracking-widest text-dillo-gold uppercase mb-5">
            Customer Care
          </h4>
          <ul className="space-y-3">
            {[
              { label: 'My Orders', href: '/account/orders' },
              { label: 'Return & Exchange', href: '/returns' },
              { label: 'Shipping Policy', href: '/shipping' },
              { label: 'Size Guide', href: '/size-guide' },
              { label: 'FAQ', href: '/faq' },
              { label: 'Track Order', href: '/track-order' },
            ].map(link => (
              <li key={link.label}>
                <Link
                  to={link.href}
                  className="font-body text-sm text-white/80 hover:text-dillo-gold transition-colors flex items-center gap-2"
                >
                  <ArrowRight size={12} className="text-dillo-red flex-shrink-0" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-cinzel text-sm font-semibold tracking-widest text-dillo-gold uppercase mb-5">
            Contact Us
          </h4>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <MapPin size={16} className="text-dillo-red flex-shrink-0 mt-0.5" />
              <span className="font-body text-sm text-white/80 leading-relaxed">
                2,ST-ANDIYAPPAPILLAI STREET,<br />
                KOTTAMPATTI MAIN ROAD, NATHAM,<br />
                Dindigul, Tamil Nadu 624401
              </span>
            </li>
            <li>
              <a href="tel:+919876543210" className="flex items-center gap-3 font-body text-sm text-white/80 hover:text-dillo-gold transition-colors">
                <Phone size={16} className="text-dillo-red flex-shrink-0" />
                +91 98765 43210
              </a>
            </li>
            <li>
              <a href="mailto:info@dillo.in" className="flex items-center gap-3 font-body text-sm text-white/80 hover:text-dillo-gold transition-colors">
                <Mail size={16} className="text-dillo-red flex-shrink-0" />
                info@dillo.in
              </a>
            </li>
          </ul>

          <div className="mt-6 p-4 bg-white/10 border border-white/15">
            <p className="text-xs font-body text-dillo-gold mb-2 font-semibold uppercase tracking-wide">Store Hours</p>
            <p className="text-sm font-body text-white/70">Mon – Sat: 9 AM – 8 PM</p>
            <p className="text-sm font-body text-white/70">Sunday: 10 AM – 6 PM</p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="font-body text-xs text-white/70">
            © 2026 Dillo Textiles Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {['Privacy Policy', 'Terms of Use', 'Refund Policy'].map(l => (
              <Link key={l} to="#" className="font-body text-xs text-white/70 hover:text-white transition-colors">
                {l}
              </Link>
            ))}
          </div>
          {/* Payment icons */}
          <div className="flex items-center gap-2">
            {['VISA', 'MC', 'UPI', 'Paytm', 'GPay'].map(p => (
              <span key={p} className="bg-white/15 px-2 py-1 text-[10px] font-bold text-white/80">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
