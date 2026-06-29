import React, { useEffect, useState } from 'react';
import { ShoppingCart, Heart, CheckCircle, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function Toast() {
  const { notification, dispatch } = useCart();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [notification]);

  if (!notification) return null;

  const icons = {
    cart: <ShoppingCart size={18} className="text-white" />,
    wishlist: <Heart size={18} className="text-white" fill="white" />,
    success: <CheckCircle size={18} className="text-white" />,
  };

  const bgColors = {
    cart: 'bg-dillo-red',
    wishlist: 'bg-pink-500',
    success: 'bg-green-600',
  };

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <div className={`flex items-center gap-3 px-5 py-3 shadow-2xl text-white text-sm font-body
        ${bgColors[notification.type] || 'bg-dillo-charcoal'} min-w-[260px] max-w-[400px]`}
      >
        {icons[notification.type]}
        <span className="flex-1">{notification.message}</span>
        <button
          onClick={() => dispatch({ type: 'CLEAR_NOTIFICATION' })}
          className="opacity-70 hover:opacity-100 transition-opacity ml-2"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}