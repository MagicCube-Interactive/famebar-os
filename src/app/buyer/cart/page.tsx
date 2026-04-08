'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HiOutlineTrash, HiOutlineMinus, HiOutlinePlus, HiOutlineExclamation } from 'react-icons/hi';
import { useAuthContext } from '@/context/AuthContext';
import type { BuyerProfile } from '@/types';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * CartPage
 * Shopping cart with:
 * - Line items with quantity controls
 * - Subtotal calculation
 * - Hold-to-Save discount applied
 * - Ambassador code confirmation (locked)
 * - Age verification reminder
 * - Checkout CTA
 */
export default function CartPage() {
  const { userProfile } = useAuthContext();
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      productId: 'prod-1',
      name: 'Premium Wellness Blend',
      price: 25.0,
      quantity: 2,
    },
    {
      productId: 'prod-4',
      name: 'Luminous Face Mask',
      price: 25.0,
      quantity: 1,
    },
  ]);

  const buyerProfile = userProfile as BuyerProfile | null;
  const ambassadorCode = 'ALEX2024';
  const ambassadorName = 'Alex Johnson';

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const holdToSaveTier = buyerProfile?.holdToSaveTier || 0;
  const discountAmount = (subtotal * holdToSaveTier) / 100;
  const total = subtotal - discountAmount;

  // Calculate tokens earned
  const tokensEarned = Math.floor(subtotal * 10); // 10 tokens per $1

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems(
      cartItems.map((item) =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems(cartItems.filter((item) => item.productId !== productId));
  };

  if (cartItems.length === 0) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-on-surface">Shopping Cart</h1>

        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-12 text-center">
          <p className="text-lg text-on-surface-variant mb-6">Your cart is empty</p>
          <Link
            href="/buyer/shop"
            className="inline-block rounded-lg bg-gradient-to-r from-primary-container to-primary hover:opacity-90 transition-all py-3 px-6 font-semibold text-on-primary"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-on-surface mb-2">Shopping Cart</h1>
        <p className="text-on-surface-variant">Review and proceed to checkout</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cart Items */}
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 space-y-4">
            <h2 className="text-lg font-semibold text-on-surface mb-6">Items ({cartItems.length})</h2>

            {cartItems.map((item, index) => (
              <div
                key={item.productId}
                className={`flex gap-4 pb-4 ${index !== cartItems.length - 1 ? 'border-b border-outline-variant/10' : ''}`}
              >
                {/* Product Image Placeholder */}
                <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-surface-container to-surface-container-highest flex-shrink-0 flex items-center justify-center">
                  <span className="text-xs text-gray-600">Image</span>
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-on-surface text-sm mb-1">{item.name}</h3>
                  <p className="text-sm text-secondary font-semibold">${item.price.toFixed(2)}</p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2 border border-outline-variant/20 rounded-lg bg-surface-container-low px-2">
                  <button
                    onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                    className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <HiOutlineMinus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-on-surface">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                    className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <HiOutlinePlus className="h-4 w-4" />
                  </button>
                </div>

                {/* Line Total */}
                <div className="text-right min-w-fit">
                  <p className="text-sm font-semibold text-on-surface">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => handleRemoveItem(item.productId)}
                    className="mt-1 text-xs text-error hover:text-error/80 font-semibold flex items-center gap-1"
                  >
                    <HiOutlineTrash className="h-3 w-3" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Ambassador Code Confirmation */}
          <div className="rounded-xl border border-primary/20 bg-surface-container-low p-6">
            <h3 className="font-semibold text-primary mb-4">Order Attribution</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-primary/20">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Ambassador</p>
                  <p className="text-sm font-bold text-primary">{ambassadorName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-0.5">Code</p>
                  <p className="text-sm font-mono font-bold text-primary bg-surface-container px-3 py-1 rounded">
                    {ambassadorCode}
                  </p>
                </div>
              </div>
              <p className="text-xs text-primary-fixed-dim/70">
                This order will be attributed to {ambassadorName}. Your purchase supports their business
                and earns them commissions. You can't change this code during checkout.
              </p>
            </div>
          </div>

          {/* Age Verification Reminder */}
          {!buyerProfile?.ageVerified && (
            <div className="rounded-xl border border-tertiary/20 bg-surface-container-low p-6 flex gap-4">
              <HiOutlineExclamation className="h-6 w-6 text-tertiary flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-tertiary mb-2">Age Verification Required</h3>
                <p className="text-sm text-tertiary/80 mb-4">
                  You must verify that you are 21+ before checkout. This will be completed as part of
                  the next step.
                </p>
                <button className="text-sm font-semibold text-tertiary hover:text-tertiary/80">
                  Learn more →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary - Right Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 space-y-4 sticky top-24">
            <h2 className="text-lg font-semibold text-on-surface">Order Summary</h2>

            {/* Subtotal */}
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Subtotal</span>
              <span className="text-on-surface">${subtotal.toFixed(2)}</span>
            </div>

            {/* Hold-to-Save Discount */}
            {holdToSaveTier > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Hold-to-Save Discount</span>
                  <span className="text-secondary font-semibold">-{holdToSaveTier}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Discount Amount</span>
                  <span className="text-secondary font-semibold">
                    -${discountAmount.toFixed(2)}
                  </span>
                </div>
              </>
            )}

            {/* Divider */}
            <div className="h-px bg-outline-variant/10" />

            {/* Total */}
            <div className="flex justify-between text-base">
              <span className="font-semibold text-on-surface">Total</span>
              <span className="text-2xl font-bold text-secondary">${total.toFixed(2)}</span>
            </div>

            {/* Tokens Earned */}
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
              <p className="text-xs text-gray-500 mb-1">Tokens You'll Earn</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-primary">{tokensEarned}</span>
                <span className="text-xs text-gray-500">$FAME</span>
              </div>
              <p className="text-xs text-primary-fixed-dim/70 mt-2">
                Earn 10 tokens per $1 spent. Use them for Hold-to-Save discounts!
              </p>
            </div>

            {/* Checkout Button */}
            <Link
              href="/buyer/checkout"
              className="block w-full rounded-lg bg-gradient-to-r from-primary-container to-primary hover:opacity-90 transition-all py-3 px-4 text-center font-semibold text-on-primary"
            >
              Proceed to Checkout
            </Link>

            {/* Continue Shopping */}
            <Link
              href="/buyer/shop"
              className="block w-full rounded-lg border border-outline-variant/20 bg-surface-container-highest hover:bg-surface-container-highest/80 transition-colors py-3 px-4 text-center font-semibold text-on-surface"
            >
              Continue Shopping
            </Link>

            {/* Security Notice */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Your payment information is encrypted and secure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
