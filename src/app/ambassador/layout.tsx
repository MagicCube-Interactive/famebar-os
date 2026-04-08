'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { isAmbassador } from '@/types';
import {
  Menu,
  X,
  Home,
  Share2,
  TrendingUp,
  Coins,
  Users,
  Users2,
  BookOpen,
  Megaphone,
  Calendar,
  User,
  ChevronDown,
} from 'lucide-react';

/**
 * Ambassador Portal Layout
 * Provides sidebar navigation and top bar for all ambassador routes
 */
export default function AmbassadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { userProfile, isAmbassador: isAmbassadorRole } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAmbassadorRole || !userProfile || !isAmbassador(userProfile)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <p className="text-gray-400">Access restricted to ambassadors</p>
        </div>
      </div>
    );
  }

  const ambassador = userProfile;

  // Navigation menu items
  const navItems = [
    { label: 'Dashboard', href: '/ambassador', icon: Home },
    { label: 'Share Hub', href: '/ambassador/share', icon: Share2 },
    { label: 'Earnings', href: '/ambassador/earnings', icon: TrendingUp },
    { label: 'Token Vault', href: '/ambassador/tokens', icon: Coins },
    { label: 'Customers', href: '/ambassador/customers', icon: Users },
    { label: 'Team', href: '/ambassador/team', icon: Users2 },
    { label: 'Training', href: '/ambassador/training', icon: BookOpen },
    { label: 'Campaigns', href: '/ambassador/campaigns', icon: Megaphone },
    { label: 'Events', href: '/ambassador/events', icon: Calendar },
    { label: 'Profile', href: '/ambassador/profile', icon: User },
  ];

  // Get ambassador rank badge
  const getRankBadge = (tier: number) => {
    const tiers = ['Novice', 'Scout', 'Agent', 'Manager', 'Director', 'Executive', 'Founder'];
    return tiers[tier] || 'Novice';
  };

  // Get today's earnings (mock)
  const todayEarnings = 127.50;

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-900 to-gray-950 p-6 transition-transform duration-300 lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500" />
            <span className="font-bold text-gray-100">FameBar</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-amber-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="absolute bottom-6 left-6 right-6 space-y-3 border-t border-gray-700/50 pt-4">
          <div className="rounded-lg bg-gray-800/50 p-3">
            <p className="text-xs text-gray-500">Ambassador Tier</p>
            <p className="mt-1 text-sm font-semibold text-amber-300">
              {getRankBadge(ambassador.tier)}
            </p>
          </div>
          <div className="rounded-lg bg-gray-800/50 p-3">
            <p className="text-xs text-gray-500">Total Sales</p>
            <p className="mt-1 text-sm font-semibold text-emerald-400">
              ${ambassador.totalSales.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="border-b border-gray-800/50 bg-gray-900/50 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-6">
            {/* Left side: Menu toggle + Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <Menu className="h-6 w-6 text-gray-400" />
              </button>
              <h1 className="text-lg font-semibold text-gray-100">Ambassador Portal</h1>
            </div>

            {/* Right side: Stats + User */}
            <div className="flex items-center gap-6">
              {/* Quick Stats */}
              <div className="hidden md:flex items-center gap-4 border-r border-gray-700/50 pr-6">
                <div>
                  <p className="text-xs text-gray-500">Today's Earnings</p>
                  <p className="text-sm font-bold text-emerald-400">${todayEarnings.toFixed(2)}</p>
                </div>
                <div className="h-10 w-px bg-gray-700/50" />
                <div>
                  <p className="text-xs text-gray-500">Personal Sales</p>
                  <p className="text-sm font-bold text-amber-300">
                    ${ambassador.personalSalesThisMonth.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* User Profile */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-200">
                    {ambassador.firstName} {ambassador.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{getRankBadge(ambassador.tier)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-950">
          <div className="mx-auto max-w-7xl p-6">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
