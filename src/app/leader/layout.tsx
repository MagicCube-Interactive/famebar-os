'use client';

import React from 'react';
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
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Leader Home', href: '/leader', icon: <Home className="h-5 w-5" /> },
  { label: 'Team Tree', href: '/leader/team-tree', icon: <Users className="h-5 w-5" /> },
  { label: 'Team Activity', href: '/leader/activity', icon: <Activity className="h-5 w-5" /> },
  { label: 'Milestones', href: '/leader/milestones', icon: <Award className="h-5 w-5" /> },
  { label: 'Campaigns', href: '/leader/campaigns', icon: <Megaphone className="h-5 w-5" /> },
  { label: 'Event Management', href: '/leader/events', icon: <Calendar className="h-5 w-5" /> },
  { label: 'Leaderboard', href: '/leader/leaderboard', icon: <TrendingUp className="h-5 w-5" /> },
  { label: 'Analytics', href: '/leader/analytics', icon: <BarChart3 className="h-5 w-5" /> },
];

export default function LeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { userProfile } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const leaderProfile = userProfile as any;
  const leaderName = leaderProfile?.firstName || 'Leader';
  const teamSize = leaderProfile?.totalRecruits || 0;
  const leaderRank = leaderProfile?.tier || 0;

  const rankLabels = ['Ambassador', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6'];

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } border-r border-gray-800 bg-gray-900/50 backdrop-blur transition-all duration-300 overflow-y-auto`}
      >
        {/* Logo / Branding */}
        <div className="border-b border-gray-800 p-4">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-lg font-bold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                LEADER PORTAL
              </h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-1.5 hover:bg-gray-800 transition-colors"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5 text-gray-400" />
              ) : (
                <Menu className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
                title={sidebarOpen ? undefined : item.label}
              >
                {item.icon}
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-100">
                Welcome back, {leaderName}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Rank: <span className="font-semibold text-amber-300">{rankLabels[leaderRank]}</span> • Team Size:{' '}
                <span className="font-semibold text-green-400">{teamSize} ambassadors</span>
              </p>
            </div>

            {/* Leader Badge */}
            <div className="rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-yellow-900/20 px-4 py-3">
              <div className="text-right">
                <p className="text-xs text-gray-400">LEADER TIER</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                  L{leaderRank}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
