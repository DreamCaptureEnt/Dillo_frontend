import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ rating, count, size = 14, showCount = true }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          size={size}
          className={star <= Math.floor(rating) ? 'text-dillo-gold fill-dillo-gold' : 
            star - 0.5 <= rating ? 'text-dillo-gold fill-dillo-gold opacity-60' :
            'text-gray-300 fill-gray-300'}
        />
      ))}
      {showCount && count !== undefined && (
        <span className="text-xs text-gray-500 font-body ml-1">({count})</span>
      )}
    </div>
  );
}