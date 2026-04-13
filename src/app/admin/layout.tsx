'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '@/lib/supabase/auth';
import {
  Home,
  PlusCircle,
  Users,
  ShoppingCart,
  DollarSign,
  Coins,
  Megaphone,
  Calendar,
  AlertTriangle,
  FileText,
  BarChart3,
  Settings,
  Bell,
  HelpCircle,
} from 'lucide-react';

const navItems = [
  { label: 'Overview', href: '/admin', icon: Home },
  { label: 'Record Sale', href: '/admin/record-sale', icon: PlusCircle },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Ambassadors', href: '/admin/ambassadors', icon: Users },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Cash Ledger', href: '/admin/cash-ledger', icon: DollarSign },
  { label: 'Token Ledger', href: '/admin/token-ledger', icon: Coins },
  { label: 'Campaigns', href: '/admin/campaigns', icon: Megaphone },
  { label: 'Events', href: '/admin/events', icon: Calendar },
  { label: 'Fraud & Reviews', href: '/admin/fraud', icon: AlertTriangle },
  { label: 'Content Library', href: '/admin/content', icon: FileText },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try { await signOut(); } catch (e) { console.error(e); }
    router.push('/login');
  };

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-14 px-6 bg-surface-container-low">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold tracking-tight text-on-surface">FameClub</span>
          <div className="hidden md:flex gap-6 ml-8">
            <Link href="/admin" className={`text-sm font-semibold ${pathname === '/admin' ? 'text-primary-container' : 'text-on-surface hover:bg-surface-container p-1 rounded transition-colors'}`}>Dashboard</Link>
            <Link href="/admin/analytics" className={`text-sm font-semibold ${pathname === '/admin/analytics' ? 'text-primary-container' : 'text-on-surface hover:bg-surface-container p-1 rounded transition-colors'}`}>Analytics</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-on-surface hover:bg-surface-container rounded-full transition-colors">
            <Bell className="h-5 w-5" />
          </button>
          <div className="w-8 h-8 rounded bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center text-on-surface font-bold text-sm">
            A
          </div>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 h-full flex-col pt-16 pb-6 bg-gray-900 w-[240px] z-40 hidden md:flex shadow-2xl shadow-black/40">
        <div className="px-6 mb-8">
          <h2 className="text-xl font-black bg-gradient-to-r from-primary-container to-primary bg-clip-text text-transparent">FameClub</h2>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Enterprise Portal</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 py-3 px-4 text-sm font-medium transition-all ${
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
        <div className="mt-auto px-4 space-y-1">
          <div className="flex items-center gap-3 text-gray-400 py-3 px-4 cursor-pointer hover:text-on-surface transition-all">
            <HelpCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Help Center</span>
          </div>
          <button onClick={handleSignOut} className="w-full mt-4 py-2 px-4 rounded bg-surface-container-highest text-sm font-bold text-on-surface hover:bg-surface-variant transition-colors border border-outline-variant/10">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-[240px] pt-14 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
