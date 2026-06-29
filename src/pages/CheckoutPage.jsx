import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Shield, Truck, CheckCircle, Tag, X, CreditCard, Smartphone, Landmark, Wallet } from 'lucide-react';
import { useCart } from './CartContext';
import { formatPrice } from '../products.js';
import { apiFetch } from '../api';
import { useAuth } from '../auth';

const paymentMethods = [
  { id: 'upi', label: 'UPI', icon: Smartphone, desc: 'Google Pay, PhonePe, Paytm' },
  { id: 'card', label: 'Card', icon: CreditCard, desc: 'Debit / Credit Card' },
  { id: 'netbanking', label: 'Net Banking', icon: Landmark, desc: 'All major banks' },
  { id: 'cod', label: 'Cash on Delivery', icon: Wallet, desc: 'Pay when you receive' },
];

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

function Step({ n, label, active, done }) {
  return (
    <div className={`flex items-center gap-2 ${active ? 'text-dillo-red' : done ? 'text-green-600' : 'text-gray-400'}`}>
      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold
        ${active ? 'border-dillo-red bg-dillo-red text-white' : done ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300'}`}>
        {done ? <CheckCircle size={14} /> : n}
      </div>
      <span className="font-body font-semibold text-sm hidden sm:block">{label}</span>
    </div>
  );
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const {
    cartItems, subtotal, discount, shipping, total, savings, appliedCoupon, couponError,
    dispatch,
  } = useCart();

  const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Review
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: 'Salem', state: 'Tamil Nadu', pincode: '', landmark: '',
  });

  const handleFormChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const isAddressValid = form.firstName && form.lastName && form.phone &&
    form.address && form.city && form.state && form.pincode;

  const handlePlaceOrder = async () => {
    if (!user) {
      setOrderError('Please log in or create an account before placing the order.');
      return;
    }

    setPlacingOrder(true);
    setOrderError('');

    try {
      const order = await apiFetch('/orders/', {
        method: 'POST',
        body: JSON.stringify({
          items: cartItems.map(item => ({
            saree: item.product.backendId || item.product.id,
            selected_color: item.selectedColor || '',
            selected_size: item.selectedSize || '',
            quantity: item.quantity,
          })),
          shipping_address: {
            first_name: form.firstName,
            last_name: form.lastName,
            email: form.email,
            phone: form.phone,
            address: form.address,
            landmark: form.landmark,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
          },
          payment_method: paymentMethod,
          order_source: 'website',
          discount,
          shipping,
          coupon_code: appliedCoupon?.code || '',
          device_info: navigator.userAgent,
          notes: paymentMethod === 'upi' && upiId ? `UPI ID: ${upiId}` : '',
        }),
      });
      setPlacedOrder(order);
      setOrderPlaced(true);
      dispatch({ type: 'CLEAR_CART' });
    } catch (err) {
      setOrderError(err.message || 'Could not place the order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-20 h-20 bg-dillo-cream flex items-center justify-center">
          <Wallet size={36} className="text-dillo-gold/50" />
        </div>
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-dillo-charcoal mb-2">Your cart is empty</h2>
          <p className="font-body text-gray-500">Add some beautiful sarees before checkout!</p>
        </div>
        <Link to="/products" className="btn-primary">Browse Collection</Link>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4 bg-dillo-ivory">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-fade-in">
          <CheckCircle size={48} className="text-green-600" />
        </div>
        <div className="text-center max-w-md animate-slide-up">
          <h2 className="font-display text-3xl font-bold text-dillo-charcoal mb-2">Order Placed!</h2>
          <p className="font-body text-gray-500 mb-2">
            Thank you, <strong>{form.firstName || 'Customer'}</strong>! Your order has been confirmed.
          </p>
          <p className="font-body text-sm text-gray-400">
            You'll receive a confirmation SMS on your registered mobile number shortly.
            Estimated delivery: 5–7 business days.
          </p>
        </div>
        <div className="bg-white border border-gray-100 p-6 text-center max-w-xs w-full">
          <p className="font-cinzel text-xs tracking-widest text-dillo-gold uppercase mb-1">Order ID</p>
          <p className="font-display text-xl font-bold text-dillo-charcoal">
            {placedOrder?.order_number || 'Confirmed'}
          </p>
        </div>
        <div className="flex gap-4">
          <Link to="/" className="btn-primary">Go to Home</Link>
          <Link to="/products" className="btn-outline">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dillo-ivory min-h-screen">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 py-4 px-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/products" className="flex items-center gap-2 text-gray-500 hover:text-dillo-red transition-colors font-body text-sm">
            <ChevronLeft size={18} /> Back to Shopping
          </Link>
          <div className="flex items-center justify-center gap-2 sm:gap-4 overflow-x-auto">
            <Step n={1} label="Address" active={step === 1} done={step > 1} />
            <div className="w-5 sm:w-8 h-px bg-gray-200 flex-shrink-0" />
            <Step n={2} label="Payment" active={step === 2} done={step > 2} />
            <div className="w-5 sm:w-8 h-px bg-gray-200 flex-shrink-0" />
            <Step n={3} label="Review" active={step === 3} done={false} />
          </div>
          <div className="flex items-center justify-center gap-1.5 text-green-600 font-body text-xs font-semibold">
            <Shield size={14} /> Secure Checkout
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">

        {/* Left: Forms */}
        <div className="lg:col-span-2 space-y-6">

          {/* Step 1: Address */}
          {step === 1 && (
            <div className="bg-white border border-gray-100 p-6 md:p-8 animate-fade-in">
              <h2 className="font-display text-2xl font-bold text-dillo-charcoal mb-6">Delivery Address</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-sm text-gray-600 mb-1.5 block">First Name *</label>
                  <input name="firstName" value={form.firstName} onChange={handleFormChange}
                    placeholder="Priya" className="input-field" />
                </div>
                <div>
                  <label className="font-body text-sm text-gray-600 mb-1.5 block">Last Name *</label>
                  <input name="lastName" value={form.lastName} onChange={handleFormChange}
                    placeholder="Sundaramurthy" className="input-field" />
                </div>
                <div>
                  <label className="font-body text-sm text-gray-600 mb-1.5 block">Phone Number *</label>
                  <input name="phone" value={form.phone} onChange={handleFormChange}
                    type="tel" placeholder="+91 98765 43210" className="input-field" />
                </div>
                <div>
                  <label className="font-body text-sm text-gray-600 mb-1.5 block">Email Address</label>
                  <input name="email" value={form.email} onChange={handleFormChange}
                    type="email" placeholder="priya@example.com" className="input-field" />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-body text-sm text-gray-600 mb-1.5 block">Address *</label>
                  <input name="address" value={form.address} onChange={handleFormChange}
                    placeholder="Door no, Street name, Area" className="input-field" />
                </div>
                <div>
                  <label className="font-body text-sm text-gray-600 mb-1.5 block">Landmark (optional)</label>
                  <input name="landmark" value={form.landmark} onChange={handleFormChange}
                    placeholder="Near bus stand" className="input-field" />
                </div>
                <div>
                  <label className="font-body text-sm text-gray-600 mb-1.5 block">City *</label>
                  <input name="city" value={form.city} onChange={handleFormChange}
                    placeholder="Salem" className="input-field" />
                </div>
                <div>
                  <label className="font-body text-sm text-gray-600 mb-1.5 block">State *</label>
                  <select name="state" value={form.state} onChange={handleFormChange} className="input-field">
                    {indianStates.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-body text-sm text-gray-600 mb-1.5 block">Pincode *</label>
                  <input name="pincode" value={form.pincode} onChange={handleFormChange}
                    placeholder="636004" maxLength={6} className="input-field" />
                </div>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-3 mt-5">
                <Truck size={16} className="text-blue-600 flex-shrink-0" />
                <p className="font-body text-sm text-blue-700">
                  {shipping === 0
                    ? '🎉 Your order qualifies for FREE shipping!'
                    : `Add ${formatPrice(2000 - subtotal)} more to unlock free shipping`}
                </p>
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!isAddressValid}
                className={`btn-primary mt-6 w-full flex items-center justify-center gap-2 py-4
                  ${!isAddressValid ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Continue to Payment
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="bg-white border border-gray-100 p-6 md:p-8 animate-fade-in">
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setStep(1)} className="text-gray-400 hover:text-dillo-red transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <h2 className="font-display text-2xl font-bold text-dillo-charcoal">Payment Method</h2>
              </div>

              <div className="space-y-3 mb-6">
                {paymentMethods.map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <label
                      key={pm.id}
                      className={`flex items-center gap-4 border-2 p-4 cursor-pointer transition-all ${
                        paymentMethod === pm.id
                          ? 'border-dillo-red bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={pm.id}
                        checked={paymentMethod === pm.id}
                        onChange={() => setPaymentMethod(pm.id)}
                        className="accent-dillo-red"
                      />
                      <div className="w-10 h-10 bg-dillo-cream flex items-center justify-center flex-shrink-0">
                        <Icon size={20} className="text-dillo-charcoal" />
                      </div>
                      <div>
                        <p className="font-body font-bold text-dillo-charcoal text-sm">{pm.label}</p>
                        <p className="font-body text-xs text-gray-400">{pm.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>

              {paymentMethod === 'upi' && (
                <div className="mb-6 animate-slide-up">
                  <label className="font-body text-sm text-gray-600 mb-1.5 block">Enter UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                    className="input-field"
                  />
                </div>
              )}
              {paymentMethod === 'card' && (
                <div className="mb-6 space-y-3 animate-slide-up">
                  <div>
                    <label className="font-body text-sm text-gray-600 mb-1.5 block">Card Number</label>
                    <input type="text" placeholder="1234 5678 9012 3456" className="input-field" maxLength={19} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-body text-sm text-gray-600 mb-1.5 block">Expiry</label>
                      <input type="text" placeholder="MM/YY" className="input-field" maxLength={5} />
                    </div>
                    <div>
                      <label className="font-body text-sm text-gray-600 mb-1.5 block">CVV</label>
                      <input type="password" placeholder="•••" className="input-field" maxLength={4} />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-gray-400 text-xs font-body mb-6">
                <Shield size={13} className="text-green-600" />
                <span>256-bit SSL encryption — your payment info is safe</span>
              </div>

              <button onClick={() => setStep(3)} className="btn-primary w-full flex items-center justify-center gap-2 py-4">
                Review Order
              </button>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="bg-white border border-gray-100 p-6 md:p-8 animate-fade-in">
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setStep(2)} className="text-gray-400 hover:text-dillo-red transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <h2 className="font-display text-2xl font-bold text-dillo-charcoal">Review Your Order</h2>
              </div>

              {/* Address summary */}
              <div className="bg-dillo-cream border border-dillo-gold/20 p-4 mb-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-cinzel text-xs tracking-widest text-dillo-gold uppercase mb-2">Delivering to</p>
                    <p className="font-body font-semibold text-dillo-charcoal">{form.firstName} {form.lastName}</p>
                    <p className="font-body text-sm text-gray-500">{form.address}</p>
                    <p className="font-body text-sm text-gray-500">{form.city}, {form.state} – {form.pincode}</p>
                    <p className="font-body text-sm text-gray-500">{form.phone}</p>
                  </div>
                  <button onClick={() => setStep(1)} className="text-dillo-red text-xs font-body underline">Change</button>
                </div>
              </div>

              {/* Payment summary */}
              <div className="bg-dillo-cream border border-dillo-gold/20 p-4 mb-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-cinzel text-xs tracking-widest text-dillo-gold uppercase mb-2">Payment Method</p>
                    <p className="font-body font-semibold text-dillo-charcoal">
                      {paymentMethods.find(p => p.id === paymentMethod)?.label}
                    </p>
                    {paymentMethod === 'upi' && upiId && (
                      <p className="font-body text-sm text-gray-500">{upiId}</p>
                    )}
                  </div>
                  <button onClick={() => setStep(2)} className="text-dillo-red text-xs font-body underline">Change</button>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4 mb-5">
                <p className="font-cinzel text-xs tracking-widest text-dillo-gold uppercase">Items ({cartItems.length})</p>
                {cartItems.map(item => (
                  <div key={item.key} className="flex gap-4">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-14 h-18 object-cover border border-gray-100 flex-shrink-0"
                      style={{ height: 68 }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-semibold text-dillo-charcoal line-clamp-2">{item.product.name}</p>
                      {item.selectedColor && <p className="text-xs text-gray-400 font-body">Color: {item.selectedColor}</p>}
                      <p className="text-xs text-gray-400 font-body">Qty: {item.quantity}</p>
                    </div>
                    <p className="price-tag text-sm flex-shrink-0">{formatPrice(item.product.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className={`btn-primary w-full py-4 text-base flex items-center justify-center gap-2 ${placingOrder ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {placingOrder ? 'Placing Order...' : `Place Order — ${formatPrice(total)}`} <CheckCircle size={18} />
              </button>
              {orderError && (
                <div className="mt-3 bg-red-50 border border-red-100 p-3 text-sm font-body text-red-700">
                  {orderError}{' '}
                  {!user && <Link to="/account" className="font-semibold underline">Go to login</Link>}
                </div>
              )}
              <p className="font-body text-xs text-gray-400 text-center mt-3">
                By placing your order you agree to our Terms & Conditions
              </p>
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="space-y-5">
          <div className="bg-white border border-gray-100 p-6 sticky top-24">
            <h3 className="font-display text-lg font-bold text-dillo-charcoal mb-5">Order Summary</h3>

            {/* Mini cart items */}
            <div className="space-y-3 mb-5 max-h-52 overflow-y-auto">
              {cartItems.map(item => (
                <div key={item.key} className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-12 h-14 object-cover border border-gray-100 flex-shrink-0"
                    />
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-dillo-charcoal text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-xs font-semibold text-dillo-charcoal line-clamp-2 leading-tight">
                      {item.product.name}
                    </p>
                  </div>
                  <p className="font-body text-sm font-bold text-dillo-red flex-shrink-0">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {/* Coupon */}
            {!appliedCoupon ? (
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    className="flex-1 border border-gray-200 px-3 py-2 text-xs font-body focus:outline-none focus:border-dillo-red"
                    onKeyDown={e => e.key === 'Enter' && dispatch({ type: 'APPLY_COUPON', payload: couponInput })}
                  />
                  <button
                    onClick={() => dispatch({ type: 'APPLY_COUPON', payload: couponInput })}
                    className="bg-dillo-charcoal text-white px-3 py-2 text-xs font-body font-semibold hover:bg-dillo-red transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-xs text-red-500 font-body mt-1">{couponError}</p>}
                <p className="text-xs text-gray-400 font-body mt-1">Try: DILLO10, NEWUSER</p>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 px-3 py-2 mb-4">
                <div className="flex items-center gap-2">
                  <Tag size={12} className="text-green-600" />
                  <div>
                    <p className="text-xs font-bold text-green-700">{appliedCoupon.code}</p>
                    <p className="text-xs text-green-600">{appliedCoupon.description}</p>
                  </div>
                </div>
                <button onClick={() => dispatch({ type: 'REMOVE_COUPON' })} className="text-red-400 hover:text-red-600">
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Totals */}
            <div className="space-y-2 text-sm font-body border-t border-gray-100 pt-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Item savings</span>
                  <span>-{formatPrice(savings)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-bold' : ''}>
                  {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200 text-dillo-charcoal">
                <span>Total</span>
                <span className="price-tag text-xl">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
              {[
                { icon: Shield, text: 'Secure SSL payment' },
                { icon: Truck, text: 'Free shipping above ₹2,000' },
                { icon: CheckCircle, text: 'Authentic products guaranteed' },
              ].map((b, i) => {
                const Icon = b.icon;
                return (
                  <div key={i} className="flex items-center gap-2 text-xs font-body text-gray-500">
                    <Icon size={13} className="text-green-600 flex-shrink-0" />
                    {b.text}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
