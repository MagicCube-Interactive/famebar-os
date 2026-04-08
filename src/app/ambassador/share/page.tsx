'use client';

import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import ShareCard from '@/components/ambassador/ShareCard';
import {
  Share2,
  Copy,
  MessageCircle,
  Send,
  Smartphone,
  BarChart3,
} from 'lucide-react';

interface ReferralCode {
  id: string;
  code: string;
  type: string;
  campaign_name: string | null;
  usage_count: number;
  is_active: boolean;
}

export default function ShareHubPage() {
  const { user, role } = useAuthContext();
  const [primaryCode, setPrimaryCode] = useState<string>('');
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [directOrdersCount, setDirectOrdersCount] = useState(0);
  const [conversionsThisMonth, setConversionsThisMonth] = useState(0);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || role !== 'ambassador') return;

    const fetchData = async () => {
      const supabase = createClient();

      const [profileResult, codesResult, ordersResult, monthOrdersResult] = await Promise.all([
        supabase
          .from('ambassador_profiles')
          .select('referral_code')
          .eq('id', user.id)
          .single(),

        supabase
          .from('referral_codes')
          .select('id, code, type, campaign_name, usage_count, is_active')
          .eq('ambassador_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),

        supabase
          .from('orders')
          .select('id', { count: 'exact' })
          .eq('ambassador_id', user.id),

        supabase
          .from('orders')
          .select('id', { count: 'exact' })
          .eq('ambassador_id', user.id)
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      ]);

      if (profileResult.data?.referral_code) {
        setPrimaryCode(profileResult.data.referral_code);
      }
      setReferralCodes(codesResult.data || []);
      setDirectOrdersCount(ordersResult.count || 0);
      setConversionsThisMonth(monthOrdersResult.count || 0);
      setLoading(false);
    };

    fetchData();
  }, [user, role]);

  if (!user || role !== 'ambassador') return null;

  const shortLink = primaryCode ? `fmbar.co/ref/${primaryCode.toLowerCase()}` : '';
  const campaignCodes = referralCodes.filter(c => c.type === 'campaign');
  const eventCodes = referralCodes.filter(c => c.type === 'event');
  const totalUsage = referralCodes.reduce((sum, c) => sum + (c.usage_count || 0), 0);

  const templates = [
    {
      id: 'telegram',
      channel: 'Telegram',
      icon: Send,
      template: `Hey! 👋 I joined FameBar as an ambassador and I'm loving it! Use my code ${primaryCode} to get connected. Let me know if you have questions! 🚀`,
    },
    {
      id: 'instagram',
      channel: 'Instagram DM',
      icon: MessageCircle,
      template: `Check out FameBar! 🌟 Amazing community, great commissions. Use my code: ${primaryCode}. DM me for details!`,
    },
    {
      id: 'tiktok',
      channel: 'TikTok Bio Link',
      icon: Share2,
      template: `Join my FameBar team! Code: ${primaryCode} | Link: ${shortLink} 💰✨`,
    },
    {
      id: 'sms',
      channel: 'SMS / Text',
      icon: Smartphone,
      template: `Hey! Join FameBar with my code ${primaryCode}. Earn commissions from your network. Learn more: ${shortLink}`,
    },
  ];

  const handleCopyTemplate = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(id);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Share Hub</h1>
        <p className="mt-2 text-gray-400">
          Your complete toolkit for sharing FameBar with your network
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-4">
          <p className="text-xs text-gray-500">Total Code Uses</p>
          <p className="mt-2 text-2xl font-bold text-amber-300">{totalUsage}</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-4">
          <p className="text-xs text-gray-500">Active Codes</p>
          <p className="mt-2 text-2xl font-bold text-blue-400">{referralCodes.length}</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-4">
          <p className="text-xs text-gray-500">Orders This Month</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">{conversionsThisMonth}</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-4">
          <p className="text-xs text-gray-500">Total Orders</p>
          <p className="mt-2 text-2xl font-bold text-purple-400">{directOrdersCount}</p>
        </div>
      </div>

      {/* Primary Code & Link */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ShareCard
          value={primaryCode}
          type="code"
          label="Your Primary Referral Code"
          usageCount={referralCodes.find(c => c.type === 'primary')?.usage_count || 0}
          description="Share this everywhere - it's your main earning code"
          onCopy={(code) => navigator.clipboard.writeText(code)}
        />

        <ShareCard
          value={shortLink}
          type="link"
          label="Short Link"
          usageCount={totalUsage}
          description="Perfect for bios, social media, and messages"
          onCopy={(link) => navigator.clipboard.writeText(link)}
        />
      </div>

      {/* Message Templates */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-100">
          Ready-Made Message Templates
        </h2>
        <div className="grid gap-4">
          {templates.map((template) => {
            const Icon = template.icon;
            const isCopied = copiedTemplate === template.id;

            return (
              <div
                key={template.id}
                className="rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-amber-400" />
                    <h3 className="font-semibold text-gray-100">{template.channel}</h3>
                  </div>
                  <button
                    onClick={() => handleCopyTemplate(template.id, template.template)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      isCopied
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600'
                    }`}
                  >
                    <Copy className="h-4 w-4" />
                    {isCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="rounded-lg bg-gray-900/50 p-4 font-mono text-sm text-gray-300 leading-relaxed break-words">
                  {template.template}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Campaign Codes */}
      {campaignCodes.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-100">Campaign Codes</h2>
          <div className="grid gap-3">
            {campaignCodes.map((campaign) => (
              <ShareCard
                key={campaign.id}
                value={campaign.code}
                type="code"
                label={campaign.campaign_name || campaign.code}
                usageCount={campaign.usage_count}
                onCopy={(code) => navigator.clipboard.writeText(code)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Event Codes */}
      {eventCodes.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-100">Event Codes</h2>
          <div className="grid gap-3">
            {eventCodes.map((ec) => (
              <ShareCard
                key={ec.id}
                value={ec.code}
                type="code"
                label={ec.campaign_name || ec.code}
                usageCount={ec.usage_count}
                onCopy={(code) => navigator.clipboard.writeText(code)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="rounded-lg border border-blue-500/30 bg-blue-950/20 p-6">
        <div className="flex items-start gap-4">
          <BarChart3 className="h-5 w-5 flex-shrink-0 text-blue-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-300">Sharing Tips</h3>
            <ul className="mt-3 space-y-2 text-sm text-blue-200">
              <li>✓ Share on Telegram for 3x higher engagement</li>
              <li>✓ Personal messages convert better than broadcasts</li>
              <li>✓ Share during evening hours (7-9 PM) for best results</li>
              <li>✓ Use campaign codes to track specific promotions</li>
              <li>✓ Include your personal story — people buy from people!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
