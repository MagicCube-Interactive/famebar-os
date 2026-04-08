'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Activity,
  Award,
  Megaphone,
  Calendar,
  TrendingUp,
  BarChart3,
  Menu,
  X,
  Bell,
  HelpCircle,
  Settings,
} from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';

const navItems = [
  { label: 'Dashboard', href: '/leader', icon: Home },
  { label: 'Team Tree', href: '/leader/team-tree', icon: Users },
  { label: 'Team Activity', href: '/leader/activity', icon: Activity },
  { label: 'Milestones', href: '/leader/milestones', icon: Award },
  { label: 'Campaigns', href: '/leader/campaigns', icon: Megaphone },
  { label: 'Events', href: '/leader/events', icon: Calendar },
  { label: 'Leaderboard', href: '/leader/leaderboard', icon: TrendingUp },
  { label: 'Analytics', href: '/leader/analytics', icon: BarChart3 },
];

export default function LeaderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { userProfile } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/leader' ? pathname === '/leader' : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-14 px-6 bg-background">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 text-on-surface">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="text-lg font-bold tracking-tight text-on-surface">FameBar OS</span>
        </div>
        <div className="flex items-center gap-6">
          <button className="p-2 text-on-surface hover:bg-surface-container rounded-full transition-colors">
            <Bell className="h-5 w-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden flex items-center justify-center text-on-surface font-bold text-sm">
            L
          </div>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 h-full flex-col pt-4 pb-6 bg-gray-900 w-[240px] z-40 hidden md:flex">
        <div className="px-6 mb-8 mt-12">
          <h1 className="text-xl font-black bg-gradient-to-r from-primary-container to-primary bg-clip-text text-transparent">FameBar OS</h1>
          <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Enterprise Portal</p>
        </div>
        <nav className="flex-1 space-y-1">
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
          <button className="w-full mt-4 py-2 bg-surface-container-highest text-on-surface rounded-lg text-xs font-bold hover:bg-surface-variant transition-colors">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)}>
          <aside className="w-[240px] h-full bg-gray-900 pt-16 pb-6" onClick={(e) => e.stopPropagation()}>
            <nav className="space-y-1">
              {navItems.map((item) => {
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
      <main className="md:pl-[240px] pt-14 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
