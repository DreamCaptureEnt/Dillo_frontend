import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, ArrowRight, Play, Sparkles, Shield, RefreshCw, Truck, Star
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { LogoLoader } from '../components/Preloader';
import { apiFetch, toQuery } from '../api';
import { bannerSlides, formatPrice } from '../products.js';
import HeroImage1 from '../assets/Image1.jpg';
import HeroImage2 from '../assets/Image2.jpg';
import HeroImage3 from '../assets/Image3.jpg';
import HeroImage4 from '../assets/Image4.jpg';
import HeroImage5 from '../assets/Image5.jpg';
import HeroImage6 from '../assets/Image6.jpg';


const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80';

function getResults(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.results || [];
}
function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeProduct(product) {
  const price = toNumber(product.price);
  const originalPrice = toNumber(product.original_price ?? product.originalPrice ?? product.price, price);
  const images = Array.isArray(product.images) && product.images.length ? product.images : [FALLBACK_IMAGE];
  const id = product.slug || String(product.id);

  return {
    id,
    backendId: product.id,
    slug: product.slug || id,
    name: product.name || 'Untitled Product',
    nameTa: product.name_ta || product.nameTa || '',
    category: product.category_slug || product.categorySlug || String(product.category || ''),
    categoryName: product.category_name || product.categoryName || '',
    type: product.saree_type || product.type || '',
    occasion: product.occasion_slug || product.occasionSlug || product.occasion_name || product.occasion || '',
    occasionName: product.occasion_name || product.occasionName || '',
    price,
    originalPrice,
    discount: toNumber(product.discount),
    colors: Array.isArray(product.colors) ? product.colors : [],
    images,
    video: product.video_url || product.video || null,
    isNew: Boolean(product.is_new ?? product.isNew),
    isFeatured: Boolean(product.is_featured ?? product.isFeatured),
    isBestseller: Boolean(product.is_bestseller ?? product.isBestseller),
    inStock: Boolean(product.in_stock ?? product.inStock ?? toNumber(product.stock_count) > 0),
    stockCount: toNumber(product.stock_count ?? product.stockCount),
    rating: toNumber(product.rating),
    reviewCount: toNumber(product.review_count ?? product.reviewCount),
    description: product.description || '',
    details: product.information || product.details || {},
    tags: Array.isArray(product.tags) ? product.tags : [],
  };
}

function normalizeCategory(category, index) {
  const fallbackImages = [
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80',
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80',
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80',
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80',
  ];

  return {
    id: category.slug || String(category.id),
    label: category.name,
    labelTa: category.name_ta || '',
    img: category.image || fallbackImages[index % fallbackImages.length],
  };
}

function useHomeProducts() {
  const [state, setState] = useState({
    featured: [],
    bestsellers: [],
    newArrivals: [],
    categories: [],
    loading: true,
    error: '',
  });

  useEffect(() => {
    let mounted = true;

    Promise.all([
      apiFetch(`/sarees/${toQuery({ page_size: 8, featured: true })}`),
      apiFetch(`/sarees/${toQuery({ page_size: 4, bestseller: true })}`),
      apiFetch(`/sarees/${toQuery({ page_size: 4, new: true, ordering: '-created_at' })}`),
      apiFetch('/saree-categories/?page_size=100'),
    ])
      .then(([featuredPayload, bestsellerPayload, newPayload, categoryPayload]) => {
        if (!mounted) return;
        setState({
          featured: getResults(featuredPayload).map(normalizeProduct),
          bestsellers: getResults(bestsellerPayload).map(normalizeProduct),
          newArrivals: getResults(newPayload).map(normalizeProduct),
          categories: getResults(categoryPayload)
            .filter(category => category.is_active ?? true)
            .map(normalizeCategory)
            .slice(0, 4),
          loading: false,
          error: '',
        });
      })
      .catch(err => {
        console.error(err);
        if (mounted) {
          setState(current => ({
            ...current,
            loading: false,
            error: err.message || 'Could not load homepage products',
          }));
        }
      });

    return () => { mounted = false; };
  }, []);

  return state;
}
function HeroBanner() {
  const [active, setActive] = useState(0);
  const [mobileActive, setMobileActive] = useState(0);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  // 6 images grouped into 2 desktop slides of 3 images each.
  // Center tile of each slide carries the glass caption.
  const imageCaptions = [
    { src: HeroImage1, label: 'Kanjivaram Silk', sub: 'Pure zari weave' },
    { src: HeroImage2, label: 'Banarasi Silk', sub: 'Royal brocade' },
    { src: HeroImage3, label: 'Mysore Silk', sub: 'Soft & lustrous' },
    { src: HeroImage4, label: 'Dharmavaram', sub: 'Temple border' },
    { src: HeroImage5, label: 'Tussar Silk', sub: 'Natural elegance' },
    { src: HeroImage6, label: 'Organza', sub: 'Sheer & graceful' },
  ];

  const IMAGES_PER_SLIDE = 3;
  const slideCount = Math.ceil(imageCaptions.length / IMAGES_PER_SLIDE); // 6 images → exactly 2 slides

  const heroSlides = Array.from({ length: slideCount }, (_, i) => {
    const base = bannerSlides[i % bannerSlides.length] || {};
    return {
      ...base,
      id: base.id ?? `slide-${i}`,
      portraitImages: imageCaptions.slice(i * IMAGES_PER_SLIDE, i * IMAGES_PER_SLIDE + IMAGES_PER_SLIDE),
    };
  });
  const goToSlide = (index) => setActive((index + slideCount) % slideCount);
  const nextSlide = () => goToSlide(active + 1);
  const prevSlide = () => goToSlide(active - 1);

  const mobileCount = imageCaptions.length;
  const goToMobile = (index) => setMobileActive((index + mobileCount) % mobileCount);
  const nextMobile = () => goToMobile(mobileActive + 1);
  const prevMobile = () => goToMobile(mobileActive - 1);

  useEffect(() => {
    const timer = setInterval(() => setActive(a => (a + 1) % slideCount), 4200);
    return () => clearInterval(timer);
  }, [slideCount]);

  useEffect(() => {
    const timer = setInterval(() => setMobileActive(a => (a + 1) % mobileCount), 3000);
    return () => clearInterval(timer);
  }, [mobileCount]);

  const slide = heroSlides[active];

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  };
  const handleTouchEnd = (event, isMobile) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (isMobile) {
      if (deltaX < 0) nextMobile();
      else prevMobile();
    } else {
      if (deltaX < 0) nextSlide();
      else prevSlide();
    }
  };

  return (
    <div className="hero-banner relative overflow-hidden bg-dillo-charcoal">
      <div className="hero-grain" aria-hidden="true" />

      <div className="hero-layout">
        {/* ---------- TEXT COLUMN (desktop) ---------- */}
        <div className="hero-text-col hidden md:flex">
          <div key={active} className="hero-text-inner">
            <span className="hero-eyebrow">{slide.badge}</span>
            <h1 className="hero-title">{slide.title}</h1>
            <p className="hero-title-ta">{slide.titleTa}</p>
            <p className="hero-subtitle">{slide.subtitle}</p>
            <div className="flex gap-4 flex-wrap mt-2">
              <Link to="/products" className="btn-primary flex items-center gap-2 px-6 sm:px-8 py-3.5">
                {slide.cta} <ArrowRight size={18} />
              </Link>
              <Link
                to="/cost-to-cost"
                className="btn-outline border-white text-white hover:bg-white hover:text-dillo-red flex items-center gap-2 px-6 sm:px-8 py-3.5"
              >
                View Sale
              </Link>
            </div>
          </div>
        </div>

        {/* ---------- ZARI SEAM ---------- */}
        <div className="hero-zari-seam hidden md:block" aria-hidden="true">
          <span className="hero-zari-shimmer" />
        </div>

        {/* ---------- DESKTOP: 3-image sliding track ---------- */}
        <div
          className="hero-image-col hidden md:block"
          onTouchStart={handleTouchStart}
          onTouchEnd={(e) => handleTouchEnd(e, false)}
        >
          <div
            className="hero-track"
            style={{ transform: `translateX(-${active * 100}%)` }}
          >
            {heroSlides.map((s, slideIndex) => (
              <div key={s.id} className="hero-portrait-grid">
                {s.portraitImages.map((img, imageIndex) => (
                  <div
                    key={`${s.id}-${imageIndex}`}
                    className={`hero-portrait-tile hero-tile-${imageIndex} ${slideIndex === active ? 'hero-tile-in' : ''}`}
                    style={{ transitionDelay: `${imageIndex * 90}ms` }}
                  >
                    <img src={img.src} alt={img.label} className="w-full h-full object-cover" />
                    {imageIndex === 1 && (
                      <div className="hero-glass-caption">
                        <p className="hero-glass-caption-label">{img.label}</p>
                        <p className="hero-glass-caption-sub">{img.sub}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <button type="button" onClick={prevSlide} className="hero-nav-button hero-nav-prev" aria-label="Previous hero slide">
            <ChevronLeft size={20} />
          </button>
          <button type="button" onClick={nextSlide} className="hero-nav-button hero-nav-next" aria-label="Next hero slide">
            <ChevronRight size={20} />
          </button>

          <div className="hero-dots">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToSlide(i)}
                aria-label={`Show hero slide ${i + 1}`}
                className={`hero-dot ${i === active ? 'hero-dot-active' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* ---------- MOBILE ---------- */}
        <div className="hero-mobile-shell md:hidden">
          <div className="hero-mobile-wrap" onTouchStart={handleTouchStart} onTouchEnd={(e) => handleTouchEnd(e, true)}>
          <div className="hero-track" style={{ transform: `translateX(-${mobileActive * 100}%)` }}>
            {imageCaptions.map((img, i) => (
              <div key={i} className="hero-mobile-image">
                <img src={img.src} alt={img.label} />
                <div className="hero-glass-badge">
                  <p className="hero-glass-caption-label">{img.label}</p>
                  <p className="hero-glass-caption-sub">{img.sub}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="hero-dots hero-dots-mobile">
            {imageCaptions.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToMobile(i)}
                aria-label={`Show hero image ${i + 1}`}
                className={`hero-dot ${i === mobileActive ? 'hero-dot-active' : ''}`}
              />
            ))}
          </div>
        </div>

          <div className="hero-mobile-text" key={`m-${active}`}>
            <span className="hero-eyebrow">{slide.badge}</span>
            <h1 className="hero-title">{slide.title}</h1>
            <p className="hero-subtitle">{slide.subtitle}</p>
            <div className="flex gap-3 flex-wrap mt-1">
              <Link to="/products" className="btn-primary flex items-center gap-2 px-5 py-3">
                {slide.cta} <ArrowRight size={16} />
              </Link>
              <Link
                to="/cost-to-cost"
                className="btn-outline border-white text-white hover:bg-white hover:text-dillo-red flex items-center gap-2 px-5 py-3"
              >
                View Sale
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DynamicHeroBanner() {
  const fallbackSlides = [
    { landscapeUrl: HeroImage1, portraitUrl: HeroImage1, captionLabel: 'Kanjivaram Silk', captionSubtitle: 'Pure zari weave' },
    { landscapeUrl: HeroImage2, portraitUrl: HeroImage2, captionLabel: 'Banarasi Silk', captionSubtitle: 'Royal brocade' },
    { landscapeUrl: HeroImage3, portraitUrl: HeroImage3, captionLabel: 'Mysore Silk', captionSubtitle: 'Soft and lustrous' },
    { landscapeUrl: HeroImage4, portraitUrl: HeroImage4, captionLabel: 'Dharmavaram', captionSubtitle: 'Temple border' },
    { landscapeUrl: HeroImage5, portraitUrl: HeroImage5, captionLabel: 'Tussar Silk', captionSubtitle: 'Natural elegance' },
    { landscapeUrl: HeroImage6, portraitUrl: HeroImage6, captionLabel: 'Organza', captionSubtitle: 'Sheer and graceful' },
  ].map((item, i) => ({
    ...(bannerSlides[i % bannerSlides.length] || {}),
    id: `fallback-${i}`,
    ctaUrl: '/products',
    ...item,
  }));
  const [slides, setSlides] = useState(fallbackSlides);
  const [active, setActive] = useState(0);
  const [mobileActive, setMobileActive] = useState(0);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const count = Math.max(slides.length, 1);
  const slide = slides[active] || fallbackSlides[0];
  const mobileSlide = slides[mobileActive] || slide;

  const goToSlide = (index) => setActive((index + count) % count);
  const goToMobile = (index) => setMobileActive((index + count) % count);

  useEffect(() => {
    let mounted = true;
    apiFetch('/home-screen-images/?page_size=20&is_active=true')
      .then(payload => {
        if (!mounted) return;
        const rows = getResults(payload)
          .filter(item => item.landscape_url || item.portrait_url)
          .map((item, i) => {
            const base = bannerSlides[i % bannerSlides.length] || {};
            return {
              ...base,
              id: item.id,
              title: item.title || '',
              titleTa: item.title_ta || '',
              subtitle: item.subtitle || '',
              badge: item.badge || '',
              cta: item.cta_label || '',
              ctaUrl: item.cta_url || '/products',
              landscapeUrl: item.landscape_url || item.portrait_url,
              portraitUrl: item.portrait_url || item.landscape_url,
              captionLabel: item.caption_label || item.title || base.title,
              captionSubtitle: item.caption_subtitle || item.badge || '',
            };
          });
        if (rows.length) {
          setSlides(rows);
          setActive(0);
          setMobileActive(0);
        }
      })
      .catch(err => console.error('Could not load home screen images', err));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setActive(value => (value + 1) % count), 4200);
    return () => clearInterval(timer);
  }, [count]);

  useEffect(() => {
    const timer = setInterval(() => setMobileActive(value => (value + 1) % count), 3000);
    return () => clearInterval(timer);
  }, [count]);

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  };

  const handleTouchEnd = (event, isMobile) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (isMobile) goToMobile(mobileActive + (deltaX < 0 ? 1 : -1));
    else goToSlide(active + (deltaX < 0 ? 1 : -1));
  };

  return (
    <div className="hero-banner relative overflow-hidden bg-dillo-charcoal">
      <div className="hero-grain" aria-hidden="true" />
      <div className="hero-layout dynamic-hero-layout">
        <div className="hero-text-col hidden md:flex">
          <div key={active} className="hero-text-inner">
            <span className="hero-eyebrow">{slide.badge}</span>
            <h1 className="hero-title">{slide.title}</h1>
            <p className="hero-title-ta">{slide.titleTa}</p>
            <p className="hero-subtitle">{slide.subtitle}</p>
            <div className="flex gap-4 flex-wrap mt-2">
              <Link to={slide.ctaUrl || '/products'} className="btn-primary flex items-center gap-2 px-6 sm:px-8 py-3.5">
                {slide.cta} <ArrowRight size={18} />
              </Link>
              <Link to="/cost-to-cost" className="btn-outline border-white text-white hover:bg-white hover:text-dillo-red flex items-center gap-2 px-6 sm:px-8 py-3.5">
                View Sale
              </Link>
            </div>
          </div>
        </div>

        <div className="hero-zari-seam hidden md:block" aria-hidden="true">
          <span className="hero-zari-shimmer" />
        </div>

        <div className="hero-image-col hidden md:block" onTouchStart={handleTouchStart} onTouchEnd={(event) => handleTouchEnd(event, false)}>
          <div className="hero-track" style={{ transform: `translateX(-${active * 100}%)` }}>
            {slides.map(item => (
              <div key={item.id} className="hero-landscape-slide">
                <img src={item.landscapeUrl} alt={item.captionLabel || item.title} className="w-full h-full object-cover" />
                {(item.captionLabel || item.captionSubtitle) && (
                  <div className="hero-glass-caption hero-landscape-caption">
                    {item.captionLabel && <p className="hero-glass-caption-label">{item.captionLabel}</p>}
                    {item.captionSubtitle && <p className="hero-glass-caption-sub">{item.captionSubtitle}</p>}
                  </div>
                )}
                {(item.title || item.subtitle || item.badge || item.cta) && (
                  <div className="hero-full-overlay">
                    {item.badge && <span className="hero-eyebrow">{item.badge}</span>}
                    {item.title && <h1 className="hero-title">{item.title}</h1>}
                    {item.titleTa && <p className="hero-title-ta">{item.titleTa}</p>}
                    {item.subtitle && <p className="hero-subtitle">{item.subtitle}</p>}
                    {item.cta && (
                      <Link to={item.ctaUrl || '/products'} className="btn-primary inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 mt-2">
                        {item.cta} <ArrowRight size={18} />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={() => goToSlide(active - 1)} className="hero-nav-button hero-nav-prev" aria-label="Previous hero slide">
            <ChevronLeft size={20} />
          </button>
          <button type="button" onClick={() => goToSlide(active + 1)} className="hero-nav-button hero-nav-next" aria-label="Next hero slide">
            <ChevronRight size={20} />
          </button>
          <div className="hero-dots">
            {slides.map((_, i) => (
              <button key={i} type="button" onClick={() => goToSlide(i)} aria-label={`Show hero slide ${i + 1}`} className={`hero-dot ${i === active ? 'hero-dot-active' : ''}`} />
            ))}
          </div>
        </div>

        <div className="hero-mobile-shell md:hidden">
          <div className="hero-mobile-wrap" onTouchStart={handleTouchStart} onTouchEnd={(event) => handleTouchEnd(event, true)}>
            <div className="hero-track" style={{ transform: `translateX(-${mobileActive * 100}%)` }}>
              {slides.map(item => (
                <div key={item.id} className="hero-mobile-image">
                  <img src={item.portraitUrl || item.landscapeUrl} alt={item.captionLabel || item.title} />
                  {(item.captionLabel || item.captionSubtitle) && (
                    <div className="hero-glass-badge">
                      {item.captionLabel && <p className="hero-glass-caption-label">{item.captionLabel}</p>}
                      {item.captionSubtitle && <p className="hero-glass-caption-sub">{item.captionSubtitle}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="hero-dots hero-dots-mobile">
              {slides.map((_, i) => (
                <button key={i} type="button" onClick={() => goToMobile(i)} aria-label={`Show hero image ${i + 1}`} className={`hero-dot ${i === mobileActive ? 'hero-dot-active' : ''}`} />
              ))}
            </div>
          </div>

          {(mobileSlide.title || mobileSlide.subtitle || mobileSlide.badge || mobileSlide.cta) && (
            <div className="hero-mobile-text" key={`m-${mobileActive}`}>
              {mobileSlide.badge && <span className="hero-eyebrow">{mobileSlide.badge}</span>}
              {mobileSlide.title && <h1 className="hero-title">{mobileSlide.title}</h1>}
              {mobileSlide.subtitle && <p className="hero-subtitle">{mobileSlide.subtitle}</p>}
              {mobileSlide.cta && (
                <div className="flex gap-3 flex-wrap mt-1">
                  <Link to={mobileSlide.ctaUrl || '/products'} className="btn-primary flex items-center gap-2 px-5 py-3">
                    {mobileSlide.cta} <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryStrip({ categories }) {
  const fallbackCategories = [
    { id: 'sarees', label: 'Sarees', labelTa: 'சேலைகள்', img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80' },
    { id: 'readymade', label: 'Readymade', labelTa: 'ரெடிமேட்', img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80' },
    { id: 'javuli', label: 'Javuli', labelTa: 'ஜவுளி', img: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80' },
    { id: 'blouse', label: 'Blouse Material', labelTa: 'ரவிக்கை', img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80' },
  ];
  const cats = categories.length ? categories : fallbackCategories;

  return (
    <section className="py-12 bg-dillo-ivory">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="section-title">Shop By Category</h2>
          <div className="gold-divider" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cats.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className="group relative overflow-hidden aspect-[3/4] block"
            >
              <img
                src={cat.img}
                alt={cat.label}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-display font-bold text-white text-lg leading-tight">{cat.label}</h3>
                {cat.labelTa && <p className="font-body text-white/70 text-sm">{cat.labelTa}</p>}
                <span className="inline-flex items-center gap-1 mt-2 text-dillo-gold text-xs font-body 
                  font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 
                  transition-opacity duration-300">
                  Explore <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductGridFallback({ loading, emptyText }) {
  return (
    <div className="col-span-full bg-white/70 border border-gray-100 p-10 text-center">
      {loading ? (
        <LogoLoader size="sm" label="Loading products..." />
      ) : (
        <p className="font-body text-sm text-gray-400">{emptyText}</p>
      )}
    </div>
  );
}

function FeaturedProducts({ products, loading }) {
  const [tab, setTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'sarees', label: 'Sarees' },
    { id: 'readymade', label: 'Readymade' },
    { id: 'javuli', label: 'Javuli' },
  ];

  const filtered = tab === 'all' ? products : products.filter(p => p.category === tab);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
          <div>
            <h2 className="section-title">Featured Collection</h2>
            <div className="gold-divider mx-0 mt-3" />
          </div>
          <div className="flex gap-0 border border-gray-200 overflow-x-auto max-w-full">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-2 text-sm font-body font-semibold uppercase tracking-wide 
                  transition-colors border-r border-gray-200 last:border-0 whitespace-nowrap
                  ${tab === t.id ? 'bg-dillo-red text-white' : 'hover:bg-gray-50 text-gray-600'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filtered.length ? (
            filtered.map((p) => <ProductCard key={p.id} product={p} />)
          ) : (
            <ProductGridFallback loading={loading} emptyText="No featured products yet. Mark products as Featured in admin." />
          )}
        </div>

        <div className="text-center mt-10">
          <Link to="/products" className="btn-outline">
            View All Products <ChevronRight size={16} className="inline" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function BestsellerBanner({ products, loading }) {
  return (
    <section className="py-16 bg-dillo-charcoal bg-silk-pattern">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className="font-cinzel text-dillo-gold text-xs tracking-widest uppercase mb-3">Customer Favorites</p>
          <h2 className="section-title text-white">Best Sellers</h2>
          <div className="gold-divider" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.length ? (
            products.map((p, i) => (
              <Link
                key={p.id}
                to={`/products/${p.id}`}
                className="group bg-white/5 border border-white/10 hover:border-dillo-gold/40 
                  transition-all duration-300 overflow-hidden hover:bg-white/10"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-dillo-gold text-white text-xs font-bold px-2 py-1">
                    #{i + 1} Best
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs font-cinzel text-dillo-gold uppercase tracking-widest mb-1">{p.type}</p>
                  <h3 className="font-body font-semibold text-white text-sm line-clamp-2 group-hover:text-dillo-gold transition-colors">
                    {p.name}
                  </h3>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-display font-bold text-dillo-gold">{formatPrice(p.price)}</span>
                    <span className="text-xs text-white/50 flex items-center gap-1">
                      <Star size={11} className="fill-dillo-gold text-dillo-gold" /> {p.rating}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full bg-white/5 border border-white/10 p-10 text-center">
              {loading ? (
                <LogoLoader size="sm" label="Loading best sellers..." />
              ) : (
                <p className="font-body text-sm text-white/50">No best sellers yet. Mark products as Bestseller in admin.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const perks = [
    { icon: <Truck size={24} />, title: 'Free Shipping', desc: 'On orders above ₹2000' },
    { icon: <RefreshCw size={24} />, title: 'Easy Returns', desc: '7-day hassle-free return' },
    { icon: <Shield size={24} />, title: '100% Authentic', desc: 'Certified handloom products' },
    { icon: <Sparkles size={24} />, title: 'Quality Assured', desc: 'Direct from master weavers' },
  ];

  return (
    <section className="py-10 border-y border-dillo-gold/20 bg-dillo-cream">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {perks.map((p) => (
            <div key={p.title} className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left">
              <div className="w-12 h-12 bg-dillo-red/10 flex items-center justify-center text-dillo-red flex-shrink-0">
                {p.icon}
              </div>
              <div>
                <h4 className="font-body font-bold text-dillo-charcoal text-sm">{p.title}</h4>
                <p className="font-body text-xs text-gray-500 mt-0.5">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LiveShowTeaser() {
  return (
    <section className="py-16 bg-dillo-ivory">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-flex items-center gap-2 bg-red-100 text-dillo-red text-xs 
              font-cinzel tracking-widest uppercase px-3 py-1.5 mb-4">
              <span className="w-2 h-2 bg-dillo-red rounded-full animate-pulse" />
              Live Shopping
            </span>
            <h2 className="section-title mb-4">Watch & Shop Live!</h2>
            <p className="font-body text-gray-600 leading-relaxed mb-6">
              Join our live shows on YouTube and Instagram every week.
              Watch our curators showcase the latest arrivals, get exclusive live-only discounts,
              and order directly during the show.
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 bg-white border border-gray-100 p-4">
                <div className="w-10 h-10 bg-red-100 flex items-center justify-center text-dillo-red">
                  ▶
                </div>
                <div>
                  <p className="font-body font-semibold text-sm text-dillo-charcoal">YouTube Live</p>
                  <p className="text-xs text-gray-500">Every Saturday, 6 PM</p>
                </div>
                <span className="ml-auto text-xs bg-gray-100 px-2 py-1 text-gray-600">Upcoming</span>
              </div>
              <div className="flex items-center gap-3 bg-white border border-gray-100 p-4">
                <div className="w-10 h-10 bg-pink-100 flex items-center justify-center text-pink-600">
                  📷
                </div>
                <div>
                  <p className="font-body font-semibold text-sm text-dillo-charcoal">Instagram Live</p>
                  <p className="text-xs text-gray-500">Every Wednesday, 5 PM</p>
                </div>
                <span className="ml-auto text-xs bg-red-50 border border-red-200 px-2 py-1 text-dillo-red font-semibold animate-pulse">
                  🔴 LIVE
                </span>
              </div>
            </div>
            <Link to="/live-show" className="btn-primary flex items-center gap-2 w-fit">
              <Play size={16} /> Watch Live Shows
            </Link>
          </div>

          <div className="relative">
            <div className="aspect-video bg-dillo-charcoal overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=700&q=80"
                alt="Live Show"
                className="w-full h-full object-cover opacity-70"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-dillo-red/90 rounded-full flex items-center 
                  justify-center cursor-pointer hover:bg-dillo-red transition-colors animate-float">
                  <Play size={32} className="text-white ml-1" fill="white" />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-dillo-gold text-white p-4 shadow-lg">
              <p className="font-body font-bold text-lg leading-none">10,000+</p>
              <p className="font-body text-xs">Happy Customers</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NewArrivalsStrip({ products, loading }) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="font-cinzel text-dillo-gold text-xs tracking-widest uppercase mb-2">Just Arrived</p>
            <h2 className="section-title">New Arrivals</h2>
            <div className="gold-divider mx-0 mt-3" />
          </div>
          <Link to="/new-arrivals" className="text-dillo-red font-body font-semibold text-sm 
            flex items-center gap-1 hover:gap-2 transition-all uppercase tracking-wider">
            View All <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.length ? (
            products.map(p => <ProductCard key={p.id} product={p} />)
          ) : (
            <ProductGridFallback loading={loading} emptyText="No new arrivals yet. Mark products as New Arrival in admin." />
          )}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const reviews = [
    { name: 'Priya S.', city: 'Chennai', text: 'Best Kanjivaram sarees I have bought online. Quality matches exactly what is shown. Fast delivery too!' },
    { name: 'Kavitha R.', city: 'Coimbatore', text: 'Bought a Dharmavaram for my sister’s wedding. The zari work is breathtaking. Will definitely shop again!' },
    { name: 'Anitha M.', city: 'Madurai', text: 'Excellent collection and very good customer service. The live shows are super helpful for choosing designs.' },
    { name: 'Sundari K.', city: 'Salem', text: 'Love Dillo! Local brand with national quality. The cost-to-cost sale prices are unbeatable.' },
  ];

  return (
    <section className="py-16 bg-dillo-cream pattern-silk">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="font-cinzel text-dillo-gold text-xs tracking-widest uppercase mb-3">What Our Customers Say</p>
          <h2 className="section-title">Loved Across Tamil Nadu</h2>
          <div className="gold-divider" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((r) => (
            <div key={r.name} className="bg-white p-6 border border-dillo-gold/20 relative">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={14} className="fill-dillo-gold text-dillo-gold" />
                ))}
              </div>
              <p className="font-body text-gray-600 text-sm leading-relaxed mb-4">"{r.text}"</p>
              <div>
                <p className="font-body font-bold text-sm text-dillo-charcoal">{r.name}</p>
                <p className="font-body text-xs text-gray-400">{r.city}</p>
              </div>
              <div className="absolute top-4 right-4 text-4xl text-dillo-gold/10 font-display font-bold">"</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const { featured, bestsellers, newArrivals, categories, loading, error } = useHomeProducts();

  return (
    <div>
      <DynamicHeroBanner />
      <TrustBar />
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 font-body text-sm">
            {error}
          </div>
        </div>
      )}
      <CategoryStrip categories={categories} />
      <FeaturedProducts products={featured} loading={loading} />
      <BestsellerBanner products={bestsellers} loading={loading} />
      <NewArrivalsStrip products={newArrivals} loading={loading} />
      <LiveShowTeaser />
      <Testimonials />
    </div>
  );
}
