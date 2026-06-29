import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  SlidersHorizontal, Grid3X3, List, X, ChevronDown, ChevronUp, Search
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { LogoLoader } from '../components/Preloader';
import { apiFetch, toQuery } from '../api';
import {
  sareeTypes as fallbackSareeTypes,
  occasions as fallbackOccasions,
  colors,
  categories as fallbackCategories,
  formatPrice
} from '../products.js';

const DEFAULT_MAX_PRICE = 100000;
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
    productCode: product.product_code || product.productCode || '',
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

export const FilterPanel = memo(function FilterPanel({
  filters,
  setFilters,
  categories,
  typeOptions,
  occasionOptions,
  onClose,
  isMobile = false,
}) {
  const [openSections, setOpenSections] = useState([]);

  const toggle = useCallback((sec) =>
    setOpenSections(s => s.includes(sec) ? s.filter(x => x !== sec) : [...s, sec]),
  []);

  const toggleFilter = useCallback((key, value) => {
    setFilters(f => {
      const arr = f[key] || [];
      return {
        ...f,
        [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      };
    });
  }, [setFilters]);

  const clearAll = useCallback(() => setFilters({
    category: [], type: [], occasion: [], color: [],
    priceMin: 0, priceMax: DEFAULT_MAX_PRICE, inStockOnly: false,
  }), [setFilters]);

  const hasFilters = (filters.category?.length || 0) + (filters.type?.length || 0) +
    (filters.occasion?.length || 0) + (filters.color?.length || 0) > 0 ||
    filters.inStockOnly ||
    filters.priceMin > 0 ||
    filters.priceMax < DEFAULT_MAX_PRICE;
  const pricePercent = Math.min(100, Math.max(0, ((filters.priceMax || DEFAULT_MAX_PRICE) / DEFAULT_MAX_PRICE) * 100));

  const Section = useCallback(({ id, label, children }) => (
    <div className="border-b border-gray-100 py-4">
      <button
        onClick={() => toggle(id)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="font-body font-semibold text-sm uppercase tracking-wider text-dillo-charcoal">
          {label}
        </span>
        {openSections.includes(id)
          ? <ChevronUp size={16} className="text-gray-400" />
          : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {openSections.includes(id) && (
        <div className="mt-3">{children}</div>
      )}
    </div>
  ), [openSections, toggle]);

  return (
    <div className={`${isMobile ? '' : 'sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto'} bg-white border border-gray-100 p-5`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display font-bold text-lg text-dillo-charcoal">Filters</h3>
        <div className="flex gap-2">
          {hasFilters && (
            <button onClick={clearAll}
              className="text-xs text-dillo-red font-body hover:underline">
              Clear All
            </button>
          )}
          {isMobile && (
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-dillo-red">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {hasFilters && (
        <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-gray-100">
          {[...(filters.category || []), ...(filters.type || []), ...(filters.occasion || []), ...(filters.color || [])].map(f => (
            <span key={f} className="flex items-center gap-1 bg-dillo-red/10 text-dillo-red
              text-xs px-2 py-1 font-body">
              {f}
              <button onClick={() => {
                for (const key of ['category', 'type', 'occasion', 'color']) {
                  if ((filters[key] || []).includes(f)) {
                    toggleFilter(key, f);
                    break;
                  }
                }
              }}><X size={10} /></button>
            </span>
          ))}
        </div>
      )}

      <Section id="category" label="Category">
        <div className="space-y-2">
          {categories.map(c => (
            <label key={c.id} className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2">
                <input type="checkbox"
                  checked={(filters.category || []).includes(c.id)}
                  onChange={() => toggleFilter('category', c.id)}
                  className="accent-dillo-red w-4 h-4"
                />
                <span className="font-body text-sm text-gray-700 group-hover:text-dillo-red transition-colors">
                  {c.name}
                </span>
              </div>
              {c.count > 0 && <span className="text-xs text-gray-400">({c.count})</span>}
            </label>
          ))}
        </div>
      </Section>

      <Section id="price" label="Price Range">
        <div className="space-y-3">
          <div className="flex justify-between text-sm font-body text-gray-600">
            <span>{formatPrice(filters.priceMin || 0)}</span>
            <span>{formatPrice(filters.priceMax || DEFAULT_MAX_PRICE)}</span>
          </div>
          <input
            type="range"
            min={0} max={DEFAULT_MAX_PRICE} step={500}
            value={filters.priceMax || DEFAULT_MAX_PRICE}
            onChange={e => setFilters(f => ({ ...f, priceMax: +e.target.value }))}
            className="range-slider w-full"
            style={{ '--range-progress': `${pricePercent}%` }}
          />
          <div className="grid grid-cols-2 gap-2">
            {[[0, 3000], [3000, 8000], [8000, 15000], [15000, 25000], [25000, DEFAULT_MAX_PRICE]].map(([min, max]) => (
              <button
                key={`${min}-${max}`}
                onClick={() => setFilters(f => ({ ...f, priceMin: min, priceMax: max }))}
                className={`text-xs px-2 py-1.5 border font-body transition-colors
                  ${filters.priceMin === min && filters.priceMax === max
                    ? 'bg-dillo-red text-white border-dillo-red'
                    : 'border-gray-200 hover:border-dillo-red hover:text-dillo-red'}`}
              >
                {min === 0 ? 'Under ₹3k' : max === DEFAULT_MAX_PRICE ? '₹25k+' : `₹${min / 1000}k - ₹${max / 1000}k`}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section id="type" label="Saree Type">
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {typeOptions.map(t => (
            <label key={t} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox"
                checked={(filters.type || []).includes(t)}
                onChange={() => toggleFilter('type', t)}
                className="accent-dillo-red w-4 h-4"
              />
              <span className="font-body text-sm text-gray-700 group-hover:text-dillo-red transition-colors">
                {t}
              </span>
            </label>
          ))}
        </div>
      </Section>

      <Section id="occasion" label="Occasion">
        <div className="flex flex-wrap gap-2">
          {occasionOptions.map(o => (
            <button
              key={o.id}
              onClick={() => toggleFilter('occasion', o.id)}
              className={`text-xs px-3 py-1.5 border font-body transition-colors
                ${(filters.occasion || []).includes(o.id)
                  ? 'bg-dillo-red text-white border-dillo-red'
                  : 'border-gray-200 hover:border-dillo-red hover:text-dillo-red text-gray-600'}`}
            >
              {o.name}
            </button>
          ))}
        </div>
      </Section>

      <Section id="color" label="Color">
        <div className="flex flex-wrap gap-2">
          {colors.map(c => (
            <button
              key={c.name}
              onClick={() => toggleFilter('color', c.name)}
              title={c.name}
              className={`w-7 h-7 transition-all duration-200 relative
                ${(filters.color || []).includes(c.name)
                  ? 'ring-2 ring-dillo-red ring-offset-2 scale-110'
                  : 'hover:scale-110 hover:ring-1 hover:ring-gray-300 hover:ring-offset-1'}`}
              style={{ backgroundColor: c.hex }}
            >
              {(filters.color || []).includes(c.name) && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full" />
                </span>
              )}
            </button>
          ))}
        </div>
      </Section>

      <div className="pt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.inStockOnly || false}
            onChange={e => setFilters(f => ({ ...f, inStockOnly: e.target.checked }))}
            className="accent-dillo-red w-4 h-4"
          />
          <span className="font-body text-sm font-semibold text-gray-700">In Stock Only</span>
        </label>
      </div>
    </div>
  );
});

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [view, setView] = useState('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState(fallbackCategories.map(c => ({ id: c.id, name: c.name, count: c.count })));
  const [occasionOptions, setOccasionOptions] = useState(fallbackOccasions.map(o => ({ id: o, name: o })));
  const [sareeTypeOptions, setSareeTypeOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState(() => {
    const cat = searchParams.get('category');
    const type = searchParams.get('type');
    const occ = searchParams.get('occasion');
    const filter = searchParams.get('filter');
    if (filter === 'bestseller') setSortBy('bestseller');
    if (filter === 'new') setSortBy('newest');
    return {
      category: cat ? [cat] : [],
      type: type ? [type] : [],
      occasion: occ ? [occ] : [],
      color: [],
      priceMin: 0,
      priceMax: DEFAULT_MAX_PRICE,
      inStockOnly: false,
    };
  });

  const [lastSearchString, setLastSearchString] = useState(searchParams.toString());
  const searchQuery = searchParams.get('search') || '';
  const categoryQuery = searchParams.get('category') || '';
  const typeQuery = searchParams.get('type') || '';
  const occasionQuery = searchParams.get('occasion') || '';
  const urlFilter = searchParams.get('filter') || '';

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    Promise.all([
      apiFetch(`/sarees/${toQuery({
        page_size: 200,
        search: searchQuery || undefined,
        category: categoryQuery || undefined,
        type: typeQuery || undefined,
        occasion: occasionQuery || undefined,
      })}`),
      apiFetch('/saree-categories/?page_size=100'),
      apiFetch('/occasion-categories/?page_size=100'),
      apiFetch('/saree-type-options/?page_size=100&is_active=true'),
    ])
      .then(([productPayload, categoryPayload, occasionPayload, sareeTypePayload]) => {
        if (!mounted) return;
        setProducts(getResults(productPayload).map(normalizeProduct));

        const apiCategories = getResults(categoryPayload)
          .filter(c => c.is_active ?? true)
          .map(normalizeCategory);
        if (apiCategories.length) setCategoryOptions(apiCategories);

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
        if (mounted) setError(err.message || 'Could not load products');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [searchQuery, categoryQuery, typeQuery, occasionQuery]);

  useEffect(() => {
    const current = searchParams.toString();
    if (current === lastSearchString) return;
    setLastSearchString(current);

    const cat = searchParams.get('category');
    const type = searchParams.get('type');
    const occ = searchParams.get('occasion');
    const filter = searchParams.get('filter');

    setFilters(f => ({
      ...f,
      category: cat ? [cat] : [],
      type: type ? [type] : [],
      occasion: occ ? [occ] : [],
    }));
    if (filter === 'bestseller') setSortBy('bestseller');
    if (filter === 'new') setSortBy('newest');
    window.scrollTo({ top: 0, behavior: 'instant' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const stableSetFilters = useCallback(setFilters, []);

  const typeOptions = useMemo(() => {
    const fromProducts = products.map(p => p.type).filter(Boolean);
    return Array.from(new Set([...sareeTypeOptions, ...fromProducts, ...fallbackSareeTypes]));
  }, [products, sareeTypeOptions]);

  const filtered = useMemo(() => {
    let result = [...products];

    if (urlFilter === 'new') result = result.filter(p => p.isNew);
    if (urlFilter === 'bestseller') result = result.filter(p => p.isBestseller);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.productCode.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
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

    switch (sortBy) {
      case 'price-asc': result.sort((a, b) => a.price - b.price); break;
      case 'price-desc': result.sort((a, b) => b.price - a.price); break;
      case 'newest': result.sort((a, b) => Number(b.isNew) - Number(a.isNew)); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      case 'discount': result.sort((a, b) => b.discount - a.discount); break;
      case 'bestseller': result.sort((a, b) => Number(b.isBestseller) - Number(a.isBestseller)); break;
      default: result.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
    }

    return result;
  }, [products, filters, sortBy, searchQuery, urlFilter]);

  const activeCategoryName = filters.category.length === 1
    ? categoryOptions.find(c => c.id === filters.category[0])?.name
    : '';
  const activeTypeName = filters.type.length === 1 ? filters.type[0] : '';
  const activeOccasionName = filters.occasion.length === 1
    ? occasionOptions.find(o => o.id === filters.occasion[0])?.name || filters.occasion[0]
    : '';
  const pageTitle = searchQuery
    ? `Search: "${searchQuery}"`
    : urlFilter === 'new'
      ? 'New Arrivals'
      : [activeCategoryName, activeTypeName, activeOccasionName].filter(Boolean).join(' / ') || 'All Products';

  return (
    <div className="min-h-screen bg-dillo-ivory">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <nav className="text-xs font-body text-gray-500 flex items-center gap-2">
            <Link to="/" className="hover:text-dillo-red">Home</Link>
            <span>/</span>
            <span className="text-dillo-charcoal font-semibold">{pageTitle}</span>
          </nav>
          <p className="font-body text-xs text-gray-400">
            {loading ? 'Loading products...' : `${filtered.length} products found`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 mb-6 font-body text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-8">
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
            <div className="flex items-center justify-between mb-6 bg-white border border-gray-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 text-sm font-body font-semibold
                    text-dillo-charcoal border border-gray-200 px-3 py-2 hover:border-dillo-red"
                >
                  <SlidersHorizontal size={16} /> Filters
                </button>
                <p className="text-sm font-body text-gray-500 hidden sm:block">
                  Showing <span className="font-semibold text-dillo-charcoal">{filtered.length}</span> results
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="text-sm font-body border border-gray-200 px-3 py-2
                    focus:outline-none focus:border-dillo-red bg-white"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="discount">Biggest Discount</option>
                  <option value="bestseller">Best Sellers</option>
                </select>

                <div className="flex border border-gray-200">
                  <button
                    onClick={() => setView('grid')}
                    className={`p-2 transition-colors ${view === 'grid' ? 'bg-dillo-red text-white' : 'text-gray-400 hover:text-dillo-red'}`}
                  >
                    <Grid3X3 size={17} />
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`p-2 transition-colors ${view === 'list' ? 'bg-dillo-red text-white' : 'text-gray-400 hover:text-dillo-red'}`}
                  >
                    <List size={17} />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="bg-white border border-gray-100 p-12">
                <LogoLoader size="md" label="Loading products..." />
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white border border-gray-100 p-16 text-center">
                <Search size={48} className="text-gray-200 mx-auto mb-4" />
                <h3 className="font-display text-xl font-bold text-gray-400 mb-2">No products found</h3>
                <p className="font-body text-sm text-gray-400 mb-6">
                  Try adjusting your filters or search terms
                </p>
                <button
                  onClick={() => setFilters({
                    category: [], type: [], occasion: [], color: [],
                    priceMin: 0, priceMax: DEFAULT_MAX_PRICE, inStockOnly: false,
                  })}
                  className="btn-outline text-sm"
                >
                  Clear All Filters
                </button>
              </div>
            ) : view === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(p => <ProductCard key={p.id} product={p} view="grid" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map(p => <ProductCard key={p.id} product={p} view="list" />)}
              </div>
            )}
          </div>
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