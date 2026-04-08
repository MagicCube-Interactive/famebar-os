'use client';

import React, { useEffect, useState } from 'react';
import { HiOutlineStar, HiOutlineClock, HiOutlineInformationCircle } from 'react-icons/hi';
import { useAuthContext } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { PLATFORM_CONFIG } from '@/types';

interface TokenTransaction {
  id: string;
  date: string;
  type: 'earned' | 'pending' | 'spent' | 'clawedback';
  amount: number;
  order_id: string | null;
}

export default function RewardsPage() {
  const { user, role } = useAuthContext();
  const [fameBalance, setFameBalance] = useState(0);
  const [holdToSaveTier, setHoldToSaveTier] = useState(0);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || role !== 'buyer') return;

    const fetchData = async () => {
      const supabase = createClient();

      const [profileResult, ordersResult] = await Promise.all([
        supabase
          .from('buyer_profiles')
          .select('fame_balance, hold_to_save_tier')
          .eq('id', user.id)
          .single(),

        // Get buyer's order IDs to look up token events
        supabase
          .from('orders')
          .select('id')
          .eq('buyer_id', user.id),
      ]);

      if (profileResult.data) {
        setFameBalance(Number(profileResult.data.fame_balance));
        setHoldToSaveTier(Number(profileResult.data.hold_to_save_tier));
      }

      const orderIds = (ordersResult.data || []).map((o: any) => o.id);
      if (orderIds.length > 0) {
        const { data: tokenData } = await supabase
          .from('token_events')
          .select('id, order_id, final_tokens, status, created_at')
          .in('order_id', orderIds)
          .order('created_at', { ascending: false })
          .limit(50);

        setTransactions(
          (tokenData || []).map((t: any) => ({
            id: t.id,
            date: t.created_at?.split('T')[0] || '',
            type: t.status === 'available' ? 'earned' : t.status === 'pending' ? 'pending' : t.status === 'spent' ? 'spent' : 'clawedback',
            amount: Number(t.final_tokens),
            order_id: t.order_id,
          }))
        );
      }

      setLoading(false);
    };

    fetchData();
  }, [user, role]);

  if (!user || role !== 'buyer') return null;

  const totalEarned = transactions.filter(t => t.type === 'earned').reduce((s, t) => s + t.amount, 0);
  const totalPending = transactions.filter(t => t.type === 'pending').reduce((s, t) => s + t.amount, 0);

  const tierThresholds = [10000, 25000, 50000, 100000];
  const currentTierIndex = tierThresholds.findIndex(t => fameBalance < t);
  const nextThreshold = currentTierIndex >= 0 ? tierThresholds[currentTierIndex] : 100000;
  const tokensToNextTier = nextThreshold - fameBalance;

  const tierLabel = holdToSaveTier === 0 ? 'Bronze (No Discount)' : holdToSaveTier === 5 ? 'Silver ⭐' : holdToSaveTier === 10 ? 'Gold ✨' : holdToSaveTier === 15 ? 'Diamond 💎' : 'Platinum 🌟';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">$FAME Rewards Vault</h1>
        <p className="text-gray-400">Manage your tokens and track your earnings</p>
      </div>

      {/* Balance Card */}
      <div className="rounded-xl border border-yellow-400/30 bg-gradient-to-br from-yellow-900/30 to-amber-900/20 p-8">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-yellow-200">
            <HiOutlineStar className="h-5 w-5 text-yellow-400" />
            Your Current Balance
          </h2>
          <p className="text-xs text-gray-500">$1 = 10 $FAME tokens</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-yellow-400">{fameBalance.toLocaleString()}</span>
                <span className="text-2xl font-bold text-yellow-300">$FAME</span>
              </div>
              <p className="text-sm text-yellow-200/70">
                Equivalent to ${(fameBalance * PLATFORM_CONFIG.FAME_TO_USD).toFixed(2)} USD
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-yellow-400/20 pt-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">Earned</p>
                <p className="text-2xl font-bold text-emerald-400">{totalEarned.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Pending</p>
                <p className="text-2xl font-bold text-amber-400">{totalPending.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Available</p>
                <p className="text-2xl font-bold text-yellow-400">{fameBalance.toLocaleString()}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hold-to-Save Tier */}
      <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-white">Hold-to-Save Tier Status</h2>

        <div className="rounded-lg border border-amber-400/30 bg-amber-900/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Current Tier</p>
              <h3 className="text-2xl font-bold text-amber-300">{tierLabel}</h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Discount</p>
              <p className="text-4xl font-black text-amber-400">{holdToSaveTier}%</p>
            </div>
          </div>

          {currentTierIndex >= 0 && currentTierIndex < 4 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{fameBalance.toLocaleString()} tokens</span>
                <span>{nextThreshold.toLocaleString()} tokens</span>
              </div>
              <div className="h-2 rounded-full bg-gray-700/50 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500"
                  style={{ width: `${Math.min(100, (fameBalance / nextThreshold) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-amber-300 mt-2">
                {tokensToNextTier.toLocaleString()} tokens to next tier
              </p>
            </div>
          )}
        </div>

        {/* Tier Ladder */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { threshold: 10000, pct: 5, label: 'Silver ⭐' },
            { threshold: 25000, pct: 10, label: 'Gold ✨' },
            { threshold: 50000, pct: 15, label: 'Diamond 💎' },
            { threshold: 100000, pct: 20, label: 'Platinum 🌟' },
          ].map(({ threshold, pct, label }) => {
            const unlocked = fameBalance >= threshold;
            return (
              <div key={threshold} className={`rounded-lg border p-3 text-center ${unlocked ? 'border-amber-400/50 bg-amber-500/10' : 'border-gray-600 bg-gray-700/20'}`}>
                <p className="text-xs font-semibold text-gray-400">{label}</p>
                <p className={`text-xl font-bold my-1 ${unlocked ? 'text-amber-400' : 'text-gray-500'}`}>{pct}%</p>
                <p className="text-xs text-gray-500">{(threshold / 1000).toFixed(0)}K tokens</p>
                {unlocked && <p className="text-xs text-emerald-400 mt-1 font-semibold">✓ Active</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction History */}
      <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          <span className="flex items-center gap-2">
            <HiOutlineClock className="h-5 w-5 text-amber-400" />
            Token History
          </span>
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No token transactions yet. Start shopping to earn $FAME!</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg bg-gray-700/20 p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${tx.type === 'earned' ? 'bg-emerald-400' : tx.type === 'pending' ? 'bg-amber-400' : tx.type === 'spent' ? 'bg-gray-400' : 'bg-red-400'}`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-200 capitalize">{tx.type}</p>
                    {tx.order_id && <p className="text-xs text-gray-500 font-mono">{tx.order_id.slice(0, 13).toUpperCase()}</p>}
                    <p className="text-xs text-gray-500 mt-0.5">{tx.date}</p>
                  </div>
                </div>
                <p className={`text-lg font-bold ${tx.type === 'earned' ? 'text-emerald-400' : tx.type === 'pending' ? 'text-amber-400' : tx.type === 'spent' ? 'text-gray-400' : 'text-red-400'}`}>
                  {tx.type === 'spent' || tx.type === 'clawedback' ? '-' : '+'}{tx.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-900/20 p-6">
        <div className="flex items-start gap-3">
          <HiOutlineInformationCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-300 mb-2">How $FAME Tokens Work</h3>
            <ul className="space-y-1 text-sm text-blue-200/80">
              <li>• Earn 10 $FAME for every $1 spent</li>
              <li>• Tokens become available after the 14-day settlement window</li>
              <li>• Hold 10,000+ tokens to unlock your first 5% discount</li>
              <li>• 1 $FAME = $0.01 ecosystem credit value</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
