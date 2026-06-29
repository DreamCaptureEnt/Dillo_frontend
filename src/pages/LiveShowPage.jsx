import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Youtube, Instagram, Bell, Calendar, Clock, Play, Star, ChevronRight, Zap, Users } from 'lucide-react';
import { products, formatPrice } from '../products.js';

const upcomingShows = [
  {
    id: 1,
    platform: 'YouTube',
    platformIcon: Youtube,
    platformColor: '#FF0000',
    platformBg: 'bg-red-600',
    title: 'Grand Kanjivaram Collection Reveal',
    titleTa: 'காஞ்சிபுரம் தொகுப்பு வெளியீடு',
    date: 'Sunday, June 8, 2026',
    time: '7:00 PM IST',
    host: 'Dillo Sarees Team',
    preview: 'Unboxing 50+ new Kanjivaram silk sarees with live pricing. Prices start at ₹4,999!',
    viewers: '2.4K',
    isLive: false,
    isNext: true,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80',
  },
  {
    id: 2,
    platform: 'Instagram',
    platformIcon: Instagram,
    platformColor: '#E1306C',
    platformBg: 'bg-gradient-to-br from-purple-600 via-pink-500 to-yellow-400',
    title: 'Wedding Season Bridal Special',
    titleTa: 'திருமண சீசன் கண்காட்சி',
    date: 'Wednesday, June 11, 2026',
    time: '6:30 PM IST',
    host: 'Meena & Team',
    preview: 'Exclusive bridal sarees, jewellery sets, and blouse combos for the wedding season.',
    viewers: '1.8K',
    isLive: false,
    isNext: false,
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80',
  },
  {
    id: 3,
    platform: 'YouTube',
    platformIcon: Youtube,
    platformColor: '#FF0000',
    platformBg: 'bg-red-600',
    title: 'Cotton & Handloom Festival',
    titleTa: 'பருத்தி & கைத்தறி விழா',
    date: 'Saturday, June 14, 2026',
    time: '8:00 PM IST',
    host: 'Dillo Sarees Team',
    preview: 'Summer-ready cotton sarees and handloom fabrics — light, breathable, and gorgeous.',
    viewers: '3.1K',
    isLive: false,
    isNext: false,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80',
  },
];

const pastShows = [
  {
    id: 101,
    title: 'Pattu Saree Mega Haul',
    date: 'June 1, 2026',
    platform: 'YouTube',
    views: '12,400',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80',
    url: 'https://youtube.com',
  },
  {
    id: 102,
    title: 'Banarasi Bridal Collection',
    date: 'May 25, 2026',
    platform: 'YouTube',
    views: '8,700',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&q=80',
    url: 'https://youtube.com',
  },
  {
    id: 103,
    title: 'Budget Sarees Under ₹2000',
    date: 'May 18, 2026',
    platform: 'Instagram',
    views: '15,200',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80',
    url: 'https://instagram.com',
  },
];

const featuredShowProducts = products.slice(0, 4);

function Countdown({ targetDate }) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const target = new Date(targetDate).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setTime({ h: 0, m: 0, s: 0 }); return; }
      setTime({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  const pad = n => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-2">
      {[['h', 'HRS'], ['m', 'MIN'], ['s', 'SEC']].map(([key, label]) => (
        <div key={key} className="text-center">
          <div className="bg-dillo-charcoal text-white font-display font-bold text-2xl w-14 h-14 flex items-center justify-center">
            {pad(time[key])}
          </div>
          <div className="text-xs font-cinzel tracking-widest text-gray-400 mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}

export default function LiveShowPage() {
  const nextShow = upcomingShows.find(s => s.isNext);

  return (
    <div className="bg-dillo-ivory min-h-screen">

      {/* Hero */}
      <div className="relative bg-dillo-charcoal overflow-hidden">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1400&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-dillo-charcoal via-dillo-charcoal/90 to-dillo-red/20" />
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-dillo-red to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2 bg-red-600 px-3 py-1.5 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-white" />
              <span className="font-cinzel text-white text-xs font-bold tracking-widest">LIVE SHOWS</span>
            </div>
            <span className="font-body text-white/50 text-sm">every week</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-white leading-tight mb-3">
            Shop Live with Dillo
          </h1>
          <p className="font-body text-white/50 text-lg mb-2 tracking-wider">நேரலை வகுப்பு</p>
          <p className="font-body text-white/70 text-lg max-w-2xl leading-relaxed mb-8">
            Watch our live saree showcases on YouTube and Instagram — see the true silk sheen, ask questions, and grab exclusive live-only prices before they sell out!
          </p>

          <div className="flex gap-4 flex-wrap">
            <a
              href="https://youtube.com/@DilloSarees"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 font-body font-semibold text-sm transition-colors"
            >
              <Youtube size={18} /> Subscribe on YouTube
            </a>
            <a
              href="https://instagram.com/DilloSarees"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 text-white px-6 py-3 font-body font-semibold text-sm transition-opacity"
            >
              <Instagram size={18} /> Follow on Instagram
            </a>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="bg-dillo-red">
        <div className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-3 gap-4 text-center text-white">
          {[
            { value: '50+', label: 'Shows per month' },
            { value: '25K+', label: 'Live viewers' },
            { value: '500+', label: 'Sarees shown live' },
          ].map((s, i) => (
            <div key={i}>
              <div className="font-display text-2xl md:text-3xl font-bold">{s.value}</div>
              <div className="font-body text-white/80 text-xs md:text-sm mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">

        {/* Next Show Countdown */}
        {nextShow && (
          <section>
            <div className="bg-dillo-charcoal text-white overflow-hidden relative">
              <div className="pattern-silk absolute inset-0" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-dillo-gold via-dillo-red to-dillo-gold" />
              <div className="relative z-10 grid md:grid-cols-2 gap-0">
                <div className="relative overflow-hidden" style={{ minHeight: 280 }}>
                  <img
                    src={nextShow.image}
                    alt={nextShow.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-dillo-charcoal" />
                  <div className="absolute bottom-6 left-6">
                    <span className="bg-dillo-gold text-white text-xs font-cinzel tracking-widest px-3 py-1 uppercase">
                      Next Show
                    </span>
                  </div>
                </div>
                <div className="p-8 md:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3">
                    <nextShow.platformIcon size={18} style={{ color: nextShow.platformColor }} />
                    <span className="font-body text-white/60 text-sm">{nextShow.platform} Live</span>
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
                    {nextShow.title}
                  </h3>
                  <p className="font-body text-white/50 text-sm mb-1">{nextShow.titleTa}</p>
                  <p className="font-body text-white/70 text-sm mb-6 leading-relaxed">{nextShow.preview}</p>
                  <div className="flex items-center gap-3 text-white/50 text-sm font-body mb-6">
                    <Calendar size={14} />
                    <span>{nextShow.date}</span>
                    <Clock size={14} className="ml-2" />
                    <span>{nextShow.time}</span>
                  </div>
                  <div className="mb-6">
                    <p className="font-cinzel text-xs tracking-widest text-dillo-gold uppercase mb-3">Show starts in</p>
                    <Countdown targetDate="2026-06-08T19:00:00+05:30" />
                  </div>
                  <button className="btn-primary self-start flex items-center gap-2">
                    <Bell size={16} /> Set Reminder
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Upcoming Shows */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="font-cinzel text-dillo-gold text-xs tracking-[0.25em] uppercase">Schedule</span>
              <h2 className="font-display text-3xl font-bold text-dillo-charcoal mt-1">Upcoming Shows</h2>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {upcomingShows.map((show) => {
              const Icon = show.platformIcon;
              return (
                <div key={show.id} className="bg-white border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  <div className="relative overflow-hidden" style={{ height: 180 }}>
                    <img
                      src={show.image}
                      alt={show.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className={`${show.platformBg} text-white text-xs font-bold px-2 py-1 flex items-center gap-1`}>
                        <Icon size={10} /> {show.platform}
                      </span>
                    </div>
                    {show.isNext && (
                      <div className="absolute top-3 right-3 bg-dillo-gold text-white text-xs font-bold px-2 py-1">
                        NEXT UP
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center gap-2 text-white/80">
                        <Users size={12} />
                        <span className="text-xs font-body">{show.viewers} expected</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg font-bold text-dillo-charcoal mb-1 line-clamp-2">
                      {show.title}
                    </h3>
                    <p className="font-body text-xs text-gray-400 mb-3">{show.titleTa}</p>
                    <div className="flex items-center gap-3 text-gray-500 text-xs font-body mb-4">
                      <span className="flex items-center gap-1"><Calendar size={11} /> {show.date}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500 text-xs font-body mb-4">
                      <span className="flex items-center gap-1"><Clock size={11} /> {show.time}</span>
                    </div>
                    <p className="font-body text-sm text-gray-500 line-clamp-2 mb-4">{show.preview}</p>
                    <button className="btn-outline w-full flex items-center justify-center gap-2 py-2.5 text-xs">
                      <Bell size={13} /> Remind Me
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Past Shows */}
        <section>
          <div className="mb-8">
            <span className="font-cinzel text-dillo-gold text-xs tracking-[0.25em] uppercase">Recordings</span>
            <h2 className="font-display text-3xl font-bold text-dillo-charcoal mt-1">Watch Past Shows</h2>
            <p className="font-body text-gray-500 text-sm mt-2">Missed a live? Catch up anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {pastShows.map((show) => (
              <a
                key={show.id}
                href={show.url}
                target="_blank"
                rel="noreferrer"
                className="group bg-white border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 block"
              >
                <div className="relative overflow-hidden" style={{ height: 180 }}>
                  <img
                    src={show.image}
                    alt={show.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                      <Play size={22} className="text-dillo-red fill-dillo-red ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-black/60 text-white text-xs font-body px-2 py-0.5 flex items-center gap-1">
                      {show.platform === 'YouTube' ? <Youtube size={10} /> : <Instagram size={10} />}
                      {show.views} views
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-display font-bold text-dillo-charcoal group-hover:text-dillo-red transition-colors">
                    {show.title}
                  </h3>
                  <p className="font-body text-sm text-gray-400 mt-1">{show.date}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Featured products from last show */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="font-cinzel text-dillo-gold text-xs tracking-[0.25em] uppercase">From Our Last Live</span>
              <h2 className="font-display text-3xl font-bold text-dillo-charcoal mt-1">Shop Show Picks</h2>
              <p className="font-body text-gray-500 text-sm mt-2">Products featured in our recent live shows</p>
            </div>
            <Link to="/products" className="hidden md:flex items-center gap-2 text-dillo-red font-body font-semibold text-sm hover:gap-3 transition-all">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featuredShowProducts.map(product => (
              <div key={product.id} className="relative">
                <div className="absolute top-3 left-3 z-10">
                  <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 flex items-center gap-1">
                    <Zap size={9} fill="white" /> LIVE PICK
                  </span>
                </div>
                <Link to={`/products/${product.id}`} className="block bg-white border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                  <div className="overflow-hidden" style={{ height: 200 }}>
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-body font-semibold text-sm text-dillo-charcoal line-clamp-1">{product.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="price-tag text-base">{formatPrice(product.price)}</span>
                      <span className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Subscribe CTA */}
        <div className="grid md:grid-cols-2 gap-6">
          <a
            href="https://youtube.com/@DilloSarees"
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col items-center justify-center gap-4 bg-red-600 text-white p-10 hover:bg-red-700 transition-colors text-center"
          >
            <Youtube size={48} className="group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="font-display text-2xl font-bold mb-1">Subscribe on YouTube</h3>
              <p className="font-body text-white/80 text-sm">Live saree shows every Sunday & Wednesday at 7 PM</p>
            </div>
            <span className="border-2 border-white px-6 py-2 font-body font-semibold text-sm tracking-widest uppercase">
              Subscribe Free
            </span>
          </a>
          <a
            href="https://instagram.com/DilloSarees"
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col items-center justify-center gap-4 text-white p-10 text-center transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}
          >
            <Instagram size={48} className="group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="font-display text-2xl font-bold mb-1">Follow on Instagram</h3>
              <p className="font-body text-white/80 text-sm">Daily reels, stories & flash live sales</p>
            </div>
            <span className="border-2 border-white px-6 py-2 font-body font-semibold text-sm tracking-widest uppercase">
              Follow Now
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
