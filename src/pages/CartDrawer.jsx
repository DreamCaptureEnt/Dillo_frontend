import React from 'react';
import { Link } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ChevronRight, Truck } from 'lucide-react';
import { useCart } from './CartContext';
import { formatPrice } from '../products.js';

export default function CartDrawer() {
  const {
    isCartOpen, cartItems, total,
    dispatch,
  } = useCart();

  if (!isCartOpen) return null;

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const freeShippingProgress = Math.min((subtotal / 2000) * 100, 100);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-[60] animate-fade-in"
        onClick={() => dispatch({ type: 'CLOSE_CART' })}
      />

      <div className="fixed right-0 top-0 h-full w-full sm:w-[88vw] max-w-[430px] bg-white z-[70] flex flex-col shadow-2xl animate-slide-in-right">
        <div className="shrink-0 flex items-center justify-between gap-4 px-4 sm:px-5 py-4 border-b border-gray-100 bg-dillo-ivory">
          <div className="flex items-center gap-3 min-w-0">
            <ShoppingBag size={19} className="text-dillo-red shrink-0" />
            <h2 className="font-display text-lg font-bold text-dillo-charcoal truncate">Shopping Cart</h2>
            {itemCount > 0 && (
              <span className="bg-dillo-red text-white text-xs font-bold px-2 py-0.5 rounded-sm">
                {itemCount}
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

        {cartItems.length > 0 && (
          <div className={`shrink-0 px-4 sm:px-5 py-3 border-b ${subtotal >= 2000 ? 'bg-green-50 border-green-100' : 'bg-dillo-cream border-dillo-gold/20'}`}>
            {subtotal < 2000 ? (
              <>
                <div className="flex items-center gap-1.5 text-xs font-body font-semibold text-dillo-charcoal mb-2 leading-snug">
                  <Truck size={13} className="text-dillo-red shrink-0" />
                  <span>
                    Add <span className="text-dillo-red">{formatPrice(2000 - subtotal)}</span> more for FREE shipping
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
              <div className="flex items-center gap-1.5 text-xs font-body font-semibold text-green-700">
                <Truck size={13} className="text-green-600 shrink-0" />
                <span>You've unlocked FREE shipping</span>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto bg-white">
          {cartItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center gap-5 px-6 py-12">
              <div className="w-20 h-20 bg-dillo-cream rounded-full flex items-center justify-center">
                <ShoppingBag size={36} className="text-dillo-gold/50" />
              </div>
              <div>
                <p className="font-display text-xl font-bold text-gray-400">Your cart is empty</p>
                <p className="font-body text-sm text-gray-400 mt-1">Add products to see them here</p>
              </div>
              <button
                onClick={() => dispatch({ type: 'CLOSE_CART' })}
                className="btn-primary text-sm"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-3 px-4 sm:px-5 py-4">
              {cartItems.map((item) => (
                <div key={item.key} className="relative grid grid-cols-[78px_minmax(0,1fr)] gap-3 border border-gray-100 bg-white p-3 shadow-sm rounded-sm">
                  <Link
                    to={`/products/${item.product.id}`}
                    onClick={() => dispatch({ type: 'CLOSE_CART' })}
                    className="w-full aspect-[3/4] overflow-hidden border border-gray-100 block rounded-sm bg-gray-50"
                  >
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  <div className="min-w-0 pr-7">
                    <Link
                      to={`/products/${item.product.id}`}
                      onClick={() => dispatch({ type: 'CLOSE_CART' })}
                      className="font-body font-semibold text-sm text-dillo-charcoal hover:text-dillo-red transition-colors line-clamp-2 leading-snug block"
                    >
                      {item.product.name}
                    </Link>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                      {item.selectedColor && (
                        <p className="text-xs text-gray-400 font-body">Color: {item.selectedColor}</p>
                      )}
                      {item.selectedSize && (
                        <p className="text-xs text-gray-400 font-body">Size: {item.selectedSize}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-end justify-between gap-2 mt-3">
                      <div className="inline-flex w-max items-center border border-gray-200 rounded-sm bg-white">
                        <button
                          onClick={() => dispatch({
                            type: 'UPDATE_QUANTITY',
                            payload: { key: item.key, quantity: item.quantity - 1 },
                          })}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500 hover:text-dillo-red"
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
                            payload: { key: item.key, quantity: item.quantity + 1 },
                          })}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500 hover:text-dillo-red"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

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

                  <button
                    onClick={() => dispatch({ type: 'REMOVE_FROM_CART', payload: item.key })}
                    className="absolute right-2 top-2 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors rounded-sm"
                    aria-label="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="shrink-0 border-t border-gray-100 bg-dillo-ivory px-4 sm:px-5 py-4 space-y-3">
            <div className="flex items-center justify-between text-dillo-charcoal">
              <span className="font-body text-sm font-semibold">Total</span>
              <span className="price-tag text-xl">{formatPrice(total)}</span>
            </div>
            <Link
              to="/checkout"
              onClick={() => dispatch({ type: 'CLOSE_CART' })}
              className="btn-primary w-full text-center flex items-center justify-center gap-2 py-3 text-sm"
            >
              Checkout <ChevronRight size={16} />
            </Link>
            <button
              onClick={() => dispatch({ type: 'CLOSE_CART' })}
              className="w-full text-center text-sm font-body text-gray-500 hover:text-dillo-red transition-colors py-1"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
