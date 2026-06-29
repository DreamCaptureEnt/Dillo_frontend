import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart, ShoppingCart, Share2, Truck, Shield, RefreshCw,
  ChevronLeft, ChevronRight, ZoomIn, Star, Check, Plus, Minus,
  MapPin, ChevronDown, ChevronUp, Play
} from 'lucide-react';
import { apiFetch, toQuery } from '../api';
import { formatPrice, sampleReviews } from '../products.js';
import { useCart } from './CartContext';
import ProductCard from '../components/ProductCard';
import StarRating from '../components/StarRating';
import { LogoLoader } from '../components/Preloader';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80';

/* ── helpers ─────────────────────────────────────────────────────────────── */
function getResults(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.results || [];
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeProduct(product) {
  const price = toNumber(product.price);
  const originalPrice = toNumber(
    product.original_price ?? product.originalPrice ?? product.price,
    price
  );
  const images =
    Array.isArray(product.images) && product.images.length
      ? product.images
      : [FALLBACK_IMAGE];
  const id = product.slug || String(product.id);

  return {
    id,
    backendId: product.id,
    productCode: product.product_code || product.productCode || '',
    slug: product.slug || id,
    name: product.name || 'Untitled Product',
    nameTa: product.name_ta || product.nameTa || '',
    category:
      product.category_slug ||
      product.categorySlug ||
      String(product.category || ''),
    categoryName: product.category_name || product.categoryName || '',
    type: product.saree_type || product.type || '',
    occasion:
      product.occasion_slug ||
      product.occasionSlug ||
      product.occasion_name ||
      product.occasion ||
      '',
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
    inStock: Boolean(
      product.in_stock ?? product.inStock ?? toNumber(product.stock_count) > 0
    ),
    stockCount: toNumber(product.stock_count ?? product.stockCount),
    rating: toNumber(product.rating),
    reviewCount: toNumber(product.review_count ?? product.reviewCount),
    description: product.description || '',
    details: product.information || product.details || {},
    tags: Array.isArray(product.tags) ? product.tags : [],
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   IMAGE VIEWER
═══════════════════════════════════════════════════════════════════════════ */
function ImageViewer({ images, video }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const allMedia = video ? [...images, 'VIDEO'] : images;

  useEffect(() => {
    setActive(0);
    setZoomed(false);
  }, [images, video]);

  const prev = () =>
    setActive(a => (a - 1 + allMedia.length) % allMedia.length);
  const next = () => setActive(a => (a + 1) % allMedia.length);

  const handleMouseMove = e => {
    if (!zoomed) return;
    const r = e.currentTarget.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* ── Main frame ── */}
      <div
        className={`relative w-full overflow-hidden bg-white border border-gray-100 select-none
          ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
        style={{ aspectRatio: '3 / 4' }}
        onClick={() => setZoomed(z => !z)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoomed(false)}
      >
        {allMedia[active] === 'VIDEO' ? (
          <div className="w-full h-full bg-black flex flex-col items-center justify-center gap-3">
            <button className="w-16 h-16 bg-dillo-red rounded-full flex items-center justify-center shadow-lg">
              <Play size={28} className="text-white ml-1" fill="white" />
            </button>
            <p className="text-white text-sm font-body">Product Video</p>
          </div>
        ) : (
          <>
            <img
              src={allMedia[active]}
              alt="Product"
              draggable={false}
              className="w-full h-full object-contain"
              style={
                zoomed
                  ? {
                      transform: 'scale(2.5)',
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                      transition: 'none',
                    }
                  : { transition: 'transform 0.2s ease' }
              }
            />
            {!zoomed && (
              <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs
                px-2 py-1 flex items-center gap-1 pointer-events-none">
                <ZoomIn size={11} />
                <span>Hover to zoom</span>
              </div>
            )}
          </>
        )}

        {/* Arrows */}
        {allMedia.length > 1 && (
          <>
            <button
              onClick={e => { e.stopPropagation(); prev(); }}
              aria-label="Previous image"
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 bg-white/95
                flex items-center justify-center shadow hover:bg-dillo-red hover:text-white transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); next(); }}
              aria-label="Next image"
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 bg-white/95
                flex items-center justify-center shadow hover:bg-dillo-red hover:text-white transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-0.5 font-body">
          {active + 1} / {allMedia.length}
        </div>
      </div>

      {/* ── Thumbnails ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {allMedia.map((img, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`View image ${i + 1}`}
            className={`flex-shrink-0 w-14 h-[4.5rem] sm:w-16 sm:h-20 overflow-hidden
              border-2 transition-all
              ${i === active
                ? 'border-dillo-red'
                : 'border-transparent hover:border-dillo-gold'}`}
          >
            {img === 'VIDEO' ? (
              <div className="w-full h-full bg-dillo-charcoal flex items-center justify-center">
                <Play size={14} className="text-white" fill="white" />
              </div>
            ) : (
              <img
                src={img}
                alt=""
                draggable={false}
                className="w-full h-full object-cover"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COLLAPSIBLE SECTION
═══════════════════════════════════════════════════════════════════════════ */
function AccordionSection({ id, label, openSection, setOpenSection, children }) {
  const isOpen = openSection === id;
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpenSection(isOpen ? null : id)}
        className="flex items-center justify-between w-full py-4 text-left"
      >
        <span className="font-body font-semibold text-sm uppercase tracking-wider text-dillo-charcoal">
          {label}
        </span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {isOpen && <div className="pb-4 animate-fade-in">{children}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRODUCT INFO
═══════════════════════════════════════════════════════════════════════════ */
function ProductInfo({ product }) {
  const { dispatch, wishlist } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState(null); // 'ok' | 'fail' | null
  const [openSection, setOpenSection] = useState('description');
  const isWishlisted = wishlist.includes(product.id);

  const handleAddToCart = () => {
    dispatch({
      type: 'ADD_TO_CART',
      payload: { product, selectedColor, selectedSize, quantity },
    });
    dispatch({ type: 'OPEN_CART' });
  };

  const handleBuyNow = () => {
    dispatch({
      type: 'ADD_TO_CART',
      payload: { product, selectedColor, selectedSize, quantity },
    });
  };

  const checkPincode = () => {
    if (pincode.length === 6)
      setPincodeStatus(Math.random() > 0.2 ? 'ok' : 'fail');
  };

  /* ── trust badges data ── */
  const badges = [
    { icon: <Truck size={17} />, label: 'Free Shipping', sub: 'Above ₹2000' },
    { icon: <RefreshCw size={17} />, label: '7-Day Return', sub: 'Easy returns' },
    { icon: <Shield size={17} />, label: 'Authentic', sub: 'Certified silk' },
  ];

  return (
    <div className="space-y-5">

      {/* Category eyebrow */}
      <p className="text-xs font-cinzel text-dillo-gold uppercase tracking-widest">
        {product.categoryName || product.category}
        {product.type ? ` / ${product.type}` : ''}
      </p>

      {/* Title */}
      <div>
        <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold
          text-dillo-charcoal leading-snug">
          {product.name}
        </h1>
        {product.nameTa && (
          <p className="font-body text-sm text-gray-500 mt-1">{product.nameTa}</p>
        )}
        {product.productCode && (
          <p className="font-body text-xs font-semibold text-dillo-red mt-2">
            Product ID: {product.productCode}
          </p>
        )}
      </div>

      {/* Rating row */}
      <div className="flex items-center gap-3 flex-wrap">
        <StarRating rating={product.rating} count={product.reviewCount} size={15} />
        <span className="text-xs text-gray-400 font-body">
          {product.rating} out of 5
        </span>
      </div>

      {/* Price block */}
      <div className="bg-dillo-cream border-l-4 border-dillo-red px-4 py-3">
        <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
          <span className="price-tag text-2xl sm:text-3xl">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice > product.price && (
            <>
              <span className="original-price text-sm sm:text-base">
                {formatPrice(product.originalPrice)}
              </span>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5">
                {product.discount}% OFF
              </span>
            </>
          )}
        </div>
        <p className="text-xs font-body text-gray-500 mt-1">Inclusive of all taxes</p>
      </div>

      {/* Stock status */}
      <div className="flex items-center gap-2 flex-wrap">
        {product.inStock ? (
          <>
            <Check size={15} className="text-green-600 flex-shrink-0" />
            <span className="font-body text-sm text-green-700 font-semibold">
              In Stock
            </span>
            {product.stockCount > 0 && product.stockCount <= 10 && (
              <span className="font-body text-xs text-orange-600">
                (Only {product.stockCount} left!)
              </span>
            )}
          </>
        ) : (
          <span className="font-body text-sm text-red-600 font-semibold">
            Out of Stock
          </span>
        )}
      </div>

      {/* Color selector */}
      {product.colors?.length > 0 && (
        <div>
          <p className="font-body text-sm font-semibold text-dillo-charcoal mb-2">
            Color:{' '}
            <span className="text-dillo-red font-normal">{selectedColor}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {product.colors.map(c => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className={`px-3 py-1.5 text-sm font-body border transition-all
                  ${selectedColor === c
                    ? 'border-dillo-red bg-dillo-red/10 text-dillo-red font-semibold'
                    : 'border-gray-200 hover:border-dillo-red text-gray-600'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size selector */}
      {product.details?.sizes && (
        <div>
          <div className="flex items-center justify-between mb-2 gap-2">
            <p className="font-body text-sm font-semibold text-dillo-charcoal">
              Size:{' '}
              <span className="text-dillo-red font-normal">
                {selectedSize || 'Select'}
              </span>
            </p>
            <Link
              to="/size-guide"
              className="text-xs text-dillo-red underline font-body flex-shrink-0"
            >
              Size Guide
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.details.sizes.map(s => (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                className={`w-11 h-10 text-sm font-body font-semibold border transition-all
                  ${selectedSize === s
                    ? 'border-dillo-red bg-dillo-red text-white'
                    : 'border-gray-200 hover:border-dillo-red text-gray-600'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <p className="font-body text-sm font-semibold text-dillo-charcoal mb-2">
          Quantity:
        </p>
        <div className="inline-flex items-center border border-gray-200">
          <button
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="w-10 h-10 flex items-center justify-center
              text-gray-500 hover:text-dillo-red hover:bg-gray-50 transition-colors"
          >
            <Minus size={15} />
          </button>
          <span className="w-11 text-center font-body font-bold text-base select-none">
            {quantity}
          </span>
          <button
            onClick={() =>
              setQuantity(q =>
                Math.min(Math.max(product.stockCount, 1), q + 1)
              )
            }
            aria-label="Increase quantity"
            className="w-10 h-10 flex items-center justify-center
              text-gray-500 hover:text-dillo-red hover:bg-gray-50 transition-colors"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* ── CTA row ─────────────────────────────────────────────────────────
          Key rules:
          • All four elements share h-12 — enforced here, NOT in CSS base class
          • btn-primary / btn-outline in CSS no longer include px-* / py-*
          • "Add to Cart" and "Buy Now" grow equally (flex-1 min-w-0)
          • Heart + Share are fixed-width squares (w-12 flex-shrink-0)
          • whitespace-nowrap prevents label wrapping on narrow screens
      ──────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3rem_3rem] gap-2 max-[420px]:grid-cols-2">
        <button
          onClick={handleAddToCart}
          disabled={!product.inStock}
          className="btn-outline h-12 min-w-0 gap-2 px-3 sm:px-4
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart size={16} className="flex-shrink-0" />
          <span className="whitespace-nowrap text-xs sm:text-sm">Add to Cart</span>
        </button>

        <Link
          to="/checkout"
          onClick={handleBuyNow}
          className={`btn-primary h-12 min-w-0 gap-2 px-3 sm:px-4
            ${!product.inStock ? 'pointer-events-none opacity-50' : ''}`}
        >
          <span className="whitespace-nowrap text-xs sm:text-sm">Buy Now</span>
        </Link>

        <button
          onClick={() =>
            dispatch({ type: 'TOGGLE_WISHLIST', payload: product.id })
          }
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`w-12 h-12 max-[420px]:w-full flex items-center justify-center
            border-2 transition-all
            ${isWishlisted
              ? 'border-pink-400 bg-pink-50 text-pink-500'
              : 'border-gray-200 hover:border-pink-400 text-gray-400'}`}
        >
          <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>

        <button
          aria-label="Share product"
          className="w-12 h-12 max-[420px]:w-full flex items-center justify-center
            border-2 border-gray-200 hover:border-dillo-red
            text-gray-400 hover:text-dillo-red transition-all"
        >
          <Share2 size={17} />
        </button>
      </div>

      {/* Delivery checker */}
      <div className="border border-gray-100 p-4 bg-dillo-ivory">
        <p className="font-body text-sm font-semibold text-dillo-charcoal mb-3
          flex items-center gap-2">
          <MapPin size={14} className="text-dillo-red flex-shrink-0" />
          Check Delivery
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter pincode"
            value={pincode}
            onChange={e => {
              setPincode(e.target.value.replace(/\D/, ''));
              setPincodeStatus(null);
            }}
            className="input-field flex-1 min-w-0 py-2 text-sm"
          />
          <button
            onClick={checkPincode}
            className="btn-primary h-10 px-4 text-xs flex-shrink-0"
          >
            Check
          </button>
        </div>
        {pincodeStatus === 'ok' && (
          <p className="text-xs text-green-600 mt-2 font-body flex items-center gap-1">
            <Check size={11} className="flex-shrink-0" />
            Delivery available · Estimated 3–5 business days
          </p>
        )}
        {pincodeStatus === 'fail' && (
          <p className="text-xs text-red-500 mt-2 font-body">
            Sorry, delivery not available to this pincode.
          </p>
        )}
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-2">
        {badges.map(b => (
          <div
            key={b.label}
            className="border border-gray-100 p-2 sm:p-3 bg-white
              flex flex-col items-center gap-1 text-center"
          >
            <span className="text-dillo-red">{b.icon}</span>
            <p className="font-body font-semibold text-[10px] sm:text-[11px]
              text-dillo-charcoal leading-tight">
              {b.label}
            </p>
            <p className="font-body text-[9px] sm:text-[10px] text-gray-400 leading-tight">
              {b.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Accordion info */}
      <div className="border-t border-gray-100">
        <AccordionSection
          id="description"
          label="Description"
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <p className="font-body text-sm text-gray-600 leading-relaxed">
            {product.description}
          </p>
        </AccordionSection>

        <AccordionSection
          id="details"
          label="Product Details"
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          {Object.entries(product.details || {}).filter(([k]) => k !== 'sizes')
            .length === 0 ? (
            <p className="font-body text-sm text-gray-400">
              No additional details available.
            </p>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
              {Object.entries(product.details || {})
                .filter(([k]) => k !== 'sizes')
                .map(([key, val]) => (
                  <div key={key} className="bg-gray-50 p-3">
                    <p className="text-[10px] font-cinzel text-dillo-gold
                      uppercase tracking-wider mb-0.5">
                      {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="font-body text-sm text-dillo-charcoal font-semibold">
                      {Array.isArray(val) ? val.join(', ') : val}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </AccordionSection>

        {product.tags?.length > 0 && (
          <AccordionSection
            id="tags"
            label="Tags"
            openSection={openSection}
            setOpenSection={setOpenSection}
          >
            <div className="flex flex-wrap gap-2">
              {product.tags.map(t => (
                <Link
                  key={t}
                  to={`/products?search=${t}`}
                  className="text-xs bg-gray-100 hover:bg-dillo-red hover:text-white
                    text-gray-600 px-3 py-1 transition-colors font-body"
                >
                  #{t}
                </Link>
              ))}
            </div>
          </AccordionSection>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   REVIEWS SECTION
═══════════════════════════════════════════════════════════════════════════ */
function ReviewsSection({ productId, rating, reviewCount }) {
  const reviews = sampleReviews.filter(
    r => String(r.productId) === String(productId)
  );
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', content: '' });

  const ratingBars = [5, 4, 3, 2, 1].map(s => ({
    stars: s,
    count: reviews.filter(r => r.rating === s).length,
    percent: reviews.length
      ? (reviews.filter(r => r.rating === s).length / reviews.length) * 100
      : 0,
  }));

  return (
    <section className="mt-12 border-t border-gray-100 pt-10">
      <h2 className="font-display text-xl sm:text-2xl font-bold text-dillo-charcoal mb-8">
        Customer Reviews
      </h2>

      <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 mb-8">
        {/* Score card */}
        <div className="bg-dillo-cream p-6 flex flex-col items-center justify-center text-center">
          <p className="font-display text-5xl sm:text-6xl font-bold text-dillo-red mb-2">
            {rating}
          </p>
          <StarRating rating={rating} showCount={false} size={18} />
          <p className="font-body text-sm text-gray-500 mt-2">
            Based on {reviewCount} reviews
          </p>
        </div>

        {/* Bar chart */}
        <div className="sm:col-span-2 space-y-2">
          {ratingBars.map(bar => (
            <div key={bar.stars} className="flex items-center gap-3">
              <span className="font-body text-sm text-gray-600 w-4 flex-shrink-0">
                {bar.stars}
              </span>
              <Star
                size={13}
                className="fill-dillo-gold text-dillo-gold flex-shrink-0"
              />
              <div className="flex-1 h-2 bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-dillo-gold transition-all duration-500"
                  style={{ width: `${bar.percent}%` }}
                />
              </div>
              <span className="font-body text-xs text-gray-400 w-4 flex-shrink-0 text-right">
                {bar.count}
              </span>
            </div>
          ))}
          <button
            onClick={() => setShowForm(f => !f)}
            className="btn-outline h-9 px-4 text-xs mt-4 gap-1.5"
          >
            <Star size={13} />
            Write a Review
          </button>
        </div>
      </div>

      {/* Review form */}
      {showForm && (
        <div className="bg-dillo-cream border border-dillo-gold/30 p-4 sm:p-6
          mb-8 animate-slide-up">
          <h3 className="font-display font-bold text-lg text-dillo-charcoal mb-4">
            Write Your Review
          </h3>
          <div className="space-y-4">
            <div>
              <p className="font-body text-sm mb-2">Your Rating *</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    onClick={() => setNewReview(r => ({ ...r, rating: s }))}
                    aria-label={`${s} star`}
                  >
                    <Star
                      size={24}
                      className={
                        s <= newReview.rating
                          ? 'fill-dillo-gold text-dillo-gold'
                          : 'text-gray-300 hover:text-dillo-gold transition-colors'
                      }
                    />
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              placeholder="Review title"
              value={newReview.title}
              onChange={e => setNewReview(r => ({ ...r, title: e.target.value }))}
              className="input-field"
            />
            <textarea
              rows={4}
              placeholder="Share your experience…"
              value={newReview.content}
              onChange={e =>
                setNewReview(r => ({ ...r, content: e.target.value }))
              }
              className="input-field resize-none"
            />
            <div className="flex gap-3 flex-wrap">
              <button className="btn-primary h-10 px-5 text-xs">
                Submit Review
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="btn-outline h-10 px-5 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <p className="font-body text-gray-400 text-center py-8">
            No reviews yet. Be the first to review!
          </p>
        ) : (
          reviews.map(r => (
            <div key={r.id} className="border-b border-gray-100 pb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <StarRating rating={r.rating} showCount={false} size={14} />
                  <h4 className="font-body font-bold text-sm text-dillo-charcoal mt-1">
                    {r.title}
                  </h4>
                </div>
                {r.verified && (
                  <span className="flex items-center gap-1 text-[11px] text-green-600
                    bg-green-50 px-2 py-1 flex-shrink-0 whitespace-nowrap">
                    <Check size={10} /> Verified
                  </span>
                )}
              </div>
              <p className="font-body text-sm text-gray-600 leading-relaxed mt-2">
                {r.content}
              </p>
              <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-body font-semibold text-xs text-dillo-charcoal">
                    {r.name}
                  </span>
                  <span className="font-body text-xs text-gray-400">
                    {new Date(r.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <button className="text-xs text-gray-400 hover:text-dillo-red font-body">
                  Helpful ({r.helpful})
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   RELATED PRODUCTS
═══════════════════════════════════════════════════════════════════════════ */
function RelatedProducts({ product }) {
  const [related, setRelated] = useState([]);

  useEffect(() => {
    let mounted = true;
    const q = product.category
      ? { page_size: 8, category: product.category }
      : { page_size: 8 };

    apiFetch(`/sarees/${toQuery(q)}`)
      .then(payload => {
        if (!mounted) return;
        setRelated(
          getResults(payload)
            .map(normalizeProduct)
            .filter(item => item.id !== product.id)
            .slice(0, 4)
        );
      })
      .catch(console.error);

    return () => { mounted = false; };
  }, [product.category, product.id]);

  if (!related.length) return null;

  return (
    <section className="mt-14 border-t border-gray-100 pt-10">
      <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-dillo-charcoal">
          Related {product.categoryName || product.category ? `${product.categoryName || product.category} Items` : 'Items'}
        </h2>
        <Link
          to="/products"
          className="text-dillo-red font-body text-sm font-semibold flex items-center
            gap-1 uppercase tracking-wide hover:gap-2 transition-all"
        >
          View All <ChevronRight size={15} />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {related.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE ROOT
═══════════════════════════════════════════════════════════════════════════ */
export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    window.scrollTo(0, 0);

    apiFetch(`/sarees/${id}/`)
      .then(data => {
        if (mounted) setProduct(normalizeProduct(data));
      })
      .catch(async err => {
        try {
          const payload = await apiFetch('/sarees/?page_size=200');
          const match = getResults(payload).find(
            item =>
              String(item.id) === String(id) ||
              String(item.slug) === String(id)
          );
          if (!match) throw err;
          if (mounted) setProduct(normalizeProduct(match));
        } catch {
          console.error(err);
          if (mounted) setError(err.message || 'Product not found');
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dillo-ivory">
        <LogoLoader size="lg" label="Loading product..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dillo-ivory px-4">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-dillo-charcoal mb-3">
            Product Not Found
          </h2>
          {error && (
            <p className="font-body text-sm text-gray-500 mb-4">{error}</p>
          )}
          <button
            onClick={() => navigate('/products')}
            className="btn-primary h-11 px-6"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dillo-ivory">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="text-xs font-body text-gray-500 flex items-center
            gap-1.5 flex-wrap min-w-0">
            <Link to="/" className="hover:text-dillo-red whitespace-nowrap">
              Home
            </Link>
            <span className="text-gray-300">/</span>
            <Link to="/products" className="hover:text-dillo-red whitespace-nowrap">
              Products
            </Link>
            <span className="text-gray-300">/</span>
            <Link
              to={`/products?category=${product.category}`}
              className="hover:text-dillo-red capitalize whitespace-nowrap"
            >
              {product.categoryName || product.category}
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-dillo-charcoal font-semibold truncate
              max-w-[140px] sm:max-w-[260px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-14">

          {/* Sticky image panel */}
          <div className="md:sticky md:top-24 md:self-start">
            <ImageViewer images={product.images} video={product.video} />
          </div>

          {/* Info panel */}
          <div>
            <ProductInfo key={product.id} product={product} />
          </div>
        </div>

        <ReviewsSection
          productId={product.backendId || product.id}
          rating={product.rating}
          reviewCount={product.reviewCount}
        />

        <RelatedProducts product={product} />
      </div>
    </div>
  );
}

