'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HiOutlineHome,
  HiOutlineShoppingBag,
  HiOutlineClipboardList,
  HiOutlineStar,
  HiOutlineTicket,
  HiOutlineCalendar,
  HiOutlineQuestionMarkCircle,
  HiOutlineUser,
  HiOutlineMenu,
  HiOutlineX,
} from 'react-icons/hi';
import { useAuthContext } from '@/context/AuthContext';
import type { BuyerProfile } from '@/types';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * BuyerLayout
 * Main layout for the buyer portal with sidebar navigation and responsive design
 * Shows ambassador who referred the buyer in the top bar
 */
export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { userProfile, isAuthenticated } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const buyerProfile = userProfile as BuyerProfile | null;

  const sidebarItems: SidebarItem[] = [
    { label: 'Home', href: '/buyer', icon: HiOutlineHome },
    { label: 'Shop', href: '/buyer/shop', icon: HiOutlineShoppingBag },
    { label: 'My Orders', href: '/buyer/orders', icon: HiOutlineClipboardList },
    { label: 'Rewards', href: '/buyer/rewards', icon: HiOutlineStar },
    { label: 'Discounts', href: '/buyer/discounts', icon: HiOutlineTicket },
    { label: 'Events', href: '/buyer/events', icon: HiOutlineCalendar },
    { label: 'Support', href: '/buyer/support', icon: HiOutlineQuestionMarkCircle },
    { label: 'Profile', href: '/buyer/profile', icon: HiOutlineUser },
  ];

  const isActive = (href: string) => {
    if (href === '/buyer') {
      return pathname === '/buyer';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mr-2 rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 transition-colors hover:bg-gray-700 lg:hidden"
          >
            {sidebarOpen ? (
              <HiOutlineX className="h-5 w-5" />
            ) : (
              <HiOutlineMenu className="h-5 w-5" />
            )}
          </button>

          {/* Top Bar Title */}
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-white">FameBar Buyer Portal</h1>
            {buyerProfile?.referredBy && (
              <p className="text-xs text-gray-400">
                Referred by: <span className="text-amber-300">Ambassador</span>
              </p>
            )}
          </div>

          {/* User Profile Avatar (Right) */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <p className="text-sm font-semibold text-gray-100">
                {buyerProfile?.firstName} {buyerProfile?.lastName}
              </p>
              <p className="text-xs text-gray-400">Buyer</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center font-bold text-gray-900">
              {buyerProfile?.firstName?.[0]}
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden w-64 border-r border-gray-800 bg-gray-900/50 lg:block">
          <nav className="space-y-2 p-6">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                    active
                      ? 'border border-amber-400/30 bg-amber-400/10 text-amber-300'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Sidebar - Mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <aside className="w-64 border-r border-gray-800 bg-gray-900">
              <nav className="space-y-2 p-6">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                        active
                          ? 'border border-amber-400/30 bg-amber-400/10 text-amber-300'
                          : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 sm:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
