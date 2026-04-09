'use client';

import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { createSafeClient } from '@/lib/supabase/safe-client';
import {
  Share2,
  Copy,
  Send,
  Camera,
  Film,
  TrendingUp,
  TrendingDown,
  Lock,
  Download,
  Pencil,
  Link as LinkIcon,
  ShieldCheck,
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
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || role !== 'ambassador') return;

    const fetchData = async () => {
      const supabase = createClient();
      const safeSupa = createSafeClient();

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

        // Orders queries via safe client to bypass RLS
        safeSupa
          .from('orders')
          .select('id')
          .eq('ambassador_id', user.id),

        safeSupa
          .from('orders')
          .select('id')
          .eq('ambassador_id', user.id)
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      ]);

      if (profileResult.data?.referral_code) {
        setPrimaryCode(profileResult.data.referral_code);
      }
      setReferralCodes(codesResult.data || []);
      setDirectOrdersCount((ordersResult as any).count ?? (ordersResult.data || []).length);
      setConversionsThisMonth((monthOrdersResult as any).count ?? (monthOrdersResult.data || []).length);
      setLoading(false);
    };

    fetchData();
  }, [user, role]);

  if (!user || role !== 'ambassador') return null;

  const shortLink = primaryCode ? `fmbar.co/ref/${primaryCode.toLowerCase()}` : '';
  const totalUsage = referralCodes.reduce((sum, c) => sum + (c.usage_count || 0), 0);

  // Conversion rate
  const convRate = totalUsage > 0 ? ((conversionsThisMonth / totalUsage) * 100).toFixed(2) : '0.00';

  // Progress toward next tier (200 conversions for Platinum)
  const platinumTarget = 200;
  const progressPct = Math.min(100, Math.round((conversionsThisMonth / platinumTarget) * 100));

  const templates = [
    {
      id: 'telegram',
      channel: 'Telegram Broadcast',
      icon: Send,
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      template: `Hey team! Exclusive 25% off FameBar OS access via my private link. Use code ${primaryCode} at checkout. Limited spots available for the new intake.`,
    },
    {
      id: 'instagram',
      channel: 'Instagram Stories',
      icon: Camera,
      iconBg: 'bg-pink-500/20',
      iconColor: 'text-pink-400',
      template: `How I'm managing my field operations... Click the link in bio and use ${primaryCode} to get the OS I use daily.`,
    },
    {
      id: 'tiktok',
      channel: 'TikTok Hook',
      icon: Film,
      iconBg: 'bg-white/10',
      iconColor: 'text-on-surface',
      template: `POV: You found the secret tool used by the top 1% of field ambassadors. Link in bio + code ${primaryCode}. Don't sleep on this one.`,
    },
  ];

  const handleCopyTemplate = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(id);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(primaryCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shortLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header className="mb-4">
        <h2 className="text-4xl md:text-5xl font-bold text-on-surface tracking-tight mb-2">
          Share Hub
        </h2>
        <p className="text-on-surface-variant text-lg">
          Empower your network. Track your influence.
        </p>
      </header>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column 1: Identity & Access */}
        <section className="space-y-6">
          <div className="bg-surface-container-low rounded-xl p-8 shadow-[0_0_20px_rgba(245,158,11,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck className="w-20 h-20" />
            </div>
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6">
              Primary Referral
            </h3>
            <div className="space-y-6">
              {/* Referral Code */}
              <div>
                <label className="text-xs text-on-surface-variant mb-2 block">Referral Code</label>
                <div className="flex items-center justify-between bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/10">
                  <span className="font-mono text-2xl text-primary font-bold tracking-wider">
                    {primaryCode || '---'}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="text-on-surface-variant hover:text-primary transition-colors"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                {copiedCode && (
                  <p className="text-xs text-secondary mt-1">Copied!</p>
                )}
              </div>
              {/* Short Link */}
              <div>
                <label className="text-xs text-on-surface-variant mb-2 block">Short Link</label>
                <div className="flex items-center justify-between bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/10">
                  <span className="font-mono text-sm text-on-surface">
                    {shortLink || '---'}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="text-on-surface-variant hover:text-primary transition-colors"
                  >
                    <LinkIcon className="w-5 h-5" />
                  </button>
                </div>
                {copiedLink && (
                  <p className="text-xs text-secondary mt-1">Copied!</p>
                )}
              </div>
              {/* QR Code placeholder */}
              <div className="pt-4">
                <div className="bg-white p-4 rounded-xl inline-block">
                  <div className="w-32 h-32 bg-gray-200 flex items-center justify-center">
                    <span className="text-xs text-gray-500 text-center px-2">
                      QR Code
                    </span>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant mt-4">
                  Download high-res QR for offline sharing
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <h3 className="text-sm font-bold text-on-surface mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 py-3 bg-surface-container rounded-lg text-sm font-medium hover:bg-surface-container-high transition-colors text-on-surface">
                <Download className="w-4 h-4" /> Assets
              </button>
              <button className="flex items-center justify-center gap-2 py-3 bg-surface-container rounded-lg text-sm font-medium hover:bg-surface-container-high transition-colors text-on-surface">
                <Pencil className="w-4 h-4" /> Customize
              </button>
            </div>
          </div>
        </section>

        {/* Column 2: Content Templates */}
        <section className="space-y-6">
          <div className="bg-surface-container-low rounded-xl p-8 h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-semibold text-on-surface">Message Templates</h3>
              <span className="text-xs bg-secondary-container text-on-secondary-container px-2 py-1 rounded">
                {templates.length} NEW
              </span>
            </div>
            <div className="space-y-6">
              {templates.map((template) => {
                const Icon = template.icon;
                const isCopied = copiedTemplate === template.id;

                return (
                  <div key={template.id} className="group cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-full ${template.iconBg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${template.iconColor}`} />
                      </div>
                      <span className="text-sm font-bold text-on-surface">{template.channel}</span>
                    </div>
                    <div className="bg-surface-container p-4 rounded-lg group-hover:bg-surface-container-high transition-all border border-transparent group-hover:border-primary/20">
                      <p className="text-sm text-on-surface-variant leading-relaxed italic">
                        &ldquo;{template.template}&rdquo;
                      </p>
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => handleCopyTemplate(template.id, template.template)}
                          className="text-xs font-bold text-primary flex items-center gap-1 uppercase tracking-tight"
                        >
                          {isCopied ? 'Copied!' : 'Copy Template'}
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Column 3: Performance & Growth */}
        <section className="space-y-6">
          {/* Performance Stats */}
          <div className="bg-surface-container-low rounded-xl p-8">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest mb-8">
              Live Performance
            </h3>
            <div className="space-y-8">
              {/* Total Clicks */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-on-surface-variant mb-1">Total Clicks</p>
                  <p className="text-3xl font-bold text-on-surface font-mono">
                    {totalUsage.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-secondary text-xs font-bold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +12%
                  </span>
                  <p className="text-[10px] text-on-surface-variant">vs last 7 days</p>
                </div>
              </div>

              {/* Conversions */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-on-surface-variant mb-1">Conversions</p>
                  <p className="text-3xl font-bold text-on-surface font-mono">
                    {conversionsThisMonth.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-secondary text-xs font-bold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +5.2%
                  </span>
                  <p className="text-[10px] text-on-surface-variant">vs last 7 days</p>
                </div>
              </div>

              {/* Conv. Rate */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-on-surface-variant mb-1">Conv. Rate</p>
                  <p className="text-3xl font-bold text-primary font-mono">{convRate}%</p>
                </div>
                <div className="text-right">
                  <span className="text-error text-xs font-bold flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> -0.4%
                  </span>
                  <p className="text-[10px] text-on-surface-variant">vs last 7 days</p>
                </div>
              </div>
            </div>

            {/* Mini Chart (sparkline bars) */}
            <div className="mt-10 h-24 flex items-end gap-1">
              <div className="bg-primary/20 w-full h-[40%] rounded-t-sm" />
              <div className="bg-primary/20 w-full h-[60%] rounded-t-sm" />
              <div className="bg-primary/20 w-full h-[45%] rounded-t-sm" />
              <div className="bg-primary/20 w-full h-[80%] rounded-t-sm" />
              <div className="bg-primary w-full h-[95%] rounded-t-sm" />
              <div className="bg-primary/20 w-full h-[70%] rounded-t-sm" />
              <div className="bg-primary/20 w-full h-[60%] rounded-t-sm" />
            </div>
          </div>

          {/* Next Reward Tier */}
          <div className="rounded-xl p-8 relative overflow-hidden bg-gradient-to-br from-surface-container-highest to-surface-container border border-outline-variant/20">
            <div className="absolute inset-0 bg-surface-tint/5" />
            <h3 className="text-xs font-bold text-primary-fixed-dim uppercase tracking-widest mb-4 flex items-center gap-2 relative">
              <Lock className="w-4 h-4" /> Next Reward Tier
            </h3>
            <p className="text-xl font-bold text-on-surface mb-2 relative">Platinum Access</p>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed relative">
              Reach {platinumTarget} conversions to unlock custom vanity links and 30% base commission.
            </p>
            <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden relative">
              <div
                className="bg-primary h-full rounded-full shadow-[0_0_10px_rgba(255,193,116,0.5)]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 relative">
              <span className="text-[10px] font-mono text-on-surface-variant">
                {conversionsThisMonth}/{platinumTarget}
              </span>
              <span className="text-[10px] font-mono text-primary font-bold">
                {progressPct}% Complete
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom CTA Banner */}
      <section className="mt-4">
        <div className="bg-surface-container-low rounded-2xl overflow-hidden flex flex-col md:flex-row items-center">
          <div className="p-10 md:w-2/3">
            <span className="inline-block py-1 px-3 bg-secondary/10 text-secondary text-[10px] font-bold rounded-full mb-4">
              NEW ASSET PACK
            </span>
            <h2 className="text-3xl font-bold text-on-surface mb-4">Summer Campaign Kit</h2>
            <p className="text-on-surface-variant mb-8 max-w-md">
              Download our latest motion graphics and static overlays designed specifically for
              high-conversion Instagram Reels.
            </p>
            <button className="bg-gradient-to-r from-primary-container to-primary text-on-primary px-8 py-3 rounded-lg font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all">
              Browse Campaign Assets
            </button>
          </div>
          <div className="md:w-1/3 h-64 md:h-auto self-stretch bg-surface-container-high flex items-center justify-center">
            <Share2 className="w-16 h-16 text-primary/20" />
          </div>
        </div>
      </section>
    </div>
  );
}
