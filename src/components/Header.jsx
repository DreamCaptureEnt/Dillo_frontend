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

/*
  Logo dimensions: 562 × 444 px  →  aspect ratio ≈ 1.266 (landscape-ish square)
  Strategy: fix HEIGHT per breakpoint, let width auto-scale via object-contain.

  LAYOUT FIX (this version): TWO STACKED ROWS on desktop, not one row.

  Why the single-row 3-col grid still overlapped:
  `grid-cols-[1fr_auto_1fr]` correctly centers the logo column — that part
  was fixed. But this nav has 6 items, several multi-word ("Cost to Cost
  Sale", "Video Shopping"), all forced into a single `nowrap` line sharing
  ONE ROW with the centered logo. At real-world desktop widths, the nav's
  natural width is wider than its 1fr track, so it overflows past its own
  column boundary and runs straight under the logo. The columns were never
  the bug — there just wasn't enough horizontal room left over once a
  logo (with its banner) also needs a centered slot in that same row.

  The actual fix: stop asking one row to hold both a 6-item nav AND a
  centered logo AND 4 icons. Split into two rows, full width each:

    Row 1 (h-20 xl:h-24): logo only, perfectly centered, full breathing room
    Row 2 (h-14 xl:h-12): nav (centered) + icons (right-aligned), own row

  This is the same pattern used by most full-catalog Indian retail sites
  (logo banner row on top, nav below) — it isn't a style preference here,
  it's the only way to guarantee zero overlap at any screen width without
  constantly re-tuning padding per breakpoint.

  Header total heights:
    mobile  → logo row h-16 + (no separate nav row; nav lives in drawer)
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
            { label: 'YouTube',   href: '/live-show#youtube',   icon: '▶️' },
            { label: 'Instagram', href: '/live-show#instagram', icon: '📷' },
          ],
        },
      ],
    },
    {
      label: 'Cost to Cost Sale',
      labelTa: 'விலை குறைப்பு',
      href: '/cost-to-cost',
      highlight: true,
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
              <Phone size={12} /> +91 98765 43210
            </a>
            <a href="mailto:info@dillo.in"
              className="flex items-center gap-1.5 hover:text-dillo-red transition-colors whitespace-nowrap">
              <Mail size={12} /> info@dillo.in
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://youtube.com" target="_blank" rel="noreferrer"
              className="flex items-center gap-1 hover:text-dillo-red transition-colors whitespace-nowrap">
              <Youtube size={13} /> YouTube
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer"
              className="flex items-center gap-1 hover:text-dillo-red transition-colors whitespace-nowrap">
              <Instagram size={13} /> Instagram
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
        <div className="max-w-7xl mx-auto px-4">

          {/* ════════════════════════════════════════════════
              ROW 1 — LOGO ONLY, full width, perfectly centered.
              Mobile  (< xl): logo centered, hamburger + search anchored right.
              Desktop (≥ xl): logo centered, with a quiet left/right spacer
                              so it stays visually centered even though
                              nothing else shares this row.

              Original logo: 562 × 444 px (ratio 1.266 : 1).
              This row's only job is to give the logo (and its banner,
              if present) real vertical and horizontal breathing room —
              it no longer has to fight a 6-item nav for the same line.

              MOBILE CENTERING FIX:
              Previously both side columns were `auto`-width. The left
              column held an empty div (auto → 0px), the right column
              held search+hamburger (auto → ~84px). A 0px vs ~84px
              mismatch meant the middle "centered" column was actually
              centered between unequal gaps, dragging the logo visibly
              left — exactly what showed up on a real phone screen.
              Fix: force both side columns to the SAME fixed width
              (w-20, matching the icon cluster's real footprint) so the
              middle column is centered between two truly equal gaps,
              regardless of what each side contains.
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
              ROW 2 (desktop only) — NAV (centered) + ICONS (right)
              This row gets the FULL width to itself now, so all 6 nav
              items — including multi-word ones — have genuine room to
              breathe without ever needing to share space with the logo.
              ════════════════════════════════════════════════ */}
          <div className="hidden xl:flex items-center justify-between h-12 border-t border-gray-100">

            <nav className="flex items-center gap-0.5 min-w-0 flex-1 justify-center">
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

            <div className="flex items-center gap-1.5 flex-shrink-0">
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

          {activeDesktopItem?.submenu && (
            <div
              className="hidden xl:block absolute top-full left-1/2 -translate-x-1/2
                w-[min(880px,calc(100vw-3rem))] bg-white shadow-2xl border-t-2
                border-dillo-red animate-mega-menu z-[110]"
              onMouseEnter={() => setActiveMenu(activeDesktopItem.label)}
            >
              <div className="grid grid-cols-2 2xl:grid-cols-4 gap-6 p-6">
                {activeDesktopItem.submenu.map((group) => (
                  <div key={group.heading} className="min-w-0">
                    <p className="text-xs font-cinzel font-semibold tracking-widest
                      text-dillo-gold uppercase mb-3 pb-2 border-b border-gray-100">
                      {group.heading}
                    </p>
                    <ul className="space-y-2">
                      {group.links.map((link) => (
                        <li key={link.label}>
                          <Link to={link.href}
                            className="group/link flex items-center gap-2 text-sm font-body
                              text-dillo-charcoal hover:text-dillo-red transition-colors duration-150">
                            {link.icon && <span>{link.icon}</span>}
                            <span className="transition-transform duration-200 group-hover/link:translate-x-1">
                              {link.label}
                            </span>
                            {link.badge && (
                              <span className="text-[10px] bg-dillo-red text-white px-1.5 py-0.5 font-bold">
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
                                {link.icon && <span>{link.icon}</span>}
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
                  <Youtube size={14} /> YouTube
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