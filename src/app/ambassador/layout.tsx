'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { signOut } from '@/lib/supabase/auth';
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
  HelpCircle,
  Bell,
  GitBranch,
} from 'lucide-react';

const baseNavItems = [
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

export default function AmbassadorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile, isAuthenticated, isAmbassador: isAmbassadorRole, isAdmin } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try { await signOut(); } catch (e) { console.error(e); }
    router.push('/login');
  };

  // Build nav items — include Team Tree for tier 4+ ambassadors or admins
  const navItems = useMemo(() => {
    const items = [...baseNavItems];
    const tier = userProfile?.tier ?? 0;
    if (tier >= 4 || isAdmin) {
      // Insert Team Tree after the Team item
      const teamIdx = items.findIndex((i) => i.label === 'Team');
      items.splice(teamIdx + 1, 0, {
        label: 'Team Tree',
        href: '/ambassador/team-tree',
        icon: GitBranch,
      });
    }
    return items;
  }, [userProfile, isAdmin]);

  if (!isAuthenticated || (!isAmbassadorRole && !isAdmin) || !userProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-on-surface-variant">Loading...</p>
      </div>
    );
  }

  const ambassador = userProfile;

  const isActive = (href: string) =>
    href === '/ambassador' ? pathname === '/ambassador' : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-14 px-6 bg-background">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold tracking-tight text-on-surface">FameBar OS</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-on-surface hover:bg-surface-container rounded-full transition-colors">
            <Bell className="h-5 w-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-on-primary font-bold text-sm">
            {ambassador.full_name?.[0] || ambassador.firstName?.[0] || 'A'}
          </div>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 h-full flex-col pt-4 pb-6 bg-gray-900 w-[240px] z-40 hidden md:flex">
        <div className="px-6 mb-8 pt-10">
          <h1 className="text-xl font-black bg-gradient-to-r from-primary-container to-primary bg-clip-text text-transparent">FameBar OS</h1>
          <p className="text-[10px] text-gray-500 font-medium tracking-widest uppercase mt-1">Enterprise Portal</p>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
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
        <div className="mt-auto px-4 space-y-4">
          <div className="flex items-center gap-3 text-gray-400 py-3 px-4 cursor-pointer hover:text-on-surface transition-all">
            <HelpCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Help Center</span>
          </div>
          <button onClick={handleSignOut} className="w-full py-3 px-4 bg-surface-container-high rounded-lg text-sm font-bold text-on-surface hover:bg-surface-variant transition-colors">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
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

      {/* Mobile Menu Button (top-left on mobile) */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 md:hidden text-on-surface"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Main Content */}
      <main className="md:ml-[240px] pt-14 min-h-screen">
        <div className="max-w-[1400px] mx-auto p-6 md:p-8 lg:p-12">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full bg-surface-container-low flex justify-around items-center py-3 md:hidden z-50">
        {[
          { icon: Home, label: 'Home', href: '/ambassador' },
          { icon: TrendingUp, label: 'Earnings', href: '/ambassador/earnings' },
          { icon: Users2, label: 'Team', href: '/ambassador/team' },
          { icon: Share2, label: 'Share', href: '/ambassador/share' },
          { icon: User, label: 'Profile', href: '/ambassador/profile' },
        ].map(({ icon: Icon, label, href }) => (
          <Link key={href} href={href} className={`flex flex-col items-center gap-1 ${isActive(href) ? 'text-primary-container' : 'text-on-surface-variant'}`}>
            <Icon className="h-5 w-5" />
            <span className="text-[10px]">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
