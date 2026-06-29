import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, Tag, ChevronRight, Truck, Gift } from 'lucide-react';
import { useCart } from './CartContext';
import { formatPrice } from '../products.js';

export default function CartDrawer() {
  const {
    isCartOpen, cartItems, subtotal, discount, shipping, total, savings,
    appliedCoupon, couponError,
    dispatch,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');

  const handleApplyCoupon = () => {
    dispatch({ type: 'APPLY_COUPON', payload: couponInput });
    setCouponInput('');
  };

  if (!isCartOpen) return null;

  const freeShippingProgress = Math.min((subtotal / 2000) * 100, 100);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[60] animate-fade-in"
        onClick={() => dispatch({ type: 'CLOSE_CART' })}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[92vw] sm:w-full max-w-[440px] bg-white z-[70]
        flex flex-col shadow-2xl animate-slide-in-right">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-dillo-ivory">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-dillo-red" />
            <h2 className="font-display text-xl font-bold text-dillo-charcoal">Shopping Cart</h2>
            {cartItems.length > 0 && (
              <span className="bg-dillo-red text-white text-xs font-bold px-2 py-0.5 rounded-sm">
                {cartItems.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <button
            onClick={() => dispatch({ type: 'CLOSE_CART' })}
            className="p-2 hover:bg-gray-200 transition-colors text-gray-500 rounded-sm"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free shipping progress */}
        {cartItems.length > 0 && (
          <div className={`px-5 py-3 border-b ${subtotal >= 2000 ? 'bg-green-50 border-green-100' : 'bg-dillo-cream border-dillo-gold/20'}`}>
            {subtotal < 2000 ? (
              <>
                <div className="flex items-center justify-between text-xs font-body mb-2">
                  <span className="flex items-center gap-1.5 text-dillo-charcoal font-semibold">
                    <Truck size={13} className="text-dillo-red" />
                    Add <span className="text-dillo-red">{formatPrice(2000 - subtotal)}</span> more for FREE shipping!
                  </span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-dillo-red transition-all duration-500 rounded-full"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-green-600" />
                <span className="text-xs font-body text-green-700 font-semibold">🎉 You've unlocked FREE shipping!</span>
              </div>
            )}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-5 px-6 py-12">
              <div className="w-20 h-20 bg-dillo-cream rounded-full flex items-center justify-center">
                <ShoppingBag size={36} className="text-dillo-gold/50" />
              </div>
              <div>
                <p className="font-display text-xl font-bold text-gray-400">Your cart is empty</p>
                <p className="font-body text-sm text-gray-400 mt-1">
                  Discover our beautiful saree collection
                </p>
              </div>
              <button
                onClick={() => dispatch({ type: 'CLOSE_CART' })}
                className="btn-primary text-sm"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 px-5">
              {cartItems.map((item) => (
                <div key={item.key} className="flex items-start gap-4 py-4">
                  {/* Product image */}
                  <Link
                    to={`/products/${item.product.id}`}
                    onClick={() => dispatch({ type: 'CLOSE_CART' })}
                    className="w-18 h-22 flex-shrink-0 overflow-hidden border border-gray-100 block"
                    style={{ width: 72, height: 88 }}
                  >
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${item.product.id}`}
                      onClick={() => dispatch({ type: 'CLOSE_CART' })}
                      className="font-body font-semibold text-sm text-dillo-charcoal hover:text-dillo-red transition-colors line-clamp-2 leading-snug block"
                    >
                      {item.product.name}
                    </Link>
                    <div className="flex gap-3 mt-1">
                      {item.selectedColor && (
                        <p className="text-xs text-gray-400 font-body">Color: {item.selectedColor}</p>
                      )}
                      {item.selectedSize && (
                        <p className="text-xs text-gray-400 font-body">Size: {item.selectedSize}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      {/* Qty controls */}
                      <div className="flex items-center border border-gray-200 rounded-sm">
                        <button
                          onClick={() => dispatch({
                            type: 'UPDATE_QUANTITY',
                            payload: { key: item.key, quantity: item.quantity - 1 }
                          })}
                          className="w-7 h-7 flex items-center justify-center hover:bg-gray-50
                            transition-colors text-gray-500 hover:text-dillo-red"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-sm font-body font-bold text-dillo-charcoal">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => dispatch({
                            type: 'UPDATE_QUANTITY',
                            payload: { key: item.key, quantity: item.quantity + 1 }
                          })}
                          className="w-7 h-7 flex items-center justify-center hover:bg-gray-50
                            transition-colors text-gray-500 hover:text-dillo-red"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      {/* Price */}
                      <div className="text-right">
                        <p className="price-tag text-sm">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-gray-400">{formatPrice(item.product.price)} each</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_FROM_CART', payload: item.key })}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors self-start mt-0.5"
                    aria-label="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-4 bg-dillo-ivory">
            {/* Coupon */}
            <div>
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 border border-gray-200 bg-white px-3 rounded-sm">
                    <Gift size={14} className="text-dillo-gold flex-shrink-0" />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1 py-2.5 text-sm font-body focus:outline-none bg-transparent placeholder-gray-400"
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    className="bg-dillo-charcoal text-white px-4 py-2.5 text-sm font-body font-semibold
                      hover:bg-dillo-red transition-colors rounded-sm"
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 px-3 py-2.5 rounded-sm">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-green-600" />
                    <div>
                      <p className="text-sm font-body font-bold text-green-700">{appliedCoupon.code}</p>
                      <p className="text-xs text-green-600">{appliedCoupon.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_COUPON' })}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    aria-label="Remove coupon"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              {couponError && (
                <p className="text-xs text-red-500 font-body mt-1.5 flex items-center gap-1">
                  <X size={11} /> {couponError}
                </p>
              )}
              {!appliedCoupon && (
                <p className="text-xs text-gray-400 font-body mt-1">Try: DILLO10, NEWUSER, FESTIVAL20</p>
              )}
            </div>

            {/* Order Summary */}
            <div className="space-y-2 text-sm font-body bg-white rounded-sm p-3 border border-gray-100">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({cartItems.reduce((s,i)=>s+i.quantity,0)} items)</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Item savings</span>
                  <span className="font-semibold">-{formatPrice(savings)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span className="font-semibold">-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-bold' : 'font-semibold'}>
                  {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200 text-dillo-charcoal">
                <span>Total</span>
                <span className="price-tag text-lg">{formatPrice(total)}</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2">
              <Link
                to="/checkout"
                onClick={() => dispatch({ type: 'CLOSE_CART' })}
                className="btn-primary w-full text-center flex items-center justify-center gap-2 py-4 text-sm"
              >
                Proceed to Checkout <ChevronRight size={16} />
              </Link>
              <button
                onClick={() => dispatch({ type: 'CLOSE_CART' })}
                className="w-full text-center text-sm font-body text-gray-500 hover:text-dillo-red
                  transition-colors py-2 underline underline-offset-2"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
