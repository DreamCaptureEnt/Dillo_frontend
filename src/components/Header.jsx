import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart, Heart, Search, Menu, X, ChevronDown,
  Phone, Mail, User, Youtube, Instagram,
} from 'lucide-react';
import DilloLogo from './../assets/Logo.png';
import { useCart } from '../pages/CartContext';
import { announcements } from '../products.js';
import { apiFetch } from '../api';

function getResults(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') return payload.results ?? payload.data ?? [];
  return [];
}

const norm = (value) => (value || '').toString().trim().toLowerCase();
const slugify = (value) => norm(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function SocialBrandIcon({ platform, size = 14 }) {
  const normalized = platform?.toLowerCase();
  if (normalized === 'youtube') {
    return <Youtube size={size} className="text-[#FF0000] flex-shrink-0" />;
  }
  if (normalized === 'instagram') {
    return <Instagram size={size} className="text-[#E4405F] flex-shrink-0" />;
  }
  return null;
}

/*
  Logo dimensions: 562 × 444 px  →  aspect ratio ≈ 1.266 (landscape-ish square)
  Strategy: fix HEIGHT per breakpoint, let width auto-scale via object-contain.

  LAYOUT: TWO STACKED ROWS on desktop, not one row.

    Row 1 (h-16 xl:h-20 2xl:h-24): logo only, perfectly centered, full breathing room
    Row 2 (h-12, xl+ only): nav (truly centered) + icons (right-aligned), own row

  ROW 2 CENTERING FIX (this version):
  Previously Row 2 was `flex justify-between` with the nav as
  `flex-1 justify-center` and the icon cluster as `flex-shrink-0`.
  That centers the nav *inside the leftover space after the icons*,
  not inside the row as a whole — so on real screens the nav visibly
  drifts left, since the icon cluster on the right (~180px) has no
  mirrored space on the left to balance it.

  Fix: use the same trick as the logo row — a 3-column grid
  `[1fr_auto_1fr]` with an empty first column, the nav in the middle
  column (auto width, centered), and the icon cluster in the last
  column (right-aligned). Because the two flanking columns are true
  grid tracks (1fr each), the middle column is mathematically centered
  in the row regardless of how wide the icon cluster is — the same
  guarantee the logo row already relies on.

  Header total heights:
    mobile  → logo row h-16 (no separate nav row; nav lives in drawer)
    xl+     → logo row h-20 xl:h-24  +  nav row h-12
*/

export default function Header() {
  const { cartCount, wishlist, dispatch } = useCart();
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled]       = useState(false);
  const [activeMenu, setActiveMenu]   = useState(null);
  const [mobileSubmenu, setMobileSubmenu] = useState(null);
  const [productTypes, setProductTypes] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const navigate  = useNavigate();
  const location  = useLocation();
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setActiveMenu(null);
    setMobileSubmenu(null);
  }, [location]);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiFetch('/product-categories/?page_size=200'),
      apiFetch('/subcategories/?page_size=200'),
      apiFetch('/product-type-options/?page_size=100&is_active=true'),
      apiFetch('/occasion-categories/?page_size=100'),
    ])
      .then(([categoryPayload, subcategoryPayload, typePayload, occasionPayload]) => {
        if (!mounted) return;
        const parentCats = getResults(categoryPayload)
          .filter(c => c.is_active ?? true)
          .map(c => ({
            id: c.slug || String(c.id),
            name: c.name,
            slug: norm(c.slug || String(c.id)),
            parent_slug: norm(c.parent_slug || ''),
          }));
        const subcats = getResults(subcategoryPayload)
          .filter(s => s.is_active ?? true)
          .map(s => ({
            id: s.slug || String(s.id),
            name: s.name,
            slug: norm(s.slug || String(s.id)),
            parent_slug: norm(s.parent_slug || ''),
          }));

        // combine parents and subcategories so submenuFromCategory can find children by parent_slug
        const cats = [...parentCats, ...subcats];
        setProductCategories(cats);
        setProductTypes(getResults(typePayload)
          .filter(item => item.is_active ?? true)
          .map(item => ({ id: item.slug || String(item.id), name: item.name, slug: item.slug })));
        setOccasions(getResults(occasionPayload)
          .filter(item => item.is_active ?? true)
          .map(item => ({ id: item.slug || String(item.id), name: item.name, slug: item.slug })));
      })
      .catch(err => {
        console.error('Header nav load failed', err);
      });
    return () => { mounted = false; };
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navItems = useMemo(() => {
    const occasionLinks = occasions.slice(0, 8).map(occasion => ({
      label: occasion.name,
      value: occasion.slug || occasion.id || occasion.name,
      href: `/products?occasion=${encodeURIComponent(occasion.slug || occasion.id || occasion.name)}`,
    }));

    const resolveCategorySlug = (candidates, fallback) => {
      const wanted = candidates.map(slugify).filter(Boolean);
      const match = (productCategories || []).find(c =>
        !c.parent_slug &&
        (wanted.includes(slugify(c.name)) || wanted.includes(slugify(c.slug)))
      );
      return norm(match?.slug || fallback);
    };

    const navCategoryHref = (value) =>
      `/products?category=${encodeURIComponent(value)}`;

    const productsHref = (params) =>
      `/products?${new URLSearchParams(params).toString()}`;

    const sareesSlug = resolveCategorySlug(['Sarees', 'Saree'], 'sarees');
    const womensSlug = resolveCategorySlug(['Womens', 'Women', 'Ladies'], 'womens');
    const mensSlug = resolveCategorySlug(['Mens', 'Men'], 'mens');
    const kidsSlug = resolveCategorySlug(['Kids', 'Boys', 'Girls'], 'kids');
    const bornBabySlug = resolveCategorySlug(['Born Baby', 'Born Babys'], 'born-baby');

    // map product categories by parent slug for category-specific submenus
    const categoriesByParent = (productCategories || []).reduce((acc, c) => {
      if (!c.parent_slug) return acc;
      const key = norm(c.parent_slug);
      acc[key] = acc[key] || [];
      acc[key].push(c);
      return acc;
    }, {});

    // Build a submenu for a top-level category: its real subcategories
    // under "Category", and the full occasions list under "Occasions".
    // Never falls back to unrelated saree-type data.
    const buildSubmenu = (parentSlug, fallbackLabel, categoryValue = fallbackLabel) => {
      const children = categoriesByParent[parentSlug] || [];
      const scopedOccasionLinks = occasionLinks.map(link => ({
        ...link,
        href: productsHref({
          category: categoryValue,
          occasion: link.value,
        }),
      }));
      const categoryLinks = children.length
        ? children.slice(0, 8).map(ch => ({
            label: ch.name,
            href: `/products?category=${encodeURIComponent(ch.name || ch.slug)}`,
          }))
        : [{ label: `All ${fallbackLabel}`, href: navCategoryHref(categoryValue) }];

      const shopLinks = [
        { label: 'New Arrivals', href: productsHref({ category: categoryValue, filter: 'new' }), badge: 'New' },
        { label: 'Best Sellers', href: productsHref({ category: categoryValue, filter: 'bestseller' }) },
        { label: 'Trending Now', href: productsHref({ category: categoryValue, tag: 'trending-now' }) },
      ];

      return [
        {
          heading: 'Category',
          links: categoryLinks,
        },
        {
          heading: 'Occasions',
          links: scopedOccasionLinks.length
            ? scopedOccasionLinks
            : [{ label: 'All Occasions', href: navCategoryHref(categoryValue) }],
        },
        {
          heading: 'Shop',
          links: shopLinks,
        },
      ];
    };

    return [
      {
        label: 'New Arrivals',
        labelTa: 'புதிய வரவுகள்',
        href: '/products?filter=new',
      },
      {
        label: 'Sarees',
        labelTa: 'சேலைகள்',
        href: navCategoryHref('Sarees'),
        submenu: buildSubmenu(sareesSlug, 'Sarees', 'Sarees'),
      },
      {
        label: 'Womens',
        labelTa: 'பெண்கள்',
        href: navCategoryHref('Ladies'),
        submenu: buildSubmenu(womensSlug, 'Womens', 'Ladies'),
      },
      {
        label: 'Mens',
        labelTa: 'ஆண்கள்',
        href: navCategoryHref('Mens'),
        submenu: buildSubmenu(mensSlug, 'Mens', 'Mens'),
      },
      {
        label: 'Kids',
        labelTa: 'குழந்தைகள்',
        href: navCategoryHref('Kids'),
        submenu: buildSubmenu(kidsSlug, 'Kids', 'Kids'),
      },
      {
        label: 'Born Baby',
        labelTa: 'பிறந்த குழந்தை',
        href: navCategoryHref('Born Babys'),
        submenu: buildSubmenu(bornBabySlug, 'Born Baby', 'Born Babys'),
      },
      {
        label: 'Trending Now',
        labelTa: 'பிரபலமானவை',
        href: '/products?tag=trending-now',
      },
      {
        label: 'About Us',
        labelTa: 'எங்களைப் பற்றி',
        href: '/about',
      },
      {
        label: 'Video Shopping',
        labelTa: 'வீடியோ வாங்கல்',
        href: '/video-shopping',
      },
    ];
  }, [occasions, productCategories]);
  return (
    <>
      {/* ── Announcement Ticker ─────────────────────────────── */}
      <div className="bg-dillo-charcoal text-white py-2 overflow-hidden text-xs">
        <div className="ticker-wrap">
          <div className="ticker-content">
            {[...announcements, ...announcements].map((msg, i) => (
              <span key={i} className="mx-12 font-body tracking-wide">{msg}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top Info Bar — desktop only ─────────────────────── */}
      <div className="hidden md:block bg-dillo-cream border-b border-dillo-gold/30 py-2 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-xs font-body text-dillo-charcoal/70">
          <div className="flex items-center gap-6">
            <a href="tel:+919876543210"
              className="flex items-center gap-1.5 hover:text-dillo-red transition-colors whitespace-nowrap">
              <Phone size={12} className="text-[#16A34A] flex-shrink-0" /> +91 98765 43210
            </a>
            <a href="mailto:info@dillo.in"
              className="flex items-center gap-1.5 hover:text-dillo-red transition-colors whitespace-nowrap">
              <Mail size={12} className="text-[#2563EB] flex-shrink-0" /> info@dillo.in
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://youtube.com" target="_blank" rel="noreferrer"
              className="flex items-center gap-1 hover:text-dillo-red transition-colors whitespace-nowrap">
              <SocialBrandIcon platform="youtube" size={13} /> YouTube
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer"
              className="flex items-center gap-1 hover:text-dillo-red transition-colors whitespace-nowrap">
              <SocialBrandIcon platform="instagram" size={13} /> Instagram
            </a>
            <span className="text-dillo-gold">•</span>
            <span className="whitespace-nowrap">Free shipping above ₹2000</span>
          </div>
        </div>
      </div>

      {/* ── Main Header ─────────────────────────────────────── */}
      <header
        className={`fixed left-0 right-0 z-[50] transition-all duration-300 ${scrolled ? 'top-0' : 'top-8 md:top-[72px]'}
          ${scrolled ? 'glassmorphism shadow-lg shadow-dillo-charcoal/10' : 'bg-white'}
          border-b border-gray-100`}
        onMouseLeave={() => setActiveMenu(null)}
      >
        <div className="max-w-7xl mx-auto px-4 relative">

          {/* ════════════════════════════════════════════════
              ROW 1 — LOGO ONLY, full width, perfectly centered.
              Mobile  (< xl): logo centered, hamburger + search anchored right.
              Desktop (≥ xl): logo centered, with a quiet left/right spacer
                              so it stays visually centered even though
                              nothing else shares this row.

              Original logo: 562 × 444 px (ratio 1.266 : 1).

              MOBILE CENTERING FIX (kept from previous pass):
              Both side columns are forced to the SAME fixed width
              (5rem) so the middle "centered" column is centered between
              two truly equal gaps, regardless of what each side contains.
              ════════════════════════════════════════════════ */}
          <div className="grid grid-cols-[5rem_1fr_5rem] xl:grid-cols-3 items-center h-16 xl:h-20 2xl:h-24">

            {/* left spacer — fixed width, mirrors the right column exactly */}
            <div aria-hidden="true" />

            <Link
              to="/"
              className="flex-shrink-0 flex items-center justify-center justify-self-center"
              aria-label="Dillo — go to homepage"
            >
              <img
                src={DilloLogo}
                alt="Dillo"
                width={562}
                height={444}
                className={[
                  'h-12 w-auto',
                  'sm:h-14',
                  'xl:h-16',
                  '2xl:h-20',
                  'max-w-[90px]',
                  'xl:max-w-[120px]',
                  '2xl:max-w-[140px]',
                  'object-contain',
                  'object-center',
                  'transition-opacity duration-200 hover:opacity-80',
                ].join(' ')}
              />
            </Link>

            {/* ── Mobile-only: search + hamburger anchored right on the logo row ──
                Fixed-width column (matches left spacer) so the logo column
                in the middle is genuinely centered, not just "centered" in
                whatever space happens to be left over. */}
            <div className="xl:hidden flex items-center justify-end gap-1 flex-shrink-0">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-dillo-charcoal hover:text-dillo-red transition-colors"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 text-dillo-charcoal hover:text-dillo-red transition-colors
                  w-10 h-10 flex items-center justify-center"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

            {/* right spacer on desktop — row 2 carries the real icons */}
            <div className="hidden xl:block" aria-hidden="true" />
          </div>

          {/* ════════════════════════════════════════════════
              ROW 2 (desktop only) — NAV (truly centered) + ICONS (right)

              3-column grid `[1fr_auto_1fr]`:
                col 1 → empty spacer (grows/shrinks with viewport)
                col 2 → nav, auto-width, centered by grid math
                col 3 → icon cluster, right-aligned in its own track

              Because col 1 and col 3 are both `1fr`, the nav in the
              middle is centered relative to the FULL row width — not
              relative to whatever space the icons happen to leave —
              so it no longer drifts left as the icon cluster's width
              changes (e.g. wishlist/cart badges appearing).
              ════════════════════════════════════════════════ */}
          <div className="hidden xl:grid grid-cols-[1fr_auto_1fr] items-center h-12 border-t border-gray-100">

            {/* left spacer — balances the icon cluster so col 2 is truly centered */}
            <div aria-hidden="true" />

            <nav className="flex items-center justify-center gap-0.5 justify-self-center">
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className="relative py-2"
                  onMouseEnter={() => setActiveMenu(item.label)}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <Link
                    to={item.href}
                    className={`flex items-center gap-1 px-2 2xl:px-3 py-2 text-xs 2xl:text-sm
                      font-body font-semibold tracking-wide uppercase whitespace-nowrap
                      transition-colors duration-200 relative
                      ${item.highlight ? 'text-dillo-red' : 'text-dillo-charcoal hover:text-dillo-red'}
                      after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5
                      after:bg-dillo-red after:scale-x-0 after:transition-transform
                      after:origin-center hover:after:scale-x-100`}
                  >
                    {item.label}
                    {item.badge && (
                      <span className="ml-1 bg-dillo-red text-white text-[10px] px-1.5 py-0.5 font-bold animate-pulse">
                        {item.badge}
                      </span>
                    )}
                    {item.submenu && (
                      <ChevronDown size={13}
                        className={`opacity-60 transition-transform duration-200 flex-shrink-0 ${activeMenu === item.label ? 'rotate-180' : ''}`}
                      />
                    )}
                  </Link>

                  {item.submenu && activeMenu === item.label && (
                    <div
                      className="absolute left-1/2 top-full z-[110] w-[min(760px,calc(100vw-2rem))] -translate-x-1/2 bg-white rounded-xl shadow-lg shadow-dillo-charcoal/10 border border-gray-100 ring-1 ring-black/[0.03] overflow-hidden"
                    >
                      <div className="h-[3px] bg-dillo-red" />
                      <div
                        className="grid gap-x-6 gap-y-5 p-5"
                        style={{ gridTemplateColumns: `repeat(${Math.min(item.submenu.length, 3)}, minmax(180px, 1fr))` }}
                      >
                        {item.submenu.map((group) => (
                          <div key={group.heading} className="min-w-0">
                            <p className="text-[10.5px] font-cinzel font-semibold tracking-wider text-dillo-gold uppercase mb-1.5 pb-1.5 border-b border-gray-100">
                              {group.heading}
                            </p>
                            <ul className="space-y-1 max-h-64 overflow-y-auto overflow-x-hidden pr-1.5 text-sm">
                              {group.links.map((link) => (
                                <li key={link.label}>
                                  <Link to={link.href}
                                    className="flex items-start gap-1.5 rounded-md px-2 py-2 -mx-2 text-dillo-charcoal hover:bg-dillo-cream hover:text-dillo-red transition-colors duration-150"
                                  >
                                    {link.platform && <SocialBrandIcon platform={link.platform} size={13} />}
                                    <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">{link.label}</span>
                                    {link.badge && (
                                      <span className="ml-auto mt-0.5 flex-shrink-0 text-[9px] bg-dillo-red text-white px-1.5 py-0.5 rounded font-bold leading-none">
                                        {link.badge}
                                      </span>
                                    )}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="flex items-center gap-1.5 justify-self-end">
              <button onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 hover:text-dillo-red transition-colors text-dillo-charcoal"
                aria-label="Search">
                <Search size={20} />
              </button>

              <Link to="/wishlist"
                className="p-2 hover:text-dillo-red transition-colors text-dillo-charcoal relative"
                aria-label="Wishlist">
                <Heart size={20} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-pink-500 text-white
                    text-[10px] w-4 h-4 flex items-center justify-center font-bold">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              <Link to="/account"
                className="p-2 hover:text-dillo-red transition-colors text-dillo-charcoal"
                aria-label="Account">
                <User size={20} />
              </Link>

              <button onClick={() => dispatch({ type: 'OPEN_CART' })}
                className="flex items-center gap-2 bg-dillo-red text-white px-4 py-2
                  hover:bg-dillo-red-dark transition-colors relative"
                aria-label="Cart">
                <ShoppingCart size={18} />
                <span className="text-sm font-body font-semibold">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-dillo-gold text-white
                    text-[10px] w-4 h-4 flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ── Inline Search Bar ──────────────────────────── */}
          {searchOpen && (
            <div className="pb-3 animate-slide-up">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, categories, collections..."
                  className="flex-1 input-field border-dillo-red/30"
                />
                <button type="submit" className="btn-primary px-3 py-2 flex-shrink-0">
                  <Search size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="p-2 border border-gray-200 hover:border-dillo-red
                    text-gray-500 hover:text-dillo-red transition-colors flex-shrink-0"
                >
                  <X size={18} />
                </button>
              </form>
            </div>
          )}


        {/* ══════════════════════════════════════════════════════
            MOBILE DRAWER  (< xl)
            ══════════════════════════════════════════════════════ */}
        {mobileOpen && (
          <div className="xl:hidden bg-white border-t border-gray-100 animate-slide-up
            shadow-2xl max-h-[calc(100dvh-64px)] overflow-y-auto">

            {/* 1. Quick-action strip */}
            <div className="bg-dillo-cream border-b border-dillo-gold/20">
              <div className="flex items-stretch divide-x divide-dillo-gold/20">

                <button
                  onClick={() => { dispatch({ type: 'OPEN_CART' }); setMobileOpen(false); }}
                  className="flex-1 flex flex-col items-center justify-center gap-1
                    py-3.5 relative hover:bg-dillo-red/5 transition-colors"
                  aria-label="Open cart"
                >
                  <span className="relative inline-flex">
                    <ShoppingCart size={22} className="text-dillo-charcoal" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-dillo-red text-white
                        text-[10px] w-4 h-4 flex items-center justify-center font-bold leading-none">
                        {cartCount}
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] font-body font-semibold text-dillo-charcoal
                    uppercase tracking-wider">Cart</span>
                </button>

                <Link
                  to="/wishlist"
                  className="flex-1 flex flex-col items-center justify-center gap-1
                    py-3.5 relative hover:bg-dillo-red/5 transition-colors"
                  aria-label="Wishlist"
                >
                  <span className="relative inline-flex">
                    <Heart size={22} className="text-dillo-charcoal" />
                    {wishlist.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-pink-500 text-white
                        text-[10px] w-4 h-4 flex items-center justify-center font-bold leading-none">
                        {wishlist.length}
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] font-body font-semibold text-dillo-charcoal
                    uppercase tracking-wider">Wishlist</span>
                </Link>

                <Link
                  to="/account"
                  className="flex-1 flex flex-col items-center justify-center gap-1
                    py-3.5 hover:bg-dillo-red/5 transition-colors"
                  aria-label="My Account"
                >
                  <User size={22} className="text-dillo-charcoal" />
                  <span className="text-[11px] font-body font-semibold text-dillo-charcoal
                    uppercase tracking-wider">Account</span>
                </Link>

              </div>
            </div>

            {/* 2. Nav links */}
            <div className="px-4 pt-2 pb-4">
              {navItems.map((item) => (
                <div key={item.label} className="border-b border-gray-50 last:border-0">
                  <div
                    className={`flex items-center justify-between py-3.5 font-body
                      font-semibold text-sm uppercase tracking-wider
                      ${item.highlight ? 'text-dillo-red' : 'text-dillo-charcoal'}`}
                  >
                    <Link to={item.href} className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="bg-dillo-red text-white text-[10px]
                          px-1.5 py-0.5 font-bold animate-pulse">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                    {item.submenu ? (
                      <button
                        type="button"
                        onClick={() => setMobileSubmenu(mobileSubmenu === item.label ? null : item.label)}
                        className="ml-3 p-1 text-gray-400 hover:text-dillo-red"
                        aria-label={`Toggle ${item.label} menu`}
                      >
                        <ChevronDown size={17} className={`transition-transform ${mobileSubmenu === item.label ? 'rotate-180' : ''}`} />
                      </button>
                    ) : (
                      <span className="ml-3 text-xs text-gray-400 font-normal normal-case tracking-normal">
                        {item.labelTa}
                      </span>
                    )}
                  </div>
                  {item.submenu && mobileSubmenu === item.label && (
                    <div className="pb-3 grid gap-4 animate-fade-in">
                      {item.submenu.map(group => (
                        <div key={group.heading} className="bg-dillo-ivory border border-gray-100 p-3">
                          <p className="text-[10px] font-cinzel font-semibold tracking-widest text-dillo-gold uppercase mb-2">
                            {group.heading}
                          </p>
                          <div className="grid gap-2">
                            {group.links.map(link => (
                              <Link
                                key={link.label}
                                to={link.href}
                                className="flex items-center gap-2 text-sm font-body text-dillo-charcoal hover:text-dillo-red"
                              >
                                {link.platform && <SocialBrandIcon platform={link.platform} size={14} />}
                                <span>{link.label}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* 3. Bottom CTA row */}
              <div className="pt-5 pb-1 flex gap-3">
                <a
                  href="tel:+919876543210"
                  className="btn-outline text-xs flex items-center gap-2
                    flex-1 justify-center py-3"
                >
                  <Phone size={14} /> Call Us
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline text-xs flex items-center gap-2
                    flex-1 justify-center py-3"
                >
                  <SocialBrandIcon platform="youtube" size={14} /> YouTube
                </a>
              </div>
            </div>

          </div>
        )}
        </div>
      </header>
      
      <div className="h-16 xl:h-32 2xl:h-36" aria-hidden="true" />
    </>
  );
}
