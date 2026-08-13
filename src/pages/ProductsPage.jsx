import React, { useState, useMemo, useEffect, useCallback, memo, useRef } from 'react';
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

// ── Sticky-offset helper ────────────────────────────────────────────────────
// The header's height/position changes with breakpoint, scroll state, and
// interaction state (search bar, mobile drawer). Header.jsx measures its own
// real rendered height and publishes it as `--header-offset` on the document
// root. Every sticky element on the page reads that variable instead of a
// guessed `top-36`/`top-40` Tailwind value, so it never ends up covered by
// (or awkwardly far below) the header in some breakpoint/scroll combination.
const PRODUCT_BAR_TOP = 'var(--header-offset, 160px)';
const FILTER_TOP = 'calc(var(--header-offset, 160px) + 56px)';
const FILTER_MAXH = 'calc(100dvh - var(--header-offset, 160px) - 80px)';

// ─── Pure helpers ─────────────────────────────────────────────────────────────

const norm = (v) => (v || '').toString().toLowerCase().trim();
const slugify = (v) => norm(v).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function getResults(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.results || [];
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeProduct(product, idToSlug = {}, subToParent = {}) {
  const price         = toNumber(product.price);
  const originalPrice = toNumber(product.original_price ?? product.originalPrice ?? product.price, price);
  const images        = Array.isArray(product.images) && product.images.length
    ? product.images
    : [FALLBACK_IMAGE];
  const id = product.slug || String(product.id);

  // Resolve the product's own category slug (prefer subcategory)
  let catSlug =
    norm(product.subcategory_slug) ||
    norm(idToSlug[String(product.subcategory)] || '') ||
    norm(product.category_slug) ||
    norm(idToSlug[String(product.category)] || '') ||
    norm(String(product.category || ''));

  // Resolve parent category slug
  let parentSlug =
    norm(subToParent[catSlug] || '') ||
    norm(product.parent_slug || '') ||
    norm(product.category_slug) ||
    '';

  // If catSlug is itself a parent (not a subcategory), parentSlug stays ''
  // but we still want filtering by parent to match, so set parentSlug = catSlug in that case
  if (!parentSlug && !subToParent.hasOwnProperty(catSlug)) {
    // catSlug is a top-level category
    parentSlug = catSlug;
  }

  return {
    id,
    backendId:    product.id,
    productCode:  product.product_code  || product.productCode  || '',
    slug:         product.slug          || id,
    name:         product.name          || 'Untitled Product',
    nameTa:       product.name_ta       || product.nameTa       || '',
    // normalized slugs for filtering
    categorySlug: catSlug,
    parentSlug,
    categoryName: product.subcategory_name || product.category_name || product.categoryName || '',
    type:         norm(product.saree_type  || product.type  || ''),
    occasion:     norm(product.occasion_slug || product.occasionSlug || product.occasion_name || String(product.occasion || '')),
    occasionName: product.occasion_name || product.occasionName || '',
    price,
    originalPrice,
    discount:     toNumber(product.discount),
    colors:       Array.isArray(product.colors) ? product.colors : [],
    images,
    video:        product.video_url || product.video || null,
    isNew:        Boolean(product.is_new        ?? product.isNew),
    isFeatured:   Boolean(product.is_featured   ?? product.isFeatured),
    isBestseller: Boolean(product.is_bestseller ?? product.isBestseller),
    inStock:      Boolean(product.in_stock ?? product.inStock ?? toNumber(product.stock_count) > 0),
    stockCount:   toNumber(product.stock_count  ?? product.stockCount),
    rating:       toNumber(product.rating),
    reviewCount:  toNumber(product.review_count ?? product.reviewCount),
    description:  product.description || '',
    details:      product.information  || product.details || {},
    tags:         Array.isArray(product.tags) ? product.tags : [],
  };
}

// ─── Filter state serialisation ───────────────────────────────────────────────

const EMPTY_FILTERS = {
  category:   [],
  type:       [],
  occasion:   [],
  color:      [],
  priceMin:   0,
  priceMax:   DEFAULT_MAX_PRICE,
  inStockOnly: false,
};

function filtersFromParams(searchParams) {
  const cat = (searchParams.get('category') || '').toString().trim();
  const type = norm(searchParams.get('type') || '');
  const occ = norm(searchParams.get('occasion') || '');
  return {
    ...EMPTY_FILTERS,
    category:    cat  ? [cat]  : [],
    type:        type ? [type] : [],
    occasion:    occ  ? [occ]  : [],
    priceMin:    Number(searchParams.get('min_price') || 0),
    priceMax:    Number(searchParams.get('max_price') || DEFAULT_MAX_PRICE),
    inStockOnly: searchParams.get('in_stock') === '1',
  };
}

function paramsFromFilters(filters, extra = {}) {
  const p = { ...extra };
  if (filters.category?.length)  p.category  = filters.category[0];
  if (filters.type?.length)      p.type       = filters.type[0];
  if (filters.occasion?.length)  p.occasion   = filters.occasion[0];
  if (filters.inStockOnly)       p.in_stock   = '1';
  if (filters.priceMin > 0)      p.min_price  = String(filters.priceMin);
  if (filters.priceMax < DEFAULT_MAX_PRICE) p.max_price = String(filters.priceMax);
  return p;
}

// ─── FilterPanel ──────────────────────────────────────────────────────────────
export const FilterPanel = memo(function FilterPanel({
  filters,
  setFilters,
  categories,
  typeOptions,
  occasionOptions,
  onClose,
  onClearAll,
  isMobile = false,
}) {
  const [openSections, setOpenSections] = useState(['category']);

  const toggle = useCallback((sec) =>
    setOpenSections(s => s.includes(sec) ? s.filter(x => x !== sec) : [...s, sec]),
  []);

  const toggleFilter = useCallback((key, value) => {
    setFilters(f => {
      const arr = f[key] || [];
      const normVal = key === 'category' || key === 'type' || key === 'occasion'
        ? norm(value)
        : value;
      const isActive = arr.some(v =>
        (key === 'category' || key === 'type' || key === 'occasion')
          ? norm(v) === norm(value)
          : v === value
      );
      return {
        ...f,
        [key]: isActive
          ? arr.filter(v =>
              (key === 'category' || key === 'type' || key === 'occasion')
                ? norm(v) !== norm(value)
                : v !== value
            )
          : [...arr, normVal],
      };
    });
  }, [setFilters]);

  const hasFilters =
    (filters.category?.length || 0) + (filters.type?.length || 0) +
    (filters.occasion?.length || 0) + (filters.color?.length || 0) > 0 ||
    filters.inStockOnly ||
    filters.priceMin > 0 ||
    filters.priceMax < DEFAULT_MAX_PRICE;

  const pricePercent = Math.min(100, Math.max(0,
    ((filters.priceMax || DEFAULT_MAX_PRICE) / DEFAULT_MAX_PRICE) * 100
  ));

  // Case-insensitive active check
  const isActive = useCallback((key, value) => {
    const arr = filters[key] || [];
    if (key === 'category' || key === 'type' || key === 'occasion') {
      return arr.some(v => norm(v) === norm(value));
    }
    return arr.includes(value);
  }, [filters]);

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
      {openSections.includes(id) && <div className="mt-3">{children}</div>}
    </div>
  ), [openSections, toggle]);

  // Chip label: find display name from options
  const chipLabel = useCallback((filterKey, value) => {
    if (filterKey === 'category') {
      return categories.find(c => norm(c.id) === norm(value))?.name || value;
    }
    if (filterKey === 'occasion') {
      return occasionOptions.find(o => norm(o.id) === norm(value))?.name || value;
    }
    return value;
  }, [categories, occasionOptions]);

  return (
    <div
      className={`${isMobile ? '' : 'lg:h-full lg:min-h-0 lg:overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#d4a017_#f3f4f6] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-dillo-gold [&::-webkit-scrollbar-thumb]:rounded-full'} bg-white border border-gray-100 rounded-sm p-5`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display font-bold text-lg text-dillo-charcoal">Filters</h3>
        <div className="flex gap-2">
          {hasFilters && (
            <button onClick={onClearAll} className="text-xs text-dillo-red font-body hover:underline">
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

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-gray-100">
          {[
            ...(filters.category || []).map(id => ({ key: id, filterKey: 'category' })),
            ...(filters.type     || []).map(id => ({ key: id, filterKey: 'type' })),
            ...(filters.occasion || []).map(id => ({ key: id, filterKey: 'occasion' })),
            ...(filters.color    || []).map(id => ({ key: id, filterKey: 'color' })),
          ].map(chip => (
            <span
              key={`${chip.filterKey}-${chip.key}`}
              className="flex items-center gap-1 bg-dillo-red/10 text-dillo-red text-xs px-2 py-1 font-body"
            >
              {chipLabel(chip.filterKey, chip.key)}
              <button onClick={() => toggleFilter(chip.filterKey, chip.key)}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Category */}
      <Section id="category" label="Category">
        <div className="space-y-2">
          {categories.map(c => (
            <label
              key={c.id}
              className={`flex items-center justify-between cursor-pointer group ${c.isSubcategory ? 'pl-5' : ''}`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive('category', c.id)}
                  onChange={() => toggleFilter('category', c.id)}
                  className="accent-dillo-red w-4 h-4"
                />
                <span className={`font-body text-sm group-hover:text-dillo-red transition-colors ${
                  c.isSubcategory ? 'text-gray-500' : 'text-gray-700 font-semibold'
                }`}>
                  {c.isSubcategory ? '– ' : ''}{c.name}
                </span>
              </div>
              {c.count > 0 && <span className="text-xs text-gray-400">({c.count})</span>}
            </label>
          ))}
          {categories.length === 0 && (
            <p className="text-xs text-gray-400 font-body italic">No categories available.</p>
          )}
        </div>
      </Section>

      {/* Price Range */}
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

      {/* Type */}
      <Section id="type" label="Product Type">
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {typeOptions.map(t => (
            <label key={t} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={isActive('type', t)}
                onChange={() => toggleFilter('type', t)}
                className="accent-dillo-red w-4 h-4"
              />
              <span className="font-body text-sm text-gray-700 group-hover:text-dillo-red transition-colors">{t}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Occasion */}
      <Section id="occasion" label="Occasion">
        <div className="flex flex-wrap gap-2">
          {occasionOptions.map(o => (
            <button
              key={o.id}
              onClick={() => toggleFilter('occasion', o.id)}
              className={`text-xs px-3 py-1.5 border font-body transition-colors
                ${isActive('occasion', o.id)
                  ? 'bg-dillo-red text-white border-dillo-red'
                  : 'border-gray-200 hover:border-dillo-red hover:text-dillo-red text-gray-600'}`}
            >
              {o.name}
            </button>
          ))}
        </div>
      </Section>

      {/* Color */}
      <Section id="color" label="Color">
        <div className="flex flex-wrap gap-2">
          {colors.map(c => (
            <button
              key={c.name}
              onClick={() => toggleFilter('color', c.name)}
              title={c.name}
              className={`w-7 h-7 transition-all duration-200 relative
                ${isActive('color', c.name)
                  ? 'ring-2 ring-dillo-red ring-offset-2 scale-110'
                  : 'hover:scale-110 hover:ring-1 hover:ring-gray-300 hover:ring-offset-1'}`}
              style={{ backgroundColor: c.hex }}
            >
              {isActive('color', c.name) && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full" />
                </span>
              )}
            </button>
          ))}
        </div>
      </Section>

      {/* In stock */}
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

// ─── ProductsPage ─────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Track URL writes we make ourselves to prevent the sync effect from echo-firing
  const lastWrittenUrlRef = useRef(searchParams.toString());

  const [view,   setView]   = useState('grid');
  const [sortBy, setSortBy] = useState(() => {
    const f = searchParams.get('filter');
    if (f === 'bestseller') return 'bestseller';
    if (f === 'new')        return 'newest';
    return 'featured';
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Remote data
  const [allProducts,      setAllProducts]      = useState([]);
  const [categoryOptions,  setCategoryOptions]  = useState(
    fallbackCategories.map(c => ({ id: norm(c.id), name: c.name, count: c.count || 0 }))
  );
  const [occasionOptions,  setOccasionOptions]  = useState(
    fallbackOccasions.map(o => ({ id: norm(o), name: o }))
  );
  const [sareeTypeOptions, setSareeTypeOptions] = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState('');

  // Filter state – seeded from URL once
  const [filters, setFilters] = useState(() => filtersFromParams(searchParams));

  // Read-only URL params (for search/tag/urlFilter which drive the fetch)
  const searchQuery = searchParams.get('search')   || '';
  const tagQuery    = searchParams.get('tag')      || '';
  const urlFilter   = searchParams.get('filter')   || '';

  // ── Effect 1: Fetch ALL data (no backend category filter) ─────────────────
  // We always fetch all products and filter 100% on the client.
  // This is correct because:
  //   a) Products are assigned to subcategories, not top-level categories,
  //      so ?category=mens returns 0 results from backend.
  //   b) Client-side filtering handles parent↔subcategory relationships properly.
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    Promise.all([
      // Fetch ALL products – never pass category/type/occasion to backend
      apiFetch(`/products/${toQuery({
        page_size: 500,
        search:    searchQuery || undefined,
        tag:       tagQuery    || undefined,
      })}`),  
      apiFetch('/product-categories/?page_size=100'),
      apiFetch('/subcategories/?page_size=200'),
      apiFetch('/occasion-categories/?page_size=100'),
      apiFetch('/product-type-options/?page_size=100&is_active=true'),
    ])
      .then(([productPayload, categoryPayload, subcategoryPayload, occasionPayload, typePayload]) => {
        if (!mounted) return;

        const apiCategories    = getResults(categoryPayload).filter(c => c.is_active ?? true);
        const apiSubcategories = getResults(subcategoryPayload).filter(s => s.is_active ?? true);

        // Build lookup maps (all keys normalised to lowercase)
        const idToSlug = {};   // numeric id → normalized slug
        apiCategories.forEach(c => {
          if (c.id != null) idToSlug[String(c.id)] = norm(c.slug || String(c.id));
        });
        apiSubcategories.forEach(sc => {
          if (sc.id != null) idToSlug[String(sc.id)] = norm(sc.slug || String(sc.id));
        });

        // subSlug → parentSlug
        const subToParent = {};
        apiSubcategories.forEach(sc => {
          const slug = norm(sc.slug || String(sc.id));
          const parentSlug =
            norm(sc.parent_slug || '') ||
            norm(idToSlug[String(sc.parent)] || '');
          if (slug && parentSlug) subToParent[slug] = parentSlug;
        });

        // Normalize products
        const normalizedProducts = getResults(productPayload).map(p =>
          normalizeProduct(p, idToSlug, subToParent)
        );
        setAllProducts(normalizedProducts);

        // Build merged category list (parents then their children, indented)
        const merged = [];
        apiCategories.forEach(c => {
          const slug = norm(c.slug || String(c.id));
          merged.push({ id: slug, name: c.name, count: c.count || 0, parent: null, isSubcategory: false });
          apiSubcategories
            .filter(s => {
              const ps = norm(s.parent_slug || '') || norm(idToSlug[String(s.parent)] || '');
              return ps === slug;
            })
            .forEach(s => {
              merged.push({
                id:           norm(s.slug || String(s.id)),
                name:         s.name,
                count:        s.count || 0,
                parent:       slug,
                isSubcategory: true,
              });
            });
        });
        if (merged.length) setCategoryOptions(merged);

        const apiOccasions = getResults(occasionPayload)
          .filter(o => o.is_active ?? true)
          .map(o => ({ id: norm(o.slug || o.name), name: o.name }));
        if (apiOccasions.length) setOccasionOptions(apiOccasions);

        const apiTypes = getResults(typePayload)
          .filter(t => t.is_active ?? true)
          .map(t => t.name)
          .filter(Boolean);
        if (apiTypes.length) setSareeTypeOptions(apiTypes);
      })
      .catch(err => {
        console.error(err);
        if (mounted) setError(err.message || 'Could not load products');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
    // Only re-fetch when search/tag changes – category filtering is client-side
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, tagQuery]);

  // ── Effect 2: Sync URL → filters on external navigation only ─────────────
  useEffect(() => {
    const current = searchParams.toString();
    if (current === lastWrittenUrlRef.current) return; // our own write — skip
    lastWrittenUrlRef.current = current;

    setFilters(filtersFromParams(searchParams));

    const f = searchParams.get('filter');
    if (f === 'bestseller') setSortBy('bestseller');
    else if (f === 'new')   setSortBy('newest');

    window.scrollTo({ top: 0, behavior: 'instant' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ── applyFilters: update state + URL atomically ───────────────────────────
  const applyFilters = useCallback((updater) => {
    setFilters(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;

      const extra = {};
      if (searchQuery) extra.search = searchQuery;
      if (tagQuery)    extra.tag    = tagQuery;
      if (urlFilter)   extra.filter = urlFilter;

      const newParams = paramsFromFilters(next, extra);
      const newString = new URLSearchParams(newParams).toString();
      lastWrittenUrlRef.current = newString;
      setSearchParams(newParams, { replace: true });

      return next;
    });
  }, [searchQuery, tagQuery, urlFilter, setSearchParams]);

  const clearAllFilters = useCallback(() => {
    lastWrittenUrlRef.current = '';
    setFilters({ ...EMPTY_FILTERS });
    setSortBy('featured');
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  // ── Derived data ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!categoryOptions.length || !filters.category?.length) return;

    const resolvedCategories = filters.category.map(value => {
      const resolved = resolveCategoryValues(value, categoryOptions);
      return resolved.length === 1 ? resolved[0] : value;
    });
    const changed = resolvedCategories.some((value, index) =>
      norm(value) !== norm(filters.category[index])
    );

    if (changed) {
      setFilters(current => ({ ...current, category: resolvedCategories }));
    }
  }, [categoryOptions, filters.category]);

  const typeOptions = useMemo(() => {
    const fromProducts = allProducts.map(p => p.type).filter(Boolean);
    const fromApi      = sareeTypeOptions.map(t => norm(t));
    return Array.from(new Set([...fromApi, ...fromProducts, ...fallbackSareeTypes.map(norm)]));
  }, [allProducts, sareeTypeOptions]);

  const filtered = useMemo(() => {
    let result = [...allProducts];

    // URL-flag filters
    if (urlFilter === 'new')        result = result.filter(p => p.isNew);
    if (urlFilter === 'bestseller') result = result.filter(p => p.isBestseller);
    if (urlFilter === 'low-stock')  result = result.filter(p => p.stockCount <= 5 && p.inStock);

    // Text search (client-side)
    if (searchQuery) {
      const q = norm(searchQuery);
      result = result.filter(p =>
        norm(p.productCode).includes(q) ||
        norm(p.name).includes(q) ||
        norm(p.type).includes(q) ||
        norm(p.description).includes(q) ||
        p.tags?.some(t => norm(t).includes(q))
      );
    }

    if (tagQuery) {
      const q = norm(tagQuery);
      result = result.filter(p => p.tags?.some(t => norm(t).includes(q)));
    }

    // Category filter:
    // A product matches if its own categorySlug OR its parentSlug is in the filter list.
    // This means selecting "Mens" shows all sub-category products under Mens,
    // and selecting "Casual Shirt" shows only Casual Shirt products.
    if (filters.category?.length) {
      const activeCats = filters.category.flatMap(value =>
        resolveCategoryValues(value, categoryOptions)
      );
      result = result.filter(p =>
        activeCats.includes(p.categorySlug) ||
        activeCats.includes(p.parentSlug)
      );
    }

    if (filters.type?.length) {
      const activeTypes = filters.type.map(norm);
      result = result.filter(p => activeTypes.includes(p.type));
    }

    if (filters.occasion?.length) {
      const activeOccs = filters.occasion.map(norm);
      result = result.filter(p =>
        activeOccs.includes(p.occasion) ||
        activeOccs.includes(norm(p.occasionName))
      );
    }

    if (filters.color?.length) {
      result = result.filter(p => p.colors?.some(c => filters.color.includes(c)));
    }

    result = result.filter(p =>
      p.price >= (filters.priceMin || 0) &&
      p.price <= (filters.priceMax || DEFAULT_MAX_PRICE)
    );

    if (filters.inStockOnly) result = result.filter(p => p.inStock);

    // Sort
    switch (sortBy) {
      case 'price-asc':   result.sort((a, b) => a.price - b.price); break;
      case 'price-desc':  result.sort((a, b) => b.price - a.price); break;
      case 'newest':      result.sort((a, b) => Number(b.isNew) - Number(a.isNew)); break;
      case 'rating':      result.sort((a, b) => b.rating - a.rating); break;
      case 'discount':    result.sort((a, b) => b.discount - a.discount); break;
      case 'bestseller':  result.sort((a, b) => Number(b.isBestseller) - Number(a.isBestseller)); break;
      default:            result.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
    }

    return result;
  }, [allProducts, filters, sortBy, searchQuery, tagQuery, urlFilter, categoryOptions]);

  // ── Page title ────────────────────────────────────────────────────────────
  const activeCategoryName = filters.category.length === 1
    ? categoryOptions.find(c => norm(c.id) === norm(filters.category[0]))?.name
    : '';
  const activeTypeName = filters.type.length === 1 ? filters.type[0] : '';
  const activeOccasionName = filters.occasion.length === 1
    ? occasionOptions.find(o => norm(o.id) === norm(filters.occasion[0]))?.name || filters.occasion[0]
    : '';

  const pageTitle = searchQuery
    ? `Search: "${searchQuery}"`
    : tagQuery === 'new-arrivals'   ? 'New Arrivals'
    : tagQuery === 'trending-now'   ? 'Trending Now'
    : urlFilter === 'new'           ? 'New Arrivals'
    : urlFilter === 'bestseller'    ? 'Best Sellers'
    : [activeCategoryName, activeTypeName, activeOccasionName].filter(Boolean).join(' / ')
    || 'All Products';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-dillo-ivory">
      <section>
      {/* Breadcrumb */}
      <div
        className="lg:sticky lg:z-30 bg-white border-b border-gray-100 shadow-sm shadow-dillo-charcoal/5"
        style={{ top: PRODUCT_BAR_TOP }}
      >
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

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 mb-6 font-body text-sm">
            {error}
          </div>
        )}

        <div className="flex items-start gap-6 xl:gap-8">
          {/* Desktop sidebar — sticky offset tracks the header's real height
              via --header-offset (see Header.jsx), so it never sits behind
              the header or floats too far down at any breakpoint/scroll state. */}
          <div
            className="hidden lg:block sticky w-72 flex-shrink-0 self-start"
            style={{ top: FILTER_TOP, height: FILTER_MAXH }}
          >
            <FilterPanel
              filters={filters}
              setFilters={applyFilters}
              categories={categoryOptions}
              typeOptions={typeOptions}
              occasionOptions={occasionOptions}
              onClearAll={clearAllFilters}
            />
          </div>

          <div className="flex-1 min-w-0 w-full">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 bg-white border border-gray-100 rounded-sm px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
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
              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="text-sm font-body border border-gray-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-dillo-red bg-white min-h-11 flex-1 sm:flex-none sm:min-w-40"
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

            <div>
              {/* Results */}
              {loading ? (
              <div className="bg-white border border-gray-100 rounded-sm p-10 sm:p-12">
                <LogoLoader size="md" label="Loading products..." />
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-sm p-10 sm:p-16 text-center">
                <Search size={48} className="text-gray-200 mx-auto mb-4" />
                <h3 className="font-display text-xl font-bold text-gray-400 mb-2">No products found</h3>
                <p className="font-body text-sm text-gray-400 mb-6">
                  Try adjusting your filters or search terms
                </p>
                <button onClick={clearAllFilters} className="btn-outline text-sm">
                  Clear All Filters
                </button>
              </div>
            ) : view === 'grid' ? (
              <div className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 xl:gap-6 pb-8">
                {filtered.map(p => <ProductCard key={p.id} product={p} view="grid" />)}
              </div>
            ) : (
              <div className="space-y-4 pb-8">
                {filtered.map(p => <ProductCard key={p.id} product={p} view="list" />)}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setMobileFiltersOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-80 max-w-[90vw] bg-white z-[60]
            overflow-y-auto animate-slide-in-left shadow-2xl p-5">
            <FilterPanel
              filters={filters}
              setFilters={applyFilters}
              categories={categoryOptions}
              typeOptions={typeOptions}
              occasionOptions={occasionOptions}
              onClearAll={clearAllFilters}
              isMobile
              onClose={() => setMobileFiltersOpen(false)}
            />
            <button onClick={() => setMobileFiltersOpen(false)} className="btn-primary w-full mt-6">
              Show {filtered.length} Results
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function resolveCategoryValues(value, categories = []) {
  const raw = (value || '').toString().trim();
  const normalized = norm(raw);
  const slug = slugify(raw);
  if (!normalized) return [];

  const nameMatches = categories.filter(c => slugify(c.name) === slug);
  if (nameMatches.length) return nameMatches.map(c => norm(c.id));

  if (slug === 'kids') {
    const kids = categories.filter(c =>
      ['kids', 'boys', 'girls'].includes(slugify(c.name))
    );
    return kids.length ? kids.map(c => norm(c.id)) : [normalized];
  }

  const looksLikeLabel = raw !== normalized || raw.includes(' ');
  if (looksLikeLabel) return [];

  const slugMatch = categories.find(c => norm(c.id) === normalized);
  return [norm(slugMatch?.id || normalized)];
}
