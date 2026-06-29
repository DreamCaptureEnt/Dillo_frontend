import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../pages/CartContext';
import { formatPrice } from '../products.js';
import StarRating from './StarRating';

export default function ProductCard({ product, view = 'grid' }) {
  const { wishlist, dispatch } = useCart();
  const isWishlisted = wishlist.includes(product.id);
  const images = Array.isArray(product.images) && product.images.length ? product.images : [];
  const [imageIndex, setImageIndex] = useState(0);
  const currentImage = images[imageIndex] || images[0];
  const hasMultipleImages = images.length > 1;

  const changeImage = (event, direction) => {
    event.preventDefault();
    event.stopPropagation();
    if (!hasMultipleImages) return;
    setImageIndex(current => (current + direction + images.length) % images.length);
  };

  const ImageArrows = ({ compact = false }) => {
    if (!hasMultipleImages) return null;
    const buttonClass = compact
      ? 'w-6 h-6 bg-white/90 text-dillo-charcoal hover:text-dillo-red shadow-sm'
      : 'w-8 h-8 bg-white/90 text-dillo-charcoal hover:text-dillo-red shadow-md';
    const iconSize = compact ? 13 : 16;
    return (
      <>
        <button
          type="button"
          onClick={e => changeImage(e, -1)}
          className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 focus:opacity-100 focus:translate-x-0 transition-all duration-200 ${buttonClass}`}
          aria-label="Previous product image"
        >
          <ChevronLeft size={iconSize} />
        </button>
        <button
          type="button"
          onClick={e => changeImage(e, 1)}
          className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 focus:opacity-100 focus:translate-x-0 transition-all duration-200 ${buttonClass}`}
          aria-label="Next product image"
        >
          <ChevronRight size={iconSize} />
        </button>
      </>
    );
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        product,
        selectedColor: product.colors?.[0] || null,
        quantity: 1,
      },
    });
    dispatch({ type: 'OPEN_CART' });
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_WISHLIST', payload: product.id });
  };

  if (view === 'list') {
    return (
      <Link to={`/products/${product.id}`} className="block">
        <div className="bg-white border border-gray-100 hover:shadow-lg transition-all duration-300 
          flex gap-0 overflow-hidden group">
          {/* Image */}
        <div className="relative w-28 sm:w-48 h-36 sm:h-56 flex-shrink-0 product-image-container group">
            <img
              src={currentImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <ImageArrows compact />
            {product.isNew && <span className="badge-new">New</span>}
            {product.discount > 0 && !product.isNew && (
              <span className="badge-sale">-{product.discount}%</span>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 p-3 sm:p-5 flex flex-col justify-between min-w-0">
            <div>
              <p className="text-xs text-dillo-gold font-body font-semibold uppercase tracking-widest mb-1">
                {product.type}
              </p>
              <h3 className="font-display font-bold text-sm sm:text-lg text-dillo-charcoal leading-snug line-clamp-2">
                {product.name}
              </h3>
              <p className="text-xs font-body text-gray-500 mt-0.5 hidden sm:block">{product.nameTa}</p>
              <StarRating rating={product.rating} count={product.reviewCount} size={13} />
              <p className="text-sm font-body text-gray-500 mt-2 line-clamp-2 leading-relaxed hidden sm:block">
                {product.description}
              </p>
            </div>
            <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="price-tag text-base sm:text-xl">{formatPrice(product.price)}</span>
                {product.originalPrice > product.price && (
                  <span className="original-price">{formatPrice(product.originalPrice)}</span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={handleWishlist}
                  className={`p-2 border transition-colors ${isWishlisted
                    ? 'border-pink-300 bg-pink-50 text-pink-500'
                    : 'border-gray-200 hover:border-dillo-red text-gray-400 hover:text-dillo-red'}`}>
                  <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
                </button>
                <button onClick={handleAddToCart} className="btn-primary py-2 px-3 sm:px-4 text-xs flex items-center gap-1 sm:gap-2">
                  <ShoppingCart size={14} /> <span className="hidden sm:inline">Add to Cart</span><span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/products/${product.id}`} className="block">
      <div className="product-card group h-full flex flex-col">
        {/* Image container */}
        <div className="relative overflow-hidden aspect-[3/4] product-image-container">
          <img
            src={currentImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <ImageArrows />
          
          {/* Badges */}
          {product.isNew && <span className="badge-new">New</span>}
          {product.discount > 0 && !product.isNew && (
            <span className="badge-sale">-{product.discount}%</span>
          )}
          {product.isBestseller && !product.isNew && (
            <span className="absolute top-3 right-3 bg-dillo-gold text-white text-[10px] font-bold 
              px-2 py-1 tracking-wide uppercase">★ Best</span>
          )}

          {/* Quick actions overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300">
            <div className="absolute bottom-0 left-0 right-0 flex gap-0 
              translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-dillo-red text-white py-3 text-xs font-body font-semibold 
                  uppercase tracking-wider flex items-center justify-center gap-2
                  hover:bg-dillo-red-dark transition-colors"
              >
                <ShoppingCart size={14} /> Add to Cart
              </button>
            </div>
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center 
              transition-all duration-200 ${isWishlisted
                ? 'bg-pink-500 text-white opacity-100'
                : 'bg-white text-gray-400 hover:text-pink-500 opacity-0 group-hover:opacity-100'}`}
          >
            <Heart size={14} fill={isWishlisted ? 'white' : 'none'} />
          </button>

          {/* Quick view */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute top-12 right-3 w-8 h-8 bg-white text-gray-400
              hover:text-dillo-red flex items-center justify-center transition-all duration-200
              opacity-0 group-hover:opacity-100"
          >
            <Eye size={14} />
          </button>

          {/* Stock warning */}
          {product.stockCount <= 5 && product.inStock && (
            <div className="absolute bottom-12 left-0 right-0 text-center bg-yellow-500/90 
              text-white text-[11px] py-1 font-body font-semibold translate-y-full 
              group-hover:translate-y-0 transition-transform duration-300 delay-100">
              Only {product.stockCount} left!
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1">
          <p className="text-[11px] font-cinzel text-dillo-gold uppercase tracking-widest mb-1">
            {product.type}
          </p>
          <h3 className="font-body font-semibold text-dillo-charcoal text-sm leading-snug line-clamp-2 
            group-hover:text-dillo-red transition-colors">
            {product.name}
          </h3>

          <div className="mt-1.5 mb-auto">
            <StarRating rating={product.rating} count={product.reviewCount} size={11} />
          </div>

          {/* Color dots */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex gap-1 mt-2">
              {product.colors.slice(0, 4).map(c => (
                <span key={c} className="w-3 h-3 rounded-full border border-gray-200 bg-gray-100"
                  title={c} />
              ))}
              {product.colors.length > 4 && (
                <span className="text-[10px] text-gray-400">+{product.colors.length - 4}</span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="min-w-0">
              <span className="price-tag text-base">{formatPrice(product.price)}</span>
              {product.originalPrice > product.price && (
                <span className="original-price text-xs ml-1.5">{formatPrice(product.originalPrice)}</span>
              )}
            </div>
            {product.discount > 0 && (
              <span className="text-xs font-body font-bold text-green-600">
                {product.discount}% off
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
