import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Phone, Mail, Youtube, Instagram, Facebook,
  Heart, Award, Users, Truck, Shield, Star, ChevronRight, ArrowRight
} from 'lucide-react';

const values = [
  { icon: Heart, title: 'Weaver First', desc: 'We partner directly with master weavers, ensuring fair wages and preserving traditional crafts.', color: 'text-dillo-red' },
  { icon: Shield, title: 'Authenticity', desc: 'Every saree is certified authentic — we test silk purity and verify zari quality before listing.', color: 'text-dillo-gold' },
  { icon: Truck, title: 'Salem to Your Door', desc: 'From our store in Salem to your doorstep, we deliver carefully packaged with love.', color: 'text-blue-600' },
  { icon: Award, title: 'Trusted Since 1998', desc: 'Over 25 years of serving Tamil Nadu families with premium ethnic wear at honest prices.', color: 'text-green-600' },
];

const team = [
  { name: 'Ramasamy Pillai', role: 'Founder & Master Curator', desc: 'Third-generation silk merchant with 30+ years of expertise in Kanjivaram weaving traditions.', initials: 'RP' },
  { name: 'Meena Ramasamy', role: 'Head of Collections', desc: 'Travels to weaving villages across Tamil Nadu, Karnataka, and UP to source the finest fabrics.', initials: 'MR' },
  { name: 'Karthik R.', role: 'Customer Experience', desc: 'Ensures every Dillo customer feels like family — from first browse to post-purchase care.', initials: 'KR' },
];

const milestones = [
  { year: '1998', title: 'Founded in Salem', desc: 'A small shop in Saradha Complex, Salem with 50 sarees and a big dream.' },
  { year: '2005', title: 'Direct Weaver Network', desc: 'Established partnerships with 40+ weaving families in Kanchipuram and Dharmavaram.' },
  { year: '2014', title: '10,000 Customers', desc: 'Crossed a major milestone serving families across Salem, Coimbatore and Chennai.' },
  { year: '2020', title: 'Online & Live Shows', desc: 'Launched YouTube live saree shows during the pandemic — a game changer for reach.' },
  { year: '2024', title: 'Dillo.in Launches', desc: 'Our full e-commerce platform goes live, making authentic sarees accessible nationwide.' },
  { year: '2026', title: '25K+ Happy Families', desc: 'Now serving customers across India with 200+ curated silk and handloom collections.' },
];

const stats = [
  { value: '25K+', label: 'Happy Customers' },
  { value: '200+', label: 'Saree Styles' },
  { value: '40+', label: 'Weaver Partners' },
  { value: '28 yrs', label: 'Of Trust' },
];

export default function AboutPage() {
  return (
    <div className="bg-dillo-ivory min-h-screen">

      {/* Hero */}
      <div className="relative bg-dillo-charcoal overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1400&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dillo-charcoal via-dillo-charcoal/85 to-dillo-gold/20" />
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-dillo-gold to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="font-cinzel text-dillo-gold text-xs tracking-[0.35em] uppercase mb-4 block">Our Story</span>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-white leading-tight mb-4">
              Weavers to<br />Your Wardrobe
            </h1>
            <p className="font-body text-white/50 text-lg mb-3 tracking-wider">நமது கதை</p>
            <p className="font-body text-white/75 text-lg leading-relaxed mb-8">
              For over 25 years, Dillo has been Salem's most trusted name for authentic silk sarees, handloom fabrics, and readymade ethnic wear — connecting the artistry of master weavers directly to your wardrobe.
            </p>
            <div className="flex gap-4">
              <Link to="/products" className="btn-primary flex items-center gap-2">
                Shop Now <ArrowRight size={16} />
              </Link>
              <Link to="/live-show" className="btn-outline border-white text-white hover:bg-white hover:text-dillo-charcoal flex items-center gap-2">
                Watch Live
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 hidden md:grid">
            {stats.map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 text-center">
                <div className="font-display text-3xl font-bold text-dillo-gold mb-1">{s.value}</div>
                <div className="font-body text-white/70 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats mobile */}
      <div className="bg-dillo-red md:hidden">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 gap-4 text-center text-white">
          {stats.map((s, i) => (
            <div key={i}>
              <div className="font-display text-2xl font-bold text-white">{s.value}</div>
              <div className="font-body text-white/80 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 space-y-20">

        {/* Our Mission */}
        <section className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div
              className="w-full rounded-none overflow-hidden"
              style={{ height: 400 }}
            >
              <img
                src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=700&q=80"
                alt="Weaver at loom"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-dillo-red p-5 hidden md:block">
              <div className="font-display text-white text-2xl font-bold">1998</div>
              <div className="font-body text-white/80 text-xs">Founded in Salem</div>
            </div>
          </div>
          <div>
            <span className="font-cinzel text-dillo-gold text-xs tracking-[0.25em] uppercase">Our Mission</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-dillo-charcoal mt-2 mb-5">
              Preserving Tradition,<br />Empowering Weavers
            </h2>
            <p className="font-body text-gray-600 leading-relaxed mb-5">
              India's handloom tradition is one of the world's most extraordinary living art forms. At Dillo, we exist to ensure that this tradition thrives — by connecting you directly with the artisans who dedicate their lives to perfecting it.
            </p>
            <p className="font-body text-gray-600 leading-relaxed mb-8">
              Every saree we sell means a fair wage for a weaver, a preserved technique passed down through generations, and an authentic piece of cultural heritage in your wardrobe. When you choose Dillo, you're not just buying a saree — you're supporting an entire ecosystem of artisanship.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Weaver families supported', val: '40+' },
                { label: 'Districts we source from', val: '12+' },
              ].map((s, i) => (
                <div key={i} className="bg-dillo-cream border-l-4 border-dillo-gold px-4 py-3">
                  <div className="font-display text-2xl font-bold text-dillo-charcoal">{s.val}</div>
                  <div className="font-body text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section>
          <div className="text-center mb-12">
            <span className="font-cinzel text-dillo-gold text-xs tracking-[0.25em] uppercase">What we stand for</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-dillo-charcoal mt-2">Our Values</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div key={i} className="bg-white border border-gray-100 p-7 hover:shadow-lg transition-shadow group">
                  <div className={`w-12 h-12 bg-dillo-cream flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <Icon size={24} className={v.color} />
                  </div>
                  <h3 className="font-display text-lg font-bold text-dillo-charcoal mb-2">{v.title}</h3>
                  <p className="font-body text-sm text-gray-500 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Timeline */}
        <section>
          <div className="text-center mb-12">
            <span className="font-cinzel text-dillo-gold text-xs tracking-[0.25em] uppercase">Our journey</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-dillo-charcoal mt-2">25 Years of Dillo</h2>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-dillo-gold/30 hidden md:block" />
            <div className="space-y-10 md:space-y-0">
              {milestones.map((m, i) => (
                <div key={i} className={`md:flex items-center gap-8 mb-10 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className={`md:w-1/2 ${i % 2 === 0 ? 'md:text-right md:pr-8' : 'md:text-left md:pl-8'}`}>
                    <div className="bg-white border border-gray-100 p-6 hover:shadow-md transition-shadow inline-block text-left">
                      <div className="font-cinzel text-dillo-red font-bold text-sm tracking-widest mb-2">{m.year}</div>
                      <h3 className="font-display text-lg font-bold text-dillo-charcoal mb-2">{m.title}</h3>
                      <p className="font-body text-sm text-gray-500 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-dillo-gold rounded-full border-4 border-white shadow-sm" />
                  <div className="md:w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section>
          <div className="text-center mb-12">
            <span className="font-cinzel text-dillo-gold text-xs tracking-[0.25em] uppercase">The people behind Dillo</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-dillo-charcoal mt-2">Meet Our Team</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((m, i) => (
              <div key={i} className="bg-white border border-gray-100 p-8 text-center hover:shadow-lg transition-shadow">
                <div className="w-20 h-20 bg-dillo-charcoal rounded-full flex items-center justify-center mx-auto mb-5">
                  <span className="font-display text-2xl font-bold text-dillo-gold">{m.initials}</span>
                </div>
                <h3 className="font-display text-xl font-bold text-dillo-charcoal mb-1">{m.name}</h3>
                <p className="font-cinzel text-xs text-dillo-red tracking-widest uppercase mb-4">{m.role}</p>
                <p className="font-body text-sm text-gray-500 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact / Location */}
        <section className="grid md:grid-cols-2 gap-8">
          <div className="bg-dillo-charcoal text-white p-8 md:p-10">
            <span className="font-cinzel text-dillo-gold text-xs tracking-[0.25em] uppercase mb-4 block">Visit Us</span>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">Find Our Store</h2>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <MapPin size={20} className="text-dillo-red flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-body text-white font-semibold">Dillo Sarees</p>
                  <p className="font-body text-white/70 text-sm mt-1 leading-relaxed">
                    12, Saradha Complex, Omalur Road,<br />
                    Salem – 636 004, Tamil Nadu
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Phone size={20} className="text-dillo-red flex-shrink-0" />
                <a href="tel:+914272234567" className="font-body text-white/80 hover:text-white transition-colors">
                  +91 427 223 4567
                </a>
              </div>
              <div className="flex items-center gap-4">
                <Mail size={20} className="text-dillo-red flex-shrink-0" />
                <a href="mailto:hello@dillo.in" className="font-body text-white/80 hover:text-white transition-colors">
                  hello@dillo.in
                </a>
              </div>
              <div className="pt-2">
                <p className="font-body text-white/50 text-xs mb-3">Store Hours</p>
                <p className="font-body text-white/70 text-sm">Mon – Sat: 10:00 AM – 8:00 PM</p>
                <p className="font-body text-white/70 text-sm">Sun: 11:00 AM – 6:00 PM</p>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <a href="https://youtube.com" target="_blank" rel="noreferrer"
                className="w-9 h-9 bg-white/10 hover:bg-dillo-red flex items-center justify-center transition-colors">
                <Youtube size={16} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer"
                className="w-9 h-9 bg-white/10 hover:bg-dillo-red flex items-center justify-center transition-colors">
                <Instagram size={16} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer"
                className="w-9 h-9 bg-white/10 hover:bg-dillo-red flex items-center justify-center transition-colors">
                <Facebook size={16} />
              </a>
            </div>
          </div>

          <div className="bg-white border border-gray-100 p-8 md:p-10">
            <span className="font-cinzel text-dillo-gold text-xs tracking-[0.25em] uppercase mb-4 block">Get in Touch</span>
            <h2 className="font-display text-2xl font-bold text-dillo-charcoal mb-6">Send Us a Message</h2>
            <div className="space-y-4">
              <div>
                <label className="font-body text-sm text-gray-600 mb-1.5 block">Your Name</label>
                <input type="text" placeholder="Priya Sundaramurthy" className="input-field" />
              </div>
              <div>
                <label className="font-body text-sm text-gray-600 mb-1.5 block">Email Address</label>
                <input type="email" placeholder="priya@example.com" className="input-field" />
              </div>
              <div>
                <label className="font-body text-sm text-gray-600 mb-1.5 block">Phone (optional)</label>
                <input type="tel" placeholder="+91 98765 43210" className="input-field" />
              </div>
              <div>
                <label className="font-body text-sm text-gray-600 mb-1.5 block">Message</label>
                <textarea
                  placeholder="Ask about a saree, order status, or anything else..."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>
              <button className="btn-primary w-full">Send Message</button>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center pb-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-dillo-charcoal mb-3">Ready to Shop?</h2>
          <p className="font-body text-gray-500 mb-6">Discover our authentic handloom collection — curated with care, direct from weavers.</p>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2">
            Explore Collection <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
