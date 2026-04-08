'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/buyer/ProductCard';
import { HiOutlineShoppingCart, HiOutlineAdjustments } from 'react-icons/hi';
import { useAuthContext } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
  category: string;
  rating: number;
  reviewCount: number;
  isOutOfStock: boolean;
}

/**
 * ShopPage
 * Product catalog page for buyers
 * Shows product cards with filtering and sorting
 * Includes ambassador referral badge
 */
export default function ShopPage() {
  const { user, role } = useAuthContext();
  const [cartCount, setCartCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [ambassadorName, setAmbassadorName] = useState<string | null>(null);
  const [ambassadorCode, setAmbassadorCode] = useState<string | null>(null);

  useEffect(() => {
    if (!user || role !== 'buyer') return;
    const fetchAmbassador = async () => {
      const supabase = createClient();
      const { data: bp } = await supabase
        .from('buyer_profiles')
        .select('referred_by')
        .eq('id', user.id)
        .single();
      if (bp?.referred_by) {
        const [{ data: ap }, { data: prof }] = await Promise.all([
          supabase.from('ambassador_profiles').select('referral_code').eq('id', bp.referred_by).single(),
          supabase.from('profiles').select('full_name').eq('id', bp.referred_by).single(),
        ]);
        setAmbassadorCode(ap?.referral_code || null);
        setAmbassadorName(prof?.full_name || null);
      }
    };
    fetchAmbassador();
  }, [user, role]);

  // Mock products
  const mockProducts: Product[] = [
    {
      id: 'prod-1',
      name: 'Premium Wellness Blend',
      price: 25.0,
      description: 'Luxurious blend of natural herbs and superfoods',
      category: 'wellness',
      rating: 4.8,
      reviewCount: 156,
      isOutOfStock: false,
    },
    {
      id: 'prod-2',
      name: 'Golden Hour Serum',
      price: 25.0,
      description: 'Anti-aging facial serum with 24k gold particles',
      category: 'skincare',
      rating: 4.6,
      reviewCount: 98,
      isOutOfStock: false,
    },
    {
      id: 'prod-3',
      name: 'Detox Elixir',
      price: 25.0,
      description: 'Cleansing beverage with activated charcoal',
      category: 'wellness',
      rating: 4.4,
      reviewCount: 72,
      isOutOfStock: false,
    },
    {
      id: 'prod-4',
      name: 'Luminous Face Mask',
      price: 25.0,
      description: 'LED-enhanced hydrating mask for radiant skin',
      category: 'skincare',
      rating: 4.7,
      reviewCount: 134,
      isOutOfStock: false,
    },
    {
      id: 'prod-5',
      name: 'Midnight Renewal Oil',
      price: 25.0,
      description: 'Regenerating night oil with retinol complex',
      category: 'skincare',
      rating: 4.5,
      reviewCount: 89,
      isOutOfStock: false,
    },
    {
      id: 'prod-6',
      name: 'Energy Boost Powder',
      price: 25.0,
      description: 'Natural energy blend with adaptogenic herbs',
      category: 'wellness',
      rating: 4.3,
      reviewCount: 56,
      isOutOfStock: true,
    },
    {
      id: 'prod-7',
      name: 'Hydration Complex',
      price: 25.0,
      description: 'Intensive hydrating treatment with hyaluronic acid',
      category: 'skincare',
      rating: 4.6,
      reviewCount: 112,
      isOutOfStock: false,
    },
    {
      id: 'prod-8',
      name: 'Sleep Wellness Tea',
      price: 25.0,
      description: 'Calming herbal blend for restful sleep',
      category: 'wellness',
      rating: 4.4,
      reviewCount: 67,
      isOutOfStock: false,
    },
  ];

  const categories = ['all', 'wellness', 'skincare'];

  // Filter products
  const filteredProducts =
    selectedCategory === 'all'
      ? mockProducts
      : mockProducts.filter((p) => p.category === selectedCategory);

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'popular':
      default:
        return b.reviewCount - a.reviewCount;
    }
  });

  const handleAddToCart = (productId: string) => {
    setCartCount(cartCount + 1);
    // Show toast notification in production
    console.log(`Added product ${productId} to cart`);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Shop Products</h1>
          <p className="text-gray-400">Browse our premium collection</p>
        </div>

        {/* Ambassador Badge */}
        {ambassadorName && (
          <div className="rounded-lg border border-amber-400/30 bg-amber-900/20 px-4 py-3">
            <p className="text-xs font-semibold text-amber-200 mb-1">Your Ambassador</p>
            <p className="text-sm font-bold text-amber-300">{ambassadorName}</p>
            {ambassadorCode && <p className="text-xs text-amber-200/70 mt-1">Code: {ambassadorCode}</p>}
          </div>
        )}
      </div>

      {/* Campaign Banner Slot */}
      <div className="rounded-xl border border-purple-400/30 bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-6">
        <h3 className="text-lg font-semibold text-purple-300 mb-2">Spring Collection Campaign</h3>
        <p className="text-sm text-purple-200/80">
          Limited-time: Unlock 10% extra $FAME tokens on all purchases this week!
        </p>
        <button className="mt-3 text-sm font-semibold text-purple-300 hover:text-purple-200">
          Learn more →
        </button>
      </div>

      {/* Filter and Sort Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Filter */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
            <HiOutlineAdjustments className="h-4 w-4" />
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  selectedCategory === category
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-700/30 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                {category === 'all' ? 'All Products' : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
            <HiOutlineAdjustments className="h-4 w-4" />
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm text-gray-100 focus:outline-none focus:border-amber-400"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedProducts.map((product) => (
          <ProductCard
            key={product.id}
            productId={product.id}
            name={product.name}
            price={product.price}
            description={product.description}
            rating={product.rating}
            reviewCount={product.reviewCount}
            isOutOfStock={product.isOutOfStock}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>

      {/* Cart Indicator */}
      {cartCount > 0 && (
        <div className="fixed bottom-8 right-8 z-40">
          <Link
            href="/buyer/cart"
            className="rounded-lg bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 transition-all shadow-lg px-6 py-4 flex items-center gap-3 text-white font-semibold"
          >
            <HiOutlineShoppingCart className="h-5 w-5" />
            <span>
              Cart <span className="bg-white/30 rounded-full px-2.5 py-1 text-sm ml-2">{cartCount}</span>
            </span>
          </Link>
        </div>
      )}

      {/* Empty State */}
      {sortedProducts.length === 0 && (
        <div className="rounded-xl border border-gray-700/50 bg-gray-800/20 p-8 text-center">
          <p className="text-gray-400">No products found in this category</p>
          <button
            onClick={() => setSelectedCategory('all')}
            className="mt-4 text-amber-300 hover:text-amber-400 font-semibold"
          >
            View all products
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-400 text-center py-4">
        Showing {sortedProducts.length} of {mockProducts.length} products
      </div>
    </div>
  );
}
