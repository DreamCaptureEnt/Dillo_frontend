import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag, Flame, Clock, ChevronRight, Star, Shield, Truck, ArrowRight,
  RefreshCw, AlertCircle, PackageOpen, SlidersHorizontal,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { LogoLoader } from '../components/Preloader';
import { apiFetch, toQuery } from '../api';
import { formatPrice } from '../products.js';
import { FilterPanel } from './ProductsPage';

/*
 * ──────────────────────────────────────────────────────────────────────────
 * ASSUMPTIONS — adjust these two spots if your API differs:
 *
 * 1. SALE_PRODUCTS_ENDPOINT — assumed to be the same `/sarees/` list endpoint
 *    the admin dashboard uses (see AdminDashboardPage.jsx -> usePagedResource).
 *    We ask for active products sorted by discount and filter client-side
 *    for discount >= 15, since we don't know if the backend supports a
 *    `min_discount` query param. If it does, just pass it in the params
 *    below and drop the client-side filter for a lighter payload.
 *
 * 2. COUPONS_ENDPOINT — there's no "Coupons" tab in the admin dashboard you
 *    shared, so I couldn't confirm a real coupons endpoint exists. This page
 *    TRIES `/coupons/` first; if that request fails (404, etc.) it falls
 *    back to a small static list so the section doesn't just disappear.
 *    Once you add real coupon management, this will pick it up automatically
 *    — no code changes needed.
 *
 * 3. FILTERING — now reuses the exact same `FilterPanel` component and
 *    `filters` state shape (category/type/occasion/color/price/inStockOnly)
 *    as ProductsPage.jsx, so behavior matches the main catalog page exactly.
 *    The "Mega Sale" / "Clearance" quick buttons are kept as a sale-specific
 *    shortcut on top of (not instead of) the shared filters.
 * ──────────────────────────────────────────────────────────────────────────
 */

const SALE_PRODUCTS_ENDPOINT = '/sarees/';
const COUPONS_ENDPOINT = '/coupons/';
const MIN_SALE_DISCOUNT = 15;
const AUTO_REFRESH_MS = 60_000; // poll every 60s for "real-time" pricing/stock
const DEFAULT_MAX_PRICE = 100000;

const FALLBACK_COUPONS = [
  { code: 'DILLO10', desc: '10% off on orders above ₹2,000', type: '% off' },
  { code: 'DILLO200', desc: '₹200 off on orders above ₹3,000', type: 'flat' },
  { code: 'SILK500', desc: '₹500 off on silk sarees above ₹8,000', type: 'flat' },
  { code: 'FESTIVAL20', desc: '20% off during festival season (min ₹5,000)', type: '% off' },
];

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80';

const dealDefs = [
  {
    key: 'mega',
    label: 'Mega Sale',
    desc: 'Best sarees at unbeatable cost-to-cost prices',
    icon: Flame,
    iconColor: 'text-dillo-red',
    bg: 'bg-dillo-red/10 border-dillo-red/30',
    test: (p) => p.discount >= 20,
    badge: '20%+ Off',
    badgeBg: 'bg-dillo-red',
  },
  {
    key: 'clearance',
    label: 'Clearance',
    desc: 'End of season stock clearing — prices slashed',
    icon: Tag,
    iconColor: 'text-dillo-gold',
    bg: 'bg-dillo-gold/10 border-dillo-gold/30',
    test: (p) => p.discount >= MIN_SALE_DISCOUNT && p.discount < 20,
    badge: '15–19% Off',
    badgeBg: 'bg-dillo-gold',
  },
];

const whyBuy = [
  { icon: Shield, title: 'Purity Guaranteed', desc: 'Certified authentic silk — every saree tested and tagged', color: 'text-dillo-red' },
  { icon: Truck, title: 'Free Shipping ₹2000+', desc: 'Delivered to your doorstep anywhere in India', color: 'text-blue-600' },
  { icon: Star, title: 'Weaver Direct', desc: 'No middlemen — direct from looms to your wardrobe', color: 'text-dillo-gold' },
];

// ─── Normalize a backend saree record into the shape ProductCard/FilterPanel expect ──
function normalizeProduct(p) {
  const price = Number(p.price ?? 0);
  const originalPrice = Number(p.original_price ?? p.originalPrice ?? price);
  const discount = Number(
    p.discount ??
    (originalPrice > price && originalPrice > 0
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0)
  );
  const stockCount = Number(p.stock_count ?? p.stockCount ?? 0);
  const images = Array.isArray(p.images) && p.images.length > 0 ? p.images : [PLACEHOLDER_IMAGE];

  return {
    id: p.slug || String(p.id),
    backendId: p.id,
    slug: p.slug,
    name: p.name,
    nameTa: p.name_ta ?? p.nameTa ?? '',
    category: p.category_slug || p.categorySlug || String(p.category || ''),
    categoryName: p.category_name || p.categoryName || '',
    type: p.saree_type ?? p.type ?? '',
    occasion: p.occasion_slug || p.occasionSlug || p.occasion_name || p.occasion || '',
    occasionName: p.occasion_name ?? p.occasionName ?? '',
    price,
    originalPrice,
    discount,
    colors: Array.isArray(p.colors) ? p.colors : [],
    images,
    description: p.description ?? '',
    isNew: Boolean(p.is_new ?? p.isNew),
    isFeatured: Boolean(p.is_featured ?? p.isFeatured),
    isBestseller: Boolean(p.is_bestseller ?? p.isBestseller),
    inStock: stockCount > 0 && (p.is_active ?? true),
    stockCount,
    rating: Number(p.rating ?? 0),
    reviewCount: Number(p.review_count ?? p.reviewCount ?? 0),
    tags: Array.isArray(p.tags) ? p.tags : [],
  };
}

// ─── Data hook: fetches live sale products, supports manual + auto refresh ──
function useSaleProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const mountedRef = useRef(true);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const query = toQuery({ page_size: 200, ordering: '-discount', is_active: true });
      const data = await apiFetch(`${SALE_PRODUCTS_ENDPOINT}${query}`);
      const raw = Array.isArray(data) ? data : (data.results || []);
      const onSale = raw
        .map(normalizeProduct)
        .filter((p) => p.discount >= MIN_SALE_DISCOUNT)
        .sort((a, b) => b.discount - a.discount);

      if (!mountedRef.current) return;
      setProducts(onSale);
      setLastUpdated(new Date());
    } catch (err) {
      if (!mountedRef.current) return;
      console.error(err);
      setError(err.message || 'Could not load sale products right now.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    const interval = setInterval(() => load({ silent: true }), AUTO_REFRESH_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { products, loading, error, lastUpdated, reload: () => load() };
}

// ─── Data hook: live coupons, with graceful static fallback ─────────────────
function useCoupons() {
  const [coupons, setCoupons] = useState(FALLBACK_COUPONS);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let mounted = true;
    apiFetch(`${COUPONS_ENDPOINT}${toQuery({ is_active: true, page_size: 50 })}`)
      .then((data) => {
        if (!mounted) return;
        const raw = Array.isArray(data) ? data : (data.results || []);
        if (raw.length === 0) return; // keep fallback if backend has none configured
        const mapped = raw.map((c) => ({
          code: c.code,
          desc: c.description ?? c.desc ?? '',
          type: (c.discount_type ?? c.type) === 'flat' ? 'flat' : '% off',
        }));
        setCoupons(mapped);
        setIsLive(true);
      })
      .catch(() => {
        // No coupons endpoint yet — silently keep the static fallback list.
      });
    return () => { mounted = false; };
  }, []);

  return { coupons, isLive };
}

function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.round(seconds / 60);
  return `${mins} min${mins > 1 ? 's' : ''} ago`;
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-gray-100 animate-pulse">
      <div className="aspect-[3/4] bg-gray-100" />
      <div className="p-4 space-y-2">
        <div className="h-2.5 bg-gray-100 w-1/3" />
        <div className="h-3.5 bg-gray-100 w-4/5" />
        <div className="h-3.5 bg-gray-100 w-2/5 mt-3" />
      </div>
    </div>
  );
}

export default function CostToCostPage() {
  const { products: saleProducts, loading, error, lastUpdated, reload } = useSaleProducts();
  const { coupons } = useCoupons();
  const [dealFilter, setDealFilter] = useState('all');
  const [copiedCode, setCopiedCode] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Same filter shape as ProductsPage.jsx, applied on top of the sale-only dataset
  const [filters, setFilters] = useState({
    category: [], type: [], occasion: [], color: [],
    priceMin: 0, priceMax: DEFAULT_MAX_PRICE, inStockOnly: false,
  });
  const stableSetFilters = useCallback(setFilters, []);

  // Derive filter option lists from the live sale products (mirrors ProductsPage)
  const categoryOptions = useMemo(() => {
    const map = new Map();
    saleProducts.forEach(p => {
      if (!p.category) return;
      const key = p.category;
      const entry = map.get(key) || { id: key, name: p.categoryName || p.category, count: 0 };
      entry.count += 1;
      map.set(key, entry);
    });
    return Array.from(map.values());
  }, [saleProducts]);

  const typeOptions = useMemo(() => {
    return Array.from(new Set(saleProducts.map(p => p.type).filter(Boolean)));
  }, [saleProducts]);

  const occasionOptions = useMemo(() => {
    const map = new Map();
    saleProducts.forEach(p => {
      const key = p.occasion || p.occasionName;
      if (!key) return;
      if (!map.has(key)) map.set(key, { id: key, name: p.occasionName || p.occasion });
    });
    return Array.from(map.values());
  }, [saleProducts]);

  const filteredProducts = useMemo(() => {
    let result = [...saleProducts];

    // Sale-specific quick filter (Mega Sale / Clearance)
    if (dealFilter !== 'all') {
      const def = dealDefs.find((d) => d.key === dealFilter);
      if (def) result = result.filter(def.test);
    }

    // Shared filter logic from ProductsPage
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
  }, [saleProducts, dealFilter, filters]);

  const dealCounts = useMemo(
    () => dealDefs.map((d) => ({ ...d, count: saleProducts.filter(d.test).length })),
    [saleProducts]
  );

  const maxDiscount = useMemo(
    () => saleProducts.reduce((max, p) => Math.max(max, p.discount), 0),
    [saleProducts]
  );

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const clearAllFilters = () => setFilters({
    category: [], type: [], occasion: [], color: [],
    priceMin: 0, priceMax: DEFAULT_MAX_PRICE, inStockOnly: false,
  });

  return (
    <div className="bg-dillo-ivory min-h-screen">

      {/* Hero */}
      <div className="relative bg-dillo-charcoal overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1400&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dillo-charcoal via-dillo-charcoal/85 to-dillo-red/30" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-dillo-gold via-dillo-red to-dillo-gold" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-24">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-2 bg-dillo-red px-3 py-1.5">
              <Flame size={14} className="text-white" />
              <span className="font-cinzel text-white text-xs font-bold tracking-widest">MEGA SALE</span>
            </div>
            <span className="font-body text-white/50 text-sm">Limited time offers</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-white leading-tight mb-3">
            Cost to Cost Sale
          </h1>
          <p className="font-body text-dillo-gold text-xl mb-2 tracking-wider">விலை குறைப்பு விற்பனை</p>
          <p className="font-body text-white/70 text-lg max-w-2xl leading-relaxed mb-8">
            We pass the savings directly to you. No markups, no middlemen — authentic silk sarees and handloom fabrics at what we actually paid for them.
          </p>

          <div className="grid grid-cols-3 gap-6 max-w-md mb-10">
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-dillo-gold">
                {loading ? '—' : maxDiscount > 0 ? `${maxDiscount}%` : '—'}
              </div>
              <div className="font-body text-white/60 text-xs mt-0.5">max discount</div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-dillo-gold">
                {loading ? '—' : saleProducts.length}
              </div>
              <div className="font-body text-white/60 text-xs mt-0.5">items on sale</div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-dillo-gold">Live</div>
              <div className="font-body text-white/60 text-xs mt-0.5">
                {lastUpdated ? `updated ${timeAgo(lastUpdated)}` : 'pricing'}
              </div>
            </div>
          </div>

          <Link to="#sale-products" className="btn-primary inline-flex items-center gap-2">
            Shop the Sale <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Ticker */}
      <div className="bg-dillo-red py-3 overflow-hidden">
        <div className="ticker-wrap">
          <div className="ticker-content font-cinzel text-white text-xs tracking-[0.25em] uppercase">
            {Array(5).fill('✦ Cost-to-Cost Sale  ✦ Weaver Direct Prices  ✦ Limited Stock  ✦ Free Shipping ₹2000+  ✦ Authentic Handloom  ').join('')}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-14">

        {/* Deal Categories */}
        <section className="grid md:grid-cols-2 gap-6">
          {dealCounts.map((deal) => {
            const Icon = deal.icon;
            const isActive = dealFilter === deal.key;
            return (
              <button
                key={deal.key}
                onClick={() => setDealFilter(isActive ? 'all' : deal.key)}
                disabled={loading}
                className={`border-2 p-6 text-left transition-all duration-200 ${deal.bg} hover:shadow-md disabled:opacity-60`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-white flex items-center justify-center shadow-sm">
                    <Icon size={24} className={deal.iconColor} />
                  </div>
                  <span className={`${deal.badgeBg} text-white text-xs font-bold px-3 py-1`}>
                    {deal.badge}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-dillo-charcoal mb-1">{deal.label}</h3>
                <p className="font-body text-sm text-gray-500 mb-3">{deal.desc}</p>
                <p className="font-body text-sm font-semibold text-dillo-red">
                  {loading ? 'Loading…' : `${deal.count} products →`}
                </p>
              </button>
            );
          })}
        </section>

        {/* Coupon Codes */}
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <span className="font-cinzel text-dillo-gold text-xs tracking-[0.25em] uppercase">Save more</span>
              <h2 className="font-display text-2xl font-bold text-dillo-charcoal mt-1">Apply Coupon Codes</h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {coupons.map((c) => (
              <div
                key={c.code}
                className="bg-white border-2 border-dashed border-dillo-gold/40 p-4 hover:border-dillo-gold transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-cinzel text-dillo-red font-bold text-lg tracking-wider">{c.code}</span>
                  <span className="bg-dillo-cream text-dillo-gold text-xs font-bold px-2 py-0.5 border border-dillo-gold/30">
                    {c.type}
                  </span>
                </div>
                <p className="font-body text-xs text-gray-500 mb-3 leading-relaxed">{c.desc}</p>
                <button
                  onClick={() => handleCopy(c.code)}
                  className={`w-full py-2 text-xs font-body font-semibold tracking-wide uppercase border transition-all ${
                    copiedCode === c.code
                      ? 'bg-green-50 border-green-400 text-green-600'
                      : 'border-dillo-red text-dillo-red hover:bg-dillo-red hover:text-white'
                  }`}
                >
                  {copiedCode === c.code ? '✓ Copied!' : 'Copy Code'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Sale Products — filters + grid, same layout pattern as ProductsPage */}
        <section id="sale-products">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <span className="font-cinzel text-dillo-gold text-xs tracking-[0.25em] uppercase">Sale Items</span>
              <h2 className="font-display text-3xl font-bold text-dillo-charcoal mt-1">
                {dealFilter === 'all' ? 'All Sale Products' : dealDefs.find(d => d.key === dealFilter)?.label}
                {!loading && (
                  <span className="text-lg text-gray-400 font-normal ml-3">({filteredProducts.length})</span>
                )}
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[['all', 'All'], ...dealDefs.map(d => [d.key, d.badge])].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setDealFilter(val)}
                  disabled={loading}
                  className={`px-4 py-2 text-xs font-body font-semibold border transition-all disabled:opacity-50 ${
                    dealFilter === val
                      ? 'bg-dillo-red text-white border-dillo-red'
                      : 'border-gray-200 text-gray-600 hover:border-dillo-red hover:text-dillo-red'
                  }`}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={reload}
                disabled={loading}
                title="Refresh sale prices"
                className="px-3 py-2 border border-gray-200 text-gray-500 hover:border-dillo-red hover:text-dillo-red transition-all disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6">
              <AlertCircle size={18} className="shrink-0" />
              <p className="font-body text-sm flex-1">{error}</p>
              <button onClick={reload} className="font-body text-sm font-semibold underline shrink-0">Retry</button>
            </div>
          )}

          <div className="flex gap-8">
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
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 text-sm font-body font-semibold
                    text-dillo-charcoal border border-gray-200 px-3 py-2 hover:border-dillo-red"
                >
                  <SlidersHorizontal size={16} /> Filters
                </button>
              </div>

              {loading ? (
                <div className="space-y-6">
                  <LogoLoader size="sm" label="Loading sale items..." />
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
                  </div>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white border border-gray-100">
                  <PackageOpen size={36} className="mx-auto mb-3 text-gray-300" />
                  <p className="font-body text-gray-400 text-lg">
                    {error ? 'Unable to load sale items.' : 'No products match your filters right now.'}
                  </p>
                  {!error && (
                    <button
                      onClick={() => { setDealFilter('all'); clearAllFilters(); }}
                      className="btn-primary mt-4"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Why buy from us */}
        <section className="bg-dillo-charcoal py-12 px-8 md:px-12">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white">Why Shop the Sale?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {whyBuy.map((w, i) => {
              const Icon = w.icon;
              return (
                <div key={i} className="text-center">
                  <div className="w-14 h-14 bg-white/10 flex items-center justify-center mx-auto mb-4">
                    <Icon size={26} className={w.color} />
                  </div>
                  <h3 className="font-display text-lg font-bold text-white mb-2">{w.title}</h3>
                  <p className="font-body text-white/60 text-sm leading-relaxed">{w.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Browse more */}
        <div className="text-center pb-4">
          <p className="font-body text-gray-500 mb-4">Want to explore our full catalog?</p>
          <Link to="/products" className="btn-outline inline-flex items-center gap-2">
            Browse All Collections <ChevronRight size={16} />
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
              Show {filteredProducts.length} Results
            </button>
          </div>
        </>
      )}
    </div>
  );
}