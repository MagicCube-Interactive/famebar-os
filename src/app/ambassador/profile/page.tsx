'use client';

import React, { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { User, Mail, Phone, MapPin, Zap, MessageCircle, Shield, Copy, Check } from 'lucide-react';

export default function ProfilePage() {
  const { userProfile, isAdmin } = useAuthContext();
  const [copiedTelegram, setCopiedTelegram] = useState(false);
  const [copiedSignal, setCopiedSignal] = useState(false);

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-on-surface-variant mb-4">Unable to load profile data.</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary-container hover:underline text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // The userProfile comes from /api/me which returns a mix of:
  //   - profiles table fields in snake_case (full_name, created_at, telegram_handle, etc.)
  //   - ambassador_profiles fields in camelCase (referralCode, isFounder, totalSales, etc.)
  const p = userProfile;
  const ambassador = {
    firstName: p.full_name?.split(' ')[0] || p.firstName || '',
    lastName: p.full_name?.split(' ').slice(1).join(' ') || p.lastName || '',
    email: p.email || '',
    tier: p.tier ?? 1,
    isVerified: p.is_verified ?? p.isVerified ?? false,
    isFounder: p.is_founder ?? p.isFounder ?? false,
    totalSales: p.total_sales ?? p.totalSales ?? 0,
    totalRecruits: p.total_recruits ?? p.totalRecruits ?? 0,
    createdAt: p.created_at || p.createdAt || '',
    phoneNumber: p.phone_number ?? p.phoneNumber ?? null,
    telegramHandle: p.telegram_handle ?? p.telegramHandle ?? null,
    signalHandle: p.signal_handle ?? p.signalHandle ?? null,
    kycVerified: p.kyc_verified ?? p.kycVerified ?? false,
    payoutInfo: p.payout_info ?? p.payoutInfo ?? null,
    role: p.role || 'ambassador',
  };

  const handleCopyTelegram = () => {
    if (ambassador.telegramHandle) {
      navigator.clipboard.writeText(`@${ambassador.telegramHandle}`);
      setCopiedTelegram(true);
      setTimeout(() => setCopiedTelegram(false), 2000);
    }
  };

  const handleCopySignal = () => {
    if (ambassador.signalHandle) {
      navigator.clipboard.writeText(`@${ambassador.signalHandle}`);
      setCopiedSignal(true);
      setTimeout(() => setCopiedSignal(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Profile</h1>
        <p className="mt-2 text-gray-400">Manage your ambassador profile and settings</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-8">
        <div className="mb-8 flex flex-col items-center gap-6 lg:flex-row lg:items-start">
          {/* Avatar */}
          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-purple-500">
            <User className="h-12 w-12 text-gray-900" />
          </div>

          {/* Info */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-100">
              {ambassador.firstName} {ambassador.lastName}
            </h2>
            <p className="mt-2 text-sm text-gray-400">{ambassador.email}</p>

            {/* Status Badges */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              <span className="inline-flex rounded-full bg-fuchsia-500/20 px-3 py-1 text-xs font-semibold text-fuchsia-300">
                Level {ambassador.tier} Ambassador
              </span>
              {ambassador.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                  <Shield className="h-3 w-3" />
                  Verified
                </span>
              )}
              {ambassador.isFounder && (
                <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-500/20 px-3 py-1 text-xs font-semibold text-fuchsia-300">
                  👑 Founder
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 border-t border-gray-700/30 pt-6">
          <div>
            <p className="text-xs text-gray-500">Total Sales</p>
            <p className="mt-2 text-lg font-bold text-emerald-400">
              ${ambassador.totalSales.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Direct Recruits</p>
            <p className="mt-2 text-lg font-bold text-fuchsia-400">{ambassador.totalRecruits}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Joined</p>
            <p className="mt-2 text-lg font-bold text-cyan-400">
              {new Date(ambassador.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-100">
          <User className="h-5 w-5 text-fuchsia-400" />
          Contact Information
        </h2>

        <div className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-xs font-medium text-gray-500">Email</label>
            <div className="mt-2 flex items-center gap-3 rounded-lg bg-gray-900/50 p-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <p className="text-sm text-gray-200">{ambassador.email}</p>
              <span className="ml-auto inline-flex rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                Verified
              </span>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-medium text-gray-500">Phone Number</label>
            <div className="mt-2 flex items-center gap-3 rounded-lg bg-gray-900/50 p-3">
              <Phone className="h-4 w-4 text-gray-500" />
              <p className="text-sm text-gray-200">
                {ambassador.phoneNumber || 'Not provided'}
              </p>
            </div>
          </div>

          {/* Telegram */}
          <div>
            <label className="text-xs font-medium text-gray-500">Telegram Handle</label>
            <div className="mt-2 flex items-center gap-3 rounded-lg bg-gray-900/50 p-3">
              <Zap className="h-4 w-4 text-cyan-400" />
              <p className="text-sm text-gray-200">
                {ambassador.telegramHandle ? `@${ambassador.telegramHandle}` : 'Not connected'}
              </p>
              {ambassador.telegramHandle && (
                <button
                  onClick={handleCopyTelegram}
                  className="ml-auto p-2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {copiedTelegram ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Signal */}
          <div>
            <label className="text-xs font-medium text-gray-500">Signal</label>
            <div className="mt-2 flex items-center gap-3 rounded-lg bg-gray-900/50 p-3">
              <MessageCircle className="h-4 w-4 text-cyan-400" />
              <p className="text-sm text-gray-200">
                {ambassador.signalHandle ? `@${ambassador.signalHandle}` : 'Not connected'}
              </p>
              {ambassador.signalHandle && (
                <button
                  onClick={handleCopySignal}
                  className="ml-auto p-2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {copiedSignal ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <button className="mt-6 w-full rounded-lg border border-fuchsia-500/50 bg-fuchsia-500/10 px-4 py-2.5 text-sm font-semibold text-fuchsia-300 transition-all duration-200 hover:bg-fuchsia-500/20">
          Edit Contact Information
        </button>
      </div>

      {/* Verification Status */}
      <div className="rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-100">
          <Shield className="h-5 w-5 text-emerald-400" />
          Verification Status
        </h2>

        <div className="space-y-4">
          {/* KYC Verification */}
          <div className="flex items-center justify-between rounded-lg bg-gray-900/50 p-4">
            <div>
              <p className="font-medium text-gray-200">Identity Verification (KYC)</p>
              <p className="mt-1 text-xs text-gray-500">Government ID verification required</p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                ambassador.kycVerified
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-fuchsia-500/20 text-fuchsia-300'
              }`}
            >
              {ambassador.kycVerified ? '✓ Verified' : 'Pending'}
            </span>
          </div>

          {/* Age Verification */}
          <div className="flex items-center justify-between rounded-lg bg-gray-900/50 p-4">
            <div>
              <p className="font-medium text-gray-200">Age Verification (21+)</p>
              <p className="mt-1 text-xs text-gray-500">Required for earning commissions</p>
            </div>
            <span className="inline-flex rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
              ✓ Verified
            </span>
          </div>

          {/* Payout Info */}
          <div className="flex items-center justify-between rounded-lg bg-gray-900/50 p-4">
            <div>
              <p className="font-medium text-gray-200">Payout Information</p>
              <p className="mt-1 text-xs text-gray-500">Bank details for commission payouts</p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                ambassador.payoutInfo?.accountNumber
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-fuchsia-500/20 text-fuchsia-300'
              }`}
            >
              {ambassador.payoutInfo?.accountNumber ? '✓ Complete' : 'Update'}
            </span>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
        <h2 className="mb-6 text-lg font-semibold text-gray-100">Preferences</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-200">Marketing Emails</p>
              <p className="mt-1 text-xs text-gray-500">Campaigns, promotions, updates</p>
            </div>
            <div className="h-6 w-11 rounded-full bg-emerald-500/30" />
          </div>

          <div className="border-t border-gray-700/30" />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-200">Telegram Notifications</p>
              <p className="mt-1 text-xs text-gray-500">Direct Telegram updates</p>
            </div>
            <div className="h-6 w-11 rounded-full bg-emerald-500/30" />
          </div>

          <div className="border-t border-gray-700/30" />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-200">Signal Notifications</p>
              <p className="mt-1 text-xs text-gray-500">Direct Signal updates</p>
            </div>
            <div className="h-6 w-11 rounded-full bg-emerald-500/30" />
          </div>

          <div className="border-t border-gray-700/30" />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-200">SMS Alerts</p>
              <p className="mt-1 text-xs text-gray-500">Critical updates only</p>
            </div>
            <div className="h-6 w-11 rounded-full bg-gray-700/50" />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-6">
        <h2 className="mb-4 text-lg font-semibold text-red-300">Account Management</h2>
        <p className="mb-4 text-sm text-red-200/80">
          These actions cannot be undone. Proceed with caution.
        </p>
        <div className="space-y-2">
          <button className="w-full rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition-all duration-200 hover:bg-red-500/20">
            Pause Account
          </button>
          <button className="w-full rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition-all duration-200 hover:bg-red-500/20">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
