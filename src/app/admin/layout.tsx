'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
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
  Menu,
  X,
  Zap,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: <Home className="h-5 w-5" /> },
  { label: 'Users', href: '/admin/users', icon: <Users className="h-5 w-5" /> },
  { label: 'Ambassadors', href: '/admin/ambassadors', icon: <Users className="h-5 w-5" /> },
  { label: 'Orders', href: '/admin/orders', icon: <ShoppingCart className="h-5 w-5" /> },
  { label: 'Cash Ledger', href: '/admin/cash-ledger', icon: <DollarSign className="h-5 w-5" /> },
  { label: 'Token Ledger', href: '/admin/token-ledger', icon: <Coins className="h-5 w-5" /> },
  { label: 'Campaigns', href: '/admin/campaigns', icon: <Megaphone className="h-5 w-5" /> },
  { label: 'Events', href: '/admin/events', icon: <Calendar className="h-5 w-5" /> },
  { label: 'Fraud & Reviews', href: '/admin/fraud', icon: <AlertTriangle className="h-5 w-5" /> },
  { label: 'Content Library', href: '/admin/content', icon: <FileText className="h-5 w-5" /> },
  { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 className="h-5 w-5" /> },
  { label: 'Settings', href: '/admin/settings', icon: <Settings className="h-5 w-5" /> },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

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
              <h1 className="text-lg font-bold bg-gradient-to-r from-red-500 to-rose-400 bg-clip-text text-transparent">
                ADMIN CONTROL
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
                    ? 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border border-red-500/30'
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
                Admin Mission Control
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Real-time platform monitoring and operations
              </p>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-900/20 px-4 py-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-300">System Operational</span>
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
