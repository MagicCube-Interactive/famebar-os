'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  const [priceRange, setPriceRange] = useState(500);

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
    console.log(`Added product ${productId} to cart`);
  };

  return (
    <div>
      {/* Hero Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pt-4">
        <div>
          {/* Ambassador Badge */}
          {ambassadorName && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-4">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/></svg>
              Your Ambassador: {ambassadorName}
              {ambassadorCode && <span className="text-primary/60 ml-1">({ambassadorCode})</span>}
            </span>
          )}
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface mb-2">The Harvest</h1>
          <p className="text-on-surface-variant max-w-md">
            Optimize your field performance with elite-grade supplements designed for high-stakes growth.
          </p>
        </div>
        <div className="mt-6 md:mt-0 flex gap-4">
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10">
            <p className="text-[10px] uppercase tracking-wider text-outline mb-1">Store Credit</p>
            <p className="text-2xl font-mono text-secondary font-bold">$1,240.50</p>
          </div>
        </div>
      </div>

      {/* Campaign Banner */}
      <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden mb-12 group">
        <div className="absolute inset-0 w-full h-full bg-surface-container-highest" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-container/40 to-transparent" />
        <div className="relative h-full flex flex-col justify-center px-8 md:px-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2 leading-tight">
            SUMMIT SERIES<br />
            <span className="text-primary">20% OFF ALL ELIXIRS</span>
          </h2>
          <p className="text-on-surface/80 max-w-xs text-sm mb-6">
            Unlock your peak potential with our signature performance line.
          </p>
          <button className="w-fit px-6 py-2.5 rounded-lg bg-gradient-to-r from-primary-container to-primary text-on-primary font-bold shadow-lg shadow-primary-container/20 active:scale-95 transition-transform">
            Explore Collection
          </button>
        </div>
      </div>

      {/* Main Content: Sidebar + Grid */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter Sidebar */}
        <aside className="w-full lg:w-[200px] shrink-0 space-y-8">
          {/* Categories */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-outline mb-6">Categories</h3>
            <div className="space-y-4">
              {categories.map((cat) => (
                <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedCategory === 'all' || selectedCategory === cat}
                    onChange={() => setSelectedCategory(selectedCategory === cat ? 'all' : cat)}
                    className="w-5 h-5 rounded border-outline-variant bg-surface-container-lowest text-primary focus:ring-primary/40 focus:ring-offset-0"
                  />
                  <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors capitalize">
                    {cat === 'all' ? 'All Products' : cat}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-outline mb-6">Price Range</h3>
            <div className="px-2">
              <input
                type="range"
                min={0}
                max={500}
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full h-1.5 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between mt-3">
                <span className="text-[10px] font-mono text-outline">$0</span>
                <span className="text-[10px] font-mono text-outline">$500+</span>
              </div>
            </div>
          </div>

          {/* Sort By */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-outline mb-4">Sort By</h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg py-2 px-3 text-sm text-on-surface focus:ring-primary/40 focus:border-primary/40 outline-none"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-surface-container-low rounded-2xl overflow-hidden transition-all duration-300 hover:bg-surface-container hover:-translate-y-1"
              >
                {/* Product Image */}
                <div className="relative aspect-[4/5] overflow-hidden bg-surface-container-highest">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-12 h-12 text-outline/40 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                        </svg>
                        <p className="text-[10px] text-outline/40 font-mono uppercase tracking-wider">Product Image</p>
                      </div>
                    </div>
                  )}

                  {/* Rating Badge */}
                  {!product.isOutOfStock && (
                    <div className="absolute top-4 right-4 px-2 py-1 rounded bg-primary/20 backdrop-blur-md border border-primary/30 text-primary text-[10px] font-bold tracking-wider">
                      {product.rating.toFixed(1)} ★
                    </div>
                  )}

                  {/* Out of Stock Overlay */}
                  {product.isOutOfStock && (
                    <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Sold Out</span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <p className="text-[10px] font-mono text-outline uppercase tracking-widest mb-1">
                    {product.category}
                  </p>
                  <h4 className="text-lg font-bold text-on-surface mb-4 leading-tight">
                    {product.name}
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-mono font-bold text-primary">
                      ${product.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      disabled={product.isOutOfStock}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        product.isOutOfStock
                          ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed opacity-50'
                          : 'bg-primary-container text-on-primary shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:brightness-110'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                      </svg>
                      {product.isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {sortedProducts.length === 0 && (
            <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-12 text-center">
              <p className="text-on-surface-variant mb-4">No products found in this category</p>
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-primary hover:brightness-110 font-bold text-sm"
              >
                View all products
              </button>
            </div>
          )}

          {/* Unlock Field Commander CTA */}
          <div className="mt-16 p-8 rounded-2xl border border-primary/10 bg-gradient-to-br from-surface-container-highest/20 to-surface-container/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-surface-tint/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-on-surface mb-2">Unlock Field Commander Status</h3>
                <p className="text-on-surface-variant max-w-md">
                  Reach $5,000 in lifetime sales to unlock the exclusive Founder&apos;s Reserve collection.
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-48 h-3 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-primary-container to-primary" />
                </div>
                <span className="text-[10px] font-mono text-primary uppercase font-bold tracking-widest">
                  75% to Unlock
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Cart Indicator */}
      {cartCount > 0 && (
        <div className="fixed bottom-8 right-8 z-40">
          <Link
            href="/buyer/cart"
            className="rounded-xl bg-gradient-to-r from-primary-container to-primary text-on-primary shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:brightness-110 transition-all px-6 py-4 flex items-center gap-3 font-bold"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <span>
              Cart{' '}
              <span className="bg-white/20 rounded-full px-2.5 py-1 text-sm ml-2">
                {cartCount}
              </span>
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
