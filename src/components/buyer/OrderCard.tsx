'use client';

import React, { useState } from 'react';
import { HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineArrowRight } from 'react-icons/hi';

interface OrderCardProps {
  /** Order ID */
  orderId: string;
  /** Order date (ISO 8601) */
  date: string;
  /** Order status */
  status: 'pending' | 'settled' | 'shipped' | 'delivered' | 'refunded';
  /** Number of items in order */
  itemCount: number;
  /** Order total ($) */
  total: number;
  /** Ambassador code used */
  ambassadorCode: string;
  /** Ambassador name */
  ambassadorName: string;
  /** Order items for expansion */
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  /** Callback for reorder button */
  onReorder?: () => void;
}

/**
 * OrderCard
 * Reusable order card for order history
 * Shows order status, date, items, and ambassador code
 * Expandable for detailed view
 */
export default function OrderCard({
  orderId,
  date,
  status,
  itemCount,
  total,
  ambassadorCode,
  ambassadorName,
  items = [],
  onReorder,
}: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = {
    pending: { badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', label: 'Pending', icon: '⏳' },
    settled: { badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30', label: 'Settled', icon: '✓' },
    shipped: { badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', label: 'Shipped', icon: '📦' },
    delivered: { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'Delivered', icon: '✓✓' },
    refunded: { badge: 'bg-red-500/20 text-red-300 border-red-500/30', label: 'Refunded', icon: '↩' },
  };

  const config = statusConfig[status];
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 overflow-hidden transition-all">
      {/* Card Header */}
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left Section: Order Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-2">
              <h3 className="text-lg font-bold text-white">Order #{orderId.slice(-8)}</h3>
              <p className="text-sm text-gray-500">{formattedDate}</p>
            </div>

            {/* Items Summary */}
            <p className="text-sm text-gray-400 mb-3">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} · Total:{' '}
              <span className="font-semibold text-emerald-400">${total.toFixed(2)}</span>
            </p>

            {/* Ambassador Code Badge */}
            <div className="inline-flex items-center gap-2 rounded-lg bg-amber-900/30 border border-amber-400/30 px-3 py-1.5">
              <p className="text-xs text-amber-200">Code:</p>
              <p className="text-xs font-mono font-bold text-amber-300">{ambassadorCode}</p>
            </div>
          </div>

          {/* Right Section: Status & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Status Badge */}
            <div
              className={`rounded-lg border px-3 py-2 text-center text-sm font-semibold ${config.badge}`}
            >
              <span className="mr-1">{config.icon}</span>
              {config.label}
            </div>

            {/* Expand Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-gray-200"
            >
              {isExpanded ? (
                <HiOutlineChevronUp className="h-5 w-5" />
              ) : (
                <HiOutlineChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && items.length > 0 && (
        <>
          <div className="h-px bg-gray-700/30" />
          <div className="p-6 space-y-4">
            {/* Items List */}
            <div>
              <h4 className="font-semibold text-gray-200 mb-3">Items in this order</h4>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div className="text-gray-400">
                      <p className="text-gray-100">{item.name}</p>
                      <p className="text-xs">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-100">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t border-gray-700/30 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-gray-100">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tokens Earned</span>
                <span className="font-semibold text-yellow-400">
                  {Math.floor(total * 10)} $FAME
                </span>
              </div>
            </div>

            {/* Reorder Button */}
            <button
              onClick={onReorder}
              className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors py-2.5 text-sm font-semibold text-emerald-300 flex items-center justify-center gap-2"
            >
              <HiOutlineArrowRight className="h-4 w-4" />
              Reorder
            </button>
          </div>
        </>
      )}
    </div>
  );
}
