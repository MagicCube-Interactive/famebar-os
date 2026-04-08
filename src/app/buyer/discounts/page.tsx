'use client';

import React from 'react';
import Link from 'next/link';
import {
  HiOutlineTicket,
  HiOutlineLightningBolt,
  HiOutlineArrowRight,
  HiOutlineCalculator,
} from 'react-icons/hi';
import { useAuthContext } from '@/context/AuthContext';
import HoldToSaveLadder from '@/components/buyer/HoldToSaveLadder';
import type { BuyerProfile } from '@/types';

/**
 * DiscountsPage
 * Hold-to-Save tier status and discount management page
 * Shows current tier, savings, and how to unlock more rewards
 * Includes ambassador signup CTA (recruitment)
 */
export default function DiscountsPage() {
  const { userProfile } = useAuthContext();
  const buyerProfile = userProfile as BuyerProfile | null;

  const currentBalance = buyerProfile?.fameBalance || 0;
  const holdToSaveTier = buyerProfile?.holdToSaveTier || 0;

  // Sample order for savings calculator
  const sampleOrderTotal = 100;
  const estimatedSavings = (sampleOrderTotal * holdToSaveTier) / 100;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Discounts & Tiers</h1>
        <p className="text-gray-400">Track your Hold-to-Save tier and learn how to earn more</p>
      </div>

      {/* Current Tier Summary Card */}
      <div className="rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-900/30 to-yellow-900/20 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Tier Info */}
          <div>
            <p className="text-xs font-semibold text-amber-200/70 mb-2">YOUR CURRENT TIER</p>
            <h2 className="text-4xl font-black text-amber-300 mb-2">
              {holdToSaveTier === 0
                ? 'Bronze'
                : holdToSaveTier === 5
                ? 'Silver ⭐'
                : holdToSaveTier === 10
                ? 'Gold ✨'
                : holdToSaveTier === 15
                ? 'Diamond 💎'
                : 'Platinum 🌟'}
            </h2>
            <p className="text-2xl font-bold text-amber-400 mb-4">{holdToSaveTier}% Discount</p>
            <p className="text-sm text-amber-200/80">
              {holdToSaveTier === 0
                ? 'Start earning $FAME tokens to unlock your first discount tier'
                : 'Applied automatically to all your purchases'}
            </p>
          </div>

          {/* Right: Quick Stats */}
          <div className="space-y-4">
            <div className="rounded-lg bg-amber-950/50 border border-amber-400/30 p-4">
              <p className="text-xs text-amber-200/70 mb-1">Current Balance</p>
              <p className="text-3xl font-bold text-amber-400">{currentBalance.toLocaleString()}</p>
              <p className="text-xs text-amber-200/70 mt-1">$FAME tokens</p>
            </div>

            <div className="rounded-lg bg-emerald-950/30 border border-emerald-400/30 p-4">
              <p className="text-xs text-emerald-200/70 mb-1">Est. Annual Savings</p>
              <p className="text-3xl font-bold text-emerald-400">
                ${(sampleOrderTotal * 12 * holdToSaveTier / 100).toFixed(2)}
              </p>
              <p className="text-xs text-emerald-200/70 mt-1">on $100/month purchases</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Ladder */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Hold-to-Save Tier Ladder</h2>
        <HoldToSaveLadder currentBalance={currentBalance} />
      </div>

      {/* Savings Calculator */}
      <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-8">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-white mb-6">
          <HiOutlineCalculator className="h-6 w-6 text-emerald-400" />
          Savings Calculator
        </h2>

        <p className="text-gray-400 mb-6">
          See how much you save with your current tier on different order amounts:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[25, 50, 75, 100].map((amount) => {
            const savings = (amount * holdToSaveTier) / 100;
            return (
              <div key={amount} className="rounded-lg border border-gray-600 bg-gray-700/20 p-4">
                <p className="text-sm text-gray-500 mb-2">Order: ${amount}</p>
                <p className="text-3xl font-bold text-white mb-2">${amount.toFixed(2)}</p>
                {holdToSaveTier > 0 && (
                  <>
                    <div className="h-px bg-gray-600 my-3" />
                    <p className="text-xs text-gray-500 mb-1">You Save</p>
                    <p className="text-xl font-bold text-emerald-400">${savings.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">({holdToSaveTier}% off)</p>
                  </>
                )}
                {holdToSaveTier === 0 && (
                  <p className="text-xs text-gray-500 mt-3">Unlock tiers to save!</p>
                )}
              </div>
            );
          })}
        </div>

        {holdToSaveTier === 0 && (
          <div className="mt-6 rounded-lg border border-blue-500/30 bg-blue-950/20 p-4">
            <p className="text-sm text-blue-300">
              💡 <span className="font-semibold">Start earning:</span> Make your first purchase to earn
              $FAME tokens and unlock discounts!
            </p>
          </div>
        )}
      </div>

      {/* How to Earn More $FAME */}
      <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">How to Earn More $FAME</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Method 1: Buy More */}
          <div className="rounded-lg border border-gray-600 bg-gray-700/20 p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-3">
              <HiOutlineLightningBolt className="h-5 w-5 text-yellow-400" />
              Buy More Products
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Earn 10 $FAME tokens for every $1 you spend on any purchase through your ambassador.
            </p>
            <Link
              href="/buyer/shop"
              className="inline-flex items-center gap-2 text-sm font-semibold text-yellow-400 hover:text-yellow-300"
            >
              Shop now <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Method 2: Become an Ambassador */}
          <div className="rounded-lg border border-purple-500/30 bg-purple-900/20 p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold text-purple-300 mb-3">
              <HiOutlineTicket className="h-5 w-5" />
              Become an Ambassador
            </h3>
            <p className="text-sm text-purple-200/80 mb-4">
              Earn commissions AND tokens by referring friends. Ambassadors earn significantly more
              rewards.
            </p>
            <button className="inline-flex items-center gap-2 text-sm font-semibold text-purple-300 hover:text-purple-200">
              Learn more <HiOutlineArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tier Requirements */}
      <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Tier Requirements</h2>

        <div className="space-y-3">
          <div className="rounded-lg border border-gray-600 bg-gray-700/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-100">⭐ Silver Tier</p>
              <p className="text-sm font-bold text-amber-300">10,000 tokens</p>
            </div>
            <p className="text-sm text-gray-400">5% discount on personal orders</p>
          </div>

          <div className="rounded-lg border border-gray-600 bg-gray-700/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-100">✨ Gold Tier</p>
              <p className="text-sm font-bold text-amber-300">25,000 tokens</p>
            </div>
            <p className="text-sm text-gray-400">10% discount on personal orders</p>
          </div>

          <div className="rounded-lg border border-gray-600 bg-gray-700/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-100">💎 Diamond Tier</p>
              <p className="text-sm font-bold text-amber-300">50,000 tokens</p>
            </div>
            <p className="text-sm text-gray-400">15% discount on personal orders</p>
          </div>

          <div className="rounded-lg border border-gray-600 bg-gray-700/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-100">🌟 Platinum Tier</p>
              <p className="text-sm font-bold text-amber-300">100,000 tokens</p>
            </div>
            <p className="text-sm text-gray-400">20% discount on personal orders</p>
          </div>
        </div>
      </div>

      {/* Ambassador Recruitment CTA */}
      <div className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-900/30 to-cyan-900/20 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left: Text */}
          <div>
            <h2 className="text-3xl font-bold text-blue-300 mb-4">Level Up Your Rewards</h2>
            <p className="text-blue-200/80 mb-6">
              As a buyer, you're earning tokens at 10 per dollar. But ambassadors earn{' '}
              <span className="font-bold">25% commission</span> on every sale they refer, PLUS tokens
              on their own purchases.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex gap-3">
                <span className="text-blue-400 font-bold">✓</span>
                <span className="text-blue-200/80">Earn commissions from direct referrals</span>
              </div>
              <div className="flex gap-3">
                <span className="text-blue-400 font-bold">✓</span>
                <span className="text-blue-200/80">Build passive income from your network</span>
              </div>
              <div className="flex gap-3">
                <span className="text-blue-400 font-bold">✓</span>
                <span className="text-blue-200/80">Access exclusive ambassador benefits</span>
              </div>
            </div>

            <button className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 transition-all py-3 px-6 font-bold text-white flex items-center gap-2">
              Become an Ambassador <HiOutlineArrowRight className="h-5 w-5" />
            </button>
          </div>

          {/* Right: Comparison */}
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-600 bg-gray-700/20 p-6">
              <h3 className="font-bold text-gray-100 mb-4">Buyer (You)</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>Earn per $25 purchase</span>
                  <span className="font-semibold text-yellow-400">250 $FAME</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual (12x purchases)</span>
                  <span className="font-semibold text-yellow-400">3,000 $FAME</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-purple-500/30 bg-purple-900/20 p-6">
              <h3 className="font-bold text-purple-300 mb-4">Ambassador</h3>
              <div className="space-y-2 text-sm text-purple-200/80">
                <div className="flex justify-between">
                  <span>Earn per $25 referral</span>
                  <span className="font-semibold text-emerald-400">$6.25 commission</span>
                </div>
                <div className="flex justify-between">
                  <span>+ Personal earnings</span>
                  <span className="font-semibold text-emerald-400">250 $FAME</span>
                </div>
                <div className="h-px bg-purple-500/30 my-2" />
                <div className="flex justify-between font-bold">
                  <span>Per referral total</span>
                  <span className="text-emerald-400">$6.25 + tokens</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>

        <div className="space-y-4">
          <details className="group border border-gray-600 rounded-lg overflow-hidden">
            <summary className="cursor-pointer bg-gray-700/20 p-4 font-semibold text-gray-100 hover:bg-gray-700/40 transition-colors">
              Do my tokens expire?
            </summary>
            <div className="bg-gray-800/20 p-4 text-gray-400 text-sm">
              No, your tokens never expire as long as your account is active. They're tied to your
              account permanently.
            </div>
          </details>

          <details className="group border border-gray-600 rounded-lg overflow-hidden">
            <summary className="cursor-pointer bg-gray-700/20 p-4 font-semibold text-gray-100 hover:bg-gray-700/40 transition-colors">
              When does my discount apply?
            </summary>
            <div className="bg-gray-800/20 p-4 text-gray-400 text-sm">
              Your discount applies automatically at checkout if you meet the minimum token balance
              for that tier.
            </div>
          </details>

          <details className="group border border-gray-600 rounded-lg overflow-hidden">
            <summary className="cursor-pointer bg-gray-700/20 p-4 font-semibold text-gray-100 hover:bg-gray-700/40 transition-colors">
              Can I combine discounts?
            </summary>
            <div className="bg-gray-800/20 p-4 text-gray-400 text-sm">
              Hold-to-Save discounts cannot be combined with promotional codes, but they apply to all
              regular orders automatically.
            </div>
          </details>

          <details className="group border border-gray-600 rounded-lg overflow-hidden">
            <summary className="cursor-pointer bg-gray-700/20 p-4 font-semibold text-gray-100 hover:bg-gray-700/40 transition-colors">
              How do I track tier progress?
            </summary>
            <div className="bg-gray-800/20 p-4 text-gray-400 text-sm">
              Check your Rewards page to see your current balance, tier, and progress to the next
              tier with a visual progress bar.
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
