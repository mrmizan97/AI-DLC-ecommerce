"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export default function StarRating({
  value = 0,
  onChange,
  size = 16,
  readOnly = true,
  showValue = false,
  count,
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  const stars = [1, 2, 3, 4, 5].map((n) => {
    const filled = n <= Math.round(display);
    return (
      <button
        key={n}
        type="button"
        disabled={readOnly}
        onClick={() => !readOnly && onChange?.(n)}
        onMouseEnter={() => !readOnly && setHover(n)}
        onMouseLeave={() => !readOnly && setHover(0)}
        className={readOnly ? "cursor-default" : "cursor-pointer"}
        aria-label={`${n} star${n > 1 ? "s" : ""}`}
      >
        <Star
          size={size}
          className={filled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
        />
      </button>
    );
  });

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">{stars}</div>
      {showValue && value > 0 && (
        <span className="text-xs text-gray-600 ml-1">
          {Number(value).toFixed(1)}
        </span>
      )}
      {typeof count === "number" && (
        <span className="text-xs text-gray-500 ml-1">({count})</span>
      )}
    </div>
  );
}
