import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart, Heart, Search, Menu, X, ChevronDown,
  Phone, Mail, User, Youtube, Instagram,
} from 'lucide-react';
import DilloLogo from './../assets/Logo.png';
import { useCart } from '../pages/CartContext';
import { announcements } from '../products.js';
import { apiFetch } from '../api';

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
  const [menuData, setMenuData]       = useState({
    categories: [],
    types: [],
    occasions: [],
  });
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
    let mounted = true;
    Promise.all([
      apiFetch('/saree-categories/?page_size=100&is_active=true'),
      apiFetch('/saree-type-options/?page_size=100&is_active=true'),
      apiFetch('/occasion-categories/?page_size=100&is_active=true'),
    ])
      .then(([categoryPayload, typePayload, occasionPayload]) => {
        if (!mounted) return;
        const getResults = payload => Array.isArray(payload) ? payload : payload?.results || [];
        setMenuData({
          categories: getResults(categoryPayload).filter(item => item.is_active ?? true),
          types: getResults(typePayload).filter(item => item.is_active ?? true),
          occasions: getResults(occasionPayload).filter(item => item.is_active ?? true),
        });
      })
      .catch(console.error);
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

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

  const sareesCategory = menuData.categories.find(item => (item.slug || '').toLowerCase() === 'sarees');
  const defaultCategory = sareesCategory?.slug || menuData.categories[0]?.slug || 'sarees';
  const categoryLinks = menuData.categories.length
    ? menuData.categories.map(item => ({
        label: item.name,
        href: `/products?category=${encodeURIComponent(item.slug || item.name)}`,
      }))
    : [
        { label: 'Sarees', href: '/products?category=sarees' },
        { label: 'Readymade', href: '/products?category=readymade' },
      ];
  const typeLinks = menuData.types.length
    ? menuData.types.map(item => ({
        label: item.name,
        href: `/products?category=${encodeURIComponent(defaultCategory)}&type=${encodeURIComponent(item.name)}`,
      }))
    : [
        { label: 'Kanjivaram Silk', href: '/products?category=sarees&type=Kanjivaram' },
        { label: 'Banarasi Silk', href: '/products?category=sarees&type=Banarasi' },
        { label: 'Chanderi', href: '/products?category=sarees&type=Chanderi' },
        { label: 'Mysore Silk', href: '/products?category=sarees&type=Mysore+Silk' },
        { label: 'Dharmavaram', href: '/products?category=sarees&type=Dharmavaram' },
        { label: 'Patola', href: '/products?category=sarees&type=Patola' },
      ];
  const occasionLinks = menuData.occasions.length
    ? menuData.occasions.map(item => ({
        label: `${item.name} Sarees`,
        href: `/products?category=${encodeURIComponent(defaultCategory)}&occasion=${encodeURIComponent(item.slug || item.name)}`,
      }))
    : [
        { label: 'Bridal Sarees', href: '/products?category=sarees&occasion=Wedding' },
        { label: 'Festival Sarees', href: '/products?category=sarees&occasion=Festival' },
        { label: 'Party Wear', href: '/products?category=sarees&occasion=Party' },
        { label: 'Casual Sarees', href: '/products?category=sarees&occasion=Casual' },
      ];

  const navItems = [
    {
      label: 'Sarees',
      labelTa: 'சேலைகள்',
      href: `/products?category=${encodeURIComponent(defaultCategory)}`,
      submenu: [
        {
          heading: 'By Category',
          links: categoryLinks,
        },
        {
          heading: 'By Type',
          links: typeLinks,
        },
        {
          heading: 'By Occasion',
          links: occasionLinks,
        },
        {
          heading: 'Shop',
          links: [
            { label: 'Trending Now', href: '/new-arrivals',              badge: 'New' },
            { label: 'Best Sellers', href: '/products?filter=bestseller' },
            { label: 'Sale',         href: '/cost-to-cost',              badge: 'Sale' },
            { label: 'All Sarees',   href: `/products?category=${encodeURIComponent(defaultCategory)}` },
          ],
        },
      ],
    },
    {
      label: 'Trending Now',
      labelTa: 'புதிய வரவுகள்',
      href: '/new-arrivals',
    },
    {
      label: 'Youtube/ insta',
      labelTa: 'நேரலை நிகழ்ச்சி',
      href: '/live-show',
      submenu: [
        {
          heading: 'Platforms',
          links: [
            { label: 'YouTube',   href: '/live-show#youtube',   platform: 'youtube' },
            { label: 'Instagram', href: '/live-show#instagram', platform: 'instagram' },
          ],
        },
      ],
    },
    // {
    //   label: 'Cost to Cost Sale',
    //   labelTa: 'விலை குறைப்பு',
    //   href: '/cost-to-cost',
    //   highlight: true,
    // },
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
  const activeDesktopItem = navItems.find(item => item.label === activeMenu);

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
                  className="relative group"
                  onMouseEnter={() => setActiveMenu(item.label)}
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
                        className="opacity-60 group-hover:rotate-180 transition-transform duration-200 flex-shrink-0" />
                    )}
                  </Link>
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
                  placeholder="Search sarees, fabric, readymade..."
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

          {activeDesktopItem?.submenu && (() => {
            /* Width & column count both derive from how many groups this
               particular item actually has (1 for "Youtube/ insta", 4 for
               "Sarees") instead of a single fixed size for every menu —
               that's what made a 1-group menu look like an oversized,
               half-empty box. Capped at 4 columns / ~640px so it never
               sprawls even on very wide desktops. */
            const groupCount = Math.min(activeDesktopItem.submenu.length, 4);
            const colWidth = 168; // px per column, compact but readable
            const menuWidth = groupCount * colWidth + (groupCount - 1) * 24 + 32; // cols + gaps + padding

            return (
              <div
                className="hidden xl:block absolute top-full left-1/2 -translate-x-1/2 mt-1.5
                  bg-white rounded-xl shadow-lg shadow-dillo-charcoal/10 border border-gray-100
                  ring-1 ring-black/[0.03] animate-mega-menu z-[110] overflow-hidden"
                style={{ width: `min(${menuWidth}px, calc(100vw - 2rem))` }}
                onMouseEnter={() => setActiveMenu(activeDesktopItem.label)}
              >
                <div className="h-[3px] bg-dillo-red" />
                <div
                  className="grid gap-x-6 gap-y-4 p-4"
                  style={{ gridTemplateColumns: `repeat(${groupCount}, minmax(0, 1fr))` }}
                >
                  {activeDesktopItem.submenu.map((group) => (
                    <div key={group.heading} className="min-w-0">
                      <p className="text-[10.5px] font-cinzel font-semibold tracking-wider
                        text-dillo-gold uppercase mb-1.5 pb-1.5 border-b border-gray-100">
                        {group.heading}
                      </p>
                      {/*
                        SCROLLBAR FIX:
                        The site's global scrollbar CSS (thick, brand-red
                        thumb — meant for the main page scroll) was being
                        inherited by this inner list the moment it
                        overflowed, so a column with a few extra links
                        would sprout a scrollbar almost as wide as the
                        column itself — the "huge red bar" in the column.

                        Fix, scoped to just this list so it never touches
                        the global scrollbar elsewhere on the site:
                          - overflow-y-auto + overflow-x-hidden: this list
                            only ever scrolls vertically. Horizontal
                            overflow is prevented at the source (truncate
                            on the link label) rather than scrolled.
                          - [&::-webkit-scrollbar]:w-1 and friends: a
                            hairline 4px thumb instead of the global
                            thick/red one, only rendered by the browser
                            when content actually exceeds max-h (native
                            `auto` behavior — no JS needed to detect
                            overflow).
                          - scrollbarWidth/scrollbarColor: same thin,
                            neutral treatment on Firefox, which ignores
                            the ::-webkit-scrollbar rules.
                          - pr-1.5: keeps the thumb from sitting flush
                            against link text when it does appear.
                      */}
                      <ul
                        className="space-y-0.5 max-h-56 overflow-y-auto overflow-x-hidden pr-1.5
                          [&::-webkit-scrollbar]:w-1
                          [&::-webkit-scrollbar-track]:bg-transparent
                          [&::-webkit-scrollbar-thumb]:bg-gray-300
                          [&::-webkit-scrollbar-thumb]:rounded-full
                          hover:[&::-webkit-scrollbar-thumb]:bg-gray-400"
                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}
                      >
                        {group.links.map((link) => (
                          <li key={link.label}>
                            <Link to={link.href}
                              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 -mx-2 text-[13px]
                                font-body text-dillo-charcoal hover:bg-dillo-cream hover:text-dillo-red
                                transition-colors duration-150">
                              {link.platform && <SocialBrandIcon platform={link.platform} size={13} />}
                              <span className="truncate">{link.label}</span>
                              {link.badge && (
                                <span className="ml-auto flex-shrink-0 text-[9px] bg-dillo-red text-white
                                  px-1.5 py-0.5 rounded font-bold leading-none">
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
            );
          })()}
        </div>

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
      </header>
      <div className="h-16 xl:h-32 2xl:h-36" aria-hidden="true" />
    </>
  );
}
