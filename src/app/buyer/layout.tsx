'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ShoppingBag,
  ClipboardList,
  Star,
  Ticket,
  Calendar,
  HelpCircle,
  User,
  Menu,
  X,
  Bell,
} from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import type { BuyerProfile } from '@/types';

const sidebarItems = [
  { label: 'Dashboard', href: '/buyer', icon: Home },
  { label: 'Shop', href: '/buyer/shop', icon: ShoppingBag },
  { label: 'My Orders', href: '/buyer/orders', icon: ClipboardList },
  { label: 'Rewards', href: '/buyer/rewards', icon: Star },
  { label: 'Discounts', href: '/buyer/discounts', icon: Ticket },
  { label: 'Events', href: '/buyer/events', icon: Calendar },
  { label: 'Support', href: '/buyer/support', icon: HelpCircle },
  { label: 'Profile', href: '/buyer/profile', icon: User },
];

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { userProfile } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const buyerProfile = userProfile as BuyerProfile | null;

  const isActive = (href: string) =>
    href === '/buyer' ? pathname === '/buyer' : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-14 px-6 bg-background md:pl-[264px]">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 text-on-surface hover:bg-surface-container rounded-full transition-colors">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="text-lg font-bold tracking-tight text-on-surface md:hidden">FameBar OS</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low border border-outline-variant/10">
            <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_#4edea3]" />
            <span className="text-[10px] font-mono text-on-surface">SYSTEM LIVE</span>
          </div>
          <button className="p-2 text-on-surface hover:bg-surface-container rounded-full transition-colors">
            <Bell className="h-5 w-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-on-primary font-bold text-sm">
            {buyerProfile?.firstName?.[0] || 'B'}
          </div>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 h-full flex-col pt-4 pb-6 bg-gray-900 w-[240px] z-40 hidden md:flex shadow-2xl shadow-black/40">
        <div className="px-6 mb-8">
          <h1 className="text-xl font-black bg-gradient-to-r from-primary-container to-primary bg-clip-text text-transparent">FameBar OS</h1>
          <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase mt-1">Enterprise Portal</p>
        </div>
        <nav className="flex-1 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 py-3 px-4 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-gray-800 text-primary-container border-l-[3px] border-primary-container'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-on-surface'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto px-6 space-y-1">
          <div className="flex items-center gap-3 text-gray-400 py-3 cursor-pointer hover:text-on-surface transition-all">
            <HelpCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Help Center</span>
          </div>
          <button className="w-full text-left py-3 text-error font-medium text-sm flex items-center gap-3">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)}>
          <aside className="w-[240px] h-full bg-gray-900 pt-16 pb-6" onClick={(e) => e.stopPropagation()}>
            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 py-3 px-6 text-sm font-medium transition-all ${
                      active
                        ? 'bg-gray-800 text-primary-container border-l-[3px] border-primary-container'
                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-on-surface'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-14 md:ml-[240px] min-h-screen">
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full bg-surface-container-low flex justify-around items-center py-3 md:hidden z-50">
        {[
          { icon: Home, label: 'Home', href: '/buyer' },
          { icon: ShoppingBag, label: 'Shop', href: '/buyer/shop' },
          { icon: Star, label: 'Rewards', href: '/buyer/rewards' },
          { icon: User, label: 'Profile', href: '/buyer/profile' },
        ].map(({ icon: Icon, label, href }) => (
          <Link key={href} href={href} className={`flex flex-col items-center gap-1 ${isActive(href) ? 'text-primary-container' : 'text-on-surface'}`}>
            <Icon className="h-5 w-5" />
            <span className="text-[10px]">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
