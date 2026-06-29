import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, SlidersHorizontal, ChevronRight, Search } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { LogoLoader } from '../components/Preloader';
import { apiFetch, toQuery } from '../api';
import {
  sareeTypes as fallbackSareeTypes,
  occasions as fallbackOccasions,
} from '../products.js';
import { FilterPanel } from './ProductsPage';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80';
const DEFAULT_MAX_PRICE = 100000;

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

function normalizeCategory(category) {
  return {
    id: category.slug || String(category.id),
    name: category.name,
    count: category.count || 0,
  };
}

export default function NewArrivalsPage() {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [occasionOptions, setOccasionOptions] = useState(fallbackOccasions.map(o => ({ id: o, name: o })));
  const [sareeTypeOptions, setSareeTypeOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Same filter shape as ProductsPage.jsx / CostToCostPage.jsx
  const [filters, setFilters] = useState({
    category: [], type: [], occasion: [], color: [],
    priceMin: 0, priceMax: DEFAULT_MAX_PRICE, inStockOnly: false,
  });
  const stableSetFilters = useCallback(setFilters, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    Promise.all([
      apiFetch(`/sarees/${toQuery({ page_size: 100, new: true, ordering: '-created_at' })}`),
      apiFetch('/saree-categories/?page_size=100'),
      apiFetch('/occasion-categories/?page_size=100'),
      apiFetch('/saree-type-options/?page_size=100&is_active=true'),
    ])
      .then(([productPayload, categoryPayload, occasionPayload, sareeTypePayload]) => {
        if (!mounted) return;

        const normalizedProducts = getResults(productPayload).map(normalizeProduct);
        setProducts(normalizedProducts);

        const apiCategories = getResults(categoryPayload)
          .filter(c => c.is_active ?? true)
          .map(normalizeCategory);
        setCategoryOptions(apiCategories);

        const apiOccasions = getResults(occasionPayload)
          .filter(o => o.is_active ?? true)
          .map(o => ({ id: o.slug || o.name, name: o.name }));
        if (apiOccasions.length) setOccasionOptions(apiOccasions);

        const apiSareeTypes = getResults(sareeTypePayload)
          .filter(t => t.is_active ?? true)
          .map(t => t.name)
          .filter(Boolean);
        if (apiSareeTypes.length) setSareeTypeOptions(apiSareeTypes);
      })
      .catch(err => {
        console.error(err);
        if (mounted) setError(err.message || 'Could not load new arrivals');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const typeOptions = useMemo(() => {
    const fromProducts = products.map(p => p.type).filter(Boolean);
    return Array.from(new Set([...sareeTypeOptions, ...fromProducts, ...fallbackSareeTypes]));
  }, [products, sareeTypeOptions]);

  const filtered = useMemo(() => {
    let result = [...products];

    if (filters.category?.length) result = result.filter(p => filters.category.includes(p.category));
    if (filters.type?.length) result = result.filter(p => filters.type.includes(p.type));
    if (filters.occasion?.length) result = result.filter(p =>
      filters.occasion.includes(p.occasion) || filters.occasion.includes(p.occasionName)
    );
    if (filters.color?.length) result = result.filter(p =>
      p.colors?.some(c => filters.color.includes(c))
    );
    result = result.filter(p => p.price >= filters.priceMin && p.price <= filters.priceMax);
    if (filters.inStockOnly) result = result.filter(p => p.inStock);

    return result;
  }, [products, filters]);

  const drops = useMemo(() => ([
    {
      week: 'This Week',
      date: 'Latest backend products',
      badge: '🔥 Just Dropped',
      badgeClass: 'bg-dillo-red',
      items: filtered.slice(0, 4),
    },
    {
      week: 'Recent',
      date: 'More fresh arrivals',
      badge: '✨ Recent',
      badgeClass: 'bg-dillo-gold',
      items: filtered.slice(4, 8),
    },
  ]), [filtered]);

  const clearAllFilters = () => setFilters({
    category: [], type: [], occasion: [], color: [],
    priceMin: 0, priceMax: DEFAULT_MAX_PRICE, inStockOnly: false,
  });

  return (
    <div className="bg-dillo-ivory min-h-screen">
      <div className="relative bg-dillo-charcoal overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1400&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dillo-charcoal via-dillo-charcoal/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-dillo-gold via-dillo-red to-dillo-gold" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-24">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles size={20} className="text-dillo-gold animate-float" />
            <span className="font-cinzel text-dillo-gold text-sm tracking-[0.3em] uppercase">
              Fresh Collection
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-white leading-tight mb-3">
            New Arrivals
          </h1>
          <p className="font-body text-white/50 text-lg mb-2 font-light tracking-wider">
            புதிய வரவுகள்
          </p>
          <p className="font-body text-white/70 text-lg max-w-xl leading-relaxed mb-8">
            Discover the latest products added from your backend catalogue.
          </p>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2 text-dillo-gold">
              <div className="w-2 h-2 rounded-full bg-dillo-gold animate-pulse" />
              <span className="font-body text-sm font-semibold tracking-wide">Synced from backend</span>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <span className="font-body text-sm">{loading ? 'Loading...' : `${products.length} new pieces`}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-dillo-red py-3 overflow-hidden">
        <div className="ticker-wrap">
          <div className="ticker-content font-cinzel text-white text-xs tracking-[0.25em] uppercase">
            {Array(6).fill('✦ New Arrivals  ✦ Fresh From Backend  ✦ Exclusive Pieces  ✦ Limited Stock  ').join('')}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 mb-6 font-body text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Shared FilterPanel — same component & filter shape as ProductsPage.jsx */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <FilterPanel
              filters={filters}
              setFilters={stableSetFilters}
              categories={categoryOptions}
              typeOptions={typeOptions}
              occasionOptions={occasionOptions}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-6 bg-white border border-gray-100 px-4 py-3">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 text-sm font-body font-semibold
                  text-dillo-charcoal border border-gray-200 px-3 py-2 hover:border-dillo-red"
              >
                <SlidersHorizontal size={16} /> Filters
              </button>
              <p className="text-sm font-body text-gray-500">
                <span className="font-semibold text-dillo-charcoal">{loading ? '—' : filtered.length}</span>{' '}
                {loading ? 'Loading new arrivals...' : 'new pieces'}
              </p>
            </div>

            {loading ? (
              <div className="bg-white border border-gray-100 p-12">
                <LogoLoader size="md" label="Loading new arrivals..." />
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white border border-gray-100 p-16 text-center">
                <Search size={42} className="text-gray-200 mx-auto mb-4" />
                <h3 className="font-display text-xl font-bold text-gray-400 mb-2">No new arrivals found</h3>
                <p className="font-body text-sm text-gray-400 mb-6">
                  Try adjusting your filters, or mark products as “New Arrival” in admin.
                </p>
                <button onClick={clearAllFilters} className="btn-outline text-sm">
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-16">
                {drops.map((drop, index) => {
                  if (drop.items.length === 0) return null;
                  return (
                    <section key={drop.week}>
                      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`${drop.badgeClass} text-white text-xs font-bold px-3 py-1 tracking-wide uppercase`}>
                              {drop.badge}
                            </span>
                          </div>
                          <h2 className="font-display text-2xl md:text-3xl font-bold text-dillo-charcoal">{drop.week}</h2>
                          <p className="font-body text-sm text-gray-400 mt-1">{drop.date}</p>
                        </div>
                        {index === 0 && (
                          <Link
                            to="/products?filter=new"
                            className="flex items-center gap-2 text-dillo-red font-body font-semibold text-sm hover:gap-3 transition-all"
                          >
                            View all <ArrowRight size={16} />
                          </Link>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {drop.items.map(product => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-dillo-charcoal to-dillo-navy rounded-none p-8 md:p-12 text-center relative overflow-hidden mt-16">
          <div className="pattern-silk absolute inset-0" />
          <div className="relative z-10">
            <Sparkles size={32} className="text-dillo-gold mx-auto mb-4 animate-float" />
            <h3 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
              Never Miss a Drop
            </h3>
            <p className="font-body text-white/70 mb-6 max-w-md mx-auto">
              Be the first to know about new arrivals, exclusive collections, and limited-edition sarees.
            </p>
            <div className="flex flex-col sm:flex-row gap-0 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 text-sm font-body focus:outline-none bg-white text-dillo-charcoal"
              />
              <button className="btn-primary whitespace-nowrap">
                Notify Me
              </button>
            </div>
            <p className="text-white/40 text-xs font-body mt-3">Join saree lovers. Unsubscribe anytime.</p>
          </div>
        </div>

        <div className="text-center pb-4 pt-10">
          <p className="font-body text-gray-500 mb-4">Looking for more? Explore our complete collection.</p>
          <Link to="/products" className="btn-outline inline-flex items-center gap-2">
            Browse All Products <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {mobileFiltersOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setMobileFiltersOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-80 max-w-[90vw] bg-white z-[60]
            overflow-y-auto animate-slide-in-left shadow-2xl p-5">
            <FilterPanel
              filters={filters}
              setFilters={stableSetFilters}
              categories={categoryOptions}
              typeOptions={typeOptions}
              occasionOptions={occasionOptions}
              isMobile
              onClose={() => setMobileFiltersOpen(false)}
            />
            <button onClick={() => setMobileFiltersOpen(false)}
              className="btn-primary w-full mt-6">
              Show {filtered.length} Results
            </button>
          </div>
        </>
      )}
    </div>
  );
}