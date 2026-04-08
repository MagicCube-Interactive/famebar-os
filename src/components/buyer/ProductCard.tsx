'use client';

import React from 'react';
import { HiOutlineShoppingCart, HiOutlineStar } from 'react-icons/hi';

interface ProductCardProps {
  /** Product ID/SKU */
  productId: string;
  /** Product name */
  name: string;
  /** Product price in dollars */
  price: number;
  /** Product description */
  description: string;
  /** Product image URL (placeholder if not available) */
  imageUrl?: string;
  /** Average rating (0-5) */
  rating?: number;
  /** Number of reviews */
  reviewCount?: number;
  /** Callback when add to cart is clicked */
  onAddToCart?: (productId: string) => void;
  /** Whether product is out of stock */
  isOutOfStock?: boolean;
}

/**
 * ProductCard
 * Reusable product card component for the shop
 * Shows image, name, price, description, rating, and add-to-cart button
 * Dark premium theme with emerald accents
 */
export default function ProductCard({
  productId,
  name,
  price,
  description,
  imageUrl,
  rating = 4.5,
  reviewCount = 128,
  onAddToCart,
  isOutOfStock = false,
}: ProductCardProps) {
  return (
    <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 overflow-hidden transition-all duration-300 hover:border-amber-400/30 hover:from-gray-800 hover:to-gray-900/50">
      {/* Product Image */}
      <div className="relative h-48 overflow-hidden bg-gray-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
            <div className="text-center">
              <HiOutlineShoppingCart className="h-12 w-12 text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Product Image</p>
            </div>
          </div>
        )}

        {/* Rating Badge */}
        {!isOutOfStock && (
          <div className="absolute top-3 right-3 rounded-lg bg-amber-500/90 backdrop-blur-sm px-2.5 py-1 flex items-center gap-1">
            <HiOutlineStar className="h-3.5 w-3.5 text-white fill-white" />
            <span className="text-xs font-bold text-white">{rating.toFixed(1)}</span>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <p className="text-sm font-semibold text-white">Out of Stock</p>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        {/* Name */}
        <h3 className="text-sm font-bold text-white line-clamp-2">{name}</h3>

        {/* Description */}
        <p className="text-xs text-gray-400 line-clamp-2">{description}</p>

        {/* Price and Rating */}
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-2xl font-bold text-emerald-400">${price.toFixed(2)}</p>
            <p className="text-xs text-gray-500">Per unit</p>
          </div>
          {!isOutOfStock && reviewCount > 0 && (
            <p className="text-xs text-gray-500">
              <span className="text-gray-400">{reviewCount}</span> reviews
            </p>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => onAddToCart?.(productId)}
          disabled={isOutOfStock}
          className={`w-full rounded-lg py-2.5 px-3 text-center text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            isOutOfStock
              ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-600 to-green-500 text-white hover:from-emerald-700 hover:to-green-600'
          }`}
        >
          <HiOutlineShoppingCart className="h-4 w-4" />
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
