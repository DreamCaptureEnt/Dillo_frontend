import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { validCoupons } from '../products.js';

const CartContext = createContext(null);

const initialState = {
  cartItems: [],
  wishlist: [],
  couponCode: '',
  appliedCoupon: null,
  couponError: '',
  isCartOpen: false,
  notification: null,
};

function cartReducer(state, action) {
  switch (action.type) {
    // ── Cart ──────────────────────────────────────────────────────────────────
    case 'ADD_TO_CART': {
      const { product, selectedSize, selectedColor, quantity = 1 } = action.payload;
      const key = `${product.id}-${selectedSize || 'default'}-${selectedColor || 'default'}`;
      const existing = state.cartItems.find(i => i.key === key);
      if (existing) {
        return {
          ...state,
          cartItems: state.cartItems.map(i =>
            i.key === key ? { ...i, quantity: i.quantity + quantity } : i
          ),
          notification: { type: 'cart', message: 'Quantity updated in cart!' },
        };
      }
      return {
        ...state,
        cartItems: [...state.cartItems, {
          key, product, selectedSize, selectedColor, quantity,
        }],
        notification: { type: 'cart', message: `${product.name} added to cart!` },
      };
    }

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cartItems: state.cartItems.filter(i => i.key !== action.payload),
      };

    case 'UPDATE_QUANTITY': {
      const { key, quantity } = action.payload;
      if (quantity <= 0) {
        return { ...state, cartItems: state.cartItems.filter(i => i.key !== key) };
      }
      return {
        ...state,
        cartItems: state.cartItems.map(i =>
          i.key === key ? { ...i, quantity } : i
        ),
      };
    }

    case 'CLEAR_CART':
      return { ...state, cartItems: [], appliedCoupon: null, couponCode: '' };

    // ── Coupon ────────────────────────────────────────────────────────────────
    case 'APPLY_COUPON': {
      const code = action.payload.toUpperCase();
      const coupon = validCoupons[code];
      const subtotal = state.cartItems.reduce(
        (sum, i) => sum + i.product.price * i.quantity, 0
      );
      if (!coupon) {
        return { ...state, couponError: 'Invalid coupon code', appliedCoupon: null };
      }
      if (subtotal < coupon.minOrder) {
        return {
          ...state,
          couponError: `Minimum order ₹${coupon.minOrder} required for this coupon`,
          appliedCoupon: null,
        };
      }
      return {
        ...state,
        appliedCoupon: { code, ...coupon },
        couponCode: code,
        couponError: '',
        notification: { type: 'success', message: `Coupon "${code}" applied!` },
      };
    }

    case 'REMOVE_COUPON':
      return { ...state, appliedCoupon: null, couponCode: '', couponError: '' };

    case 'SET_COUPON_CODE':
      return { ...state, couponCode: action.payload, couponError: '' };

    // ── Wishlist ──────────────────────────────────────────────────────────────
    case 'TOGGLE_WISHLIST': {
      const pid = action.payload;
      const isIn = state.wishlist.includes(pid);
      return {
        ...state,
        wishlist: isIn
          ? state.wishlist.filter(id => id !== pid)
          : [...state.wishlist, pid],
        notification: {
          type: 'wishlist',
          message: isIn ? 'Removed from wishlist' : 'Added to wishlist!',
        },
      };
    }

    // ── UI ────────────────────────────────────────────────────────────────────
    case 'TOGGLE_CART':
      return { ...state, isCartOpen: !state.isCartOpen };

    case 'OPEN_CART':
      return { ...state, isCartOpen: true };

    case 'CLOSE_CART':
      return { ...state, isCartOpen: false };

    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null };

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState, (init) => {
    try {
      const stored = localStorage.getItem('dillo-cart');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...init, cartItems: parsed.cartItems || [], wishlist: parsed.wishlist || [] };
      }
    } catch {}
    return init;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('dillo-cart', JSON.stringify({
      cartItems: state.cartItems,
      wishlist: state.wishlist,
    }));
  }, [state.cartItems, state.wishlist]);

  // Auto-clear notifications
  useEffect(() => {
    if (state.notification) {
      const timer = setTimeout(() => dispatch({ type: 'CLEAR_NOTIFICATION' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.notification]);

  // Computed values
  const cartCount = state.cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const savings = state.cartItems.reduce(
    (sum, i) => sum + (i.product.originalPrice - i.product.price) * i.quantity, 0
  );

  let discount = 0;
  if (state.appliedCoupon) {
    if (state.appliedCoupon.type === 'percent') {
      discount = Math.round(subtotal * state.appliedCoupon.discount / 100);
    } else {
      discount = state.appliedCoupon.discount;
    }
  }

  const shipping = subtotal >= 2000 ? 0 : 99;
  const total = subtotal - discount + shipping;

  return (
    <CartContext.Provider value={{
      ...state,
      dispatch,
      cartCount,
      subtotal,
      savings,
      discount,
      shipping,
      total,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};