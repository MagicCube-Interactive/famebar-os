'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import DataTable, { Column } from '@/components/admin/DataTable';
import {
  X,
  Shield,
  ShieldCheck,
  Crown,
  UserCheck,
  UserX,
  CheckCircle2,
  Clock,
  Users,
  DollarSign,
  Loader2,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Ambassador {
  id: string;
  name: string;
  email: string;
  referral_code: string;
  tier: number;
  rank: string;
  is_active: boolean;
  total_recruits: number;
  total_sales: number;
  personal_sales_this_month: number;
  kyc_verified: boolean;
  is_founder: boolean;
  created_at: string;
}

const RANKS = ['new', 'starter', 'bronze', 'silver', 'gold', 'platinum', 'diamond'] as const;
const TIERS = [0, 1, 2, 3, 4, 5, 6] as const;

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'text-primary-container',
  border = 'border-outline-variant/10',
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: string;
  border?: string;
}) {
  return (
    <div className={`rounded-xl border ${border} bg-surface-container p-4 flex items-start gap-3`}>
      <div className={`mt-0.5 rounded-lg bg-surface-container-high p-2 ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-on-surface-variant">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${accent}`}>{value}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ambassador Detail / Edit Modal                                     */
/* ------------------------------------------------------------------ */

function AmbassadorModal({
  ambassador,
  onClose,
  onSaved,
}: {
  ambassador: Ambassador;
  onClose: () => void;
  onSaved: (updated: Ambassador) => void;
}) {
  const [tier, setTier] = useState(ambassador.tier);
  const [rank, setRank] = useState(ambassador.rank);
  const [isActive, setIsActive] = useState(ambassador.is_active);
  const [kycVerified, setKycVerified] = useState(ambassador.kyc_verified);
  const [isFounder, setIsFounder] = useState(ambassador.is_founder);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasChanges =
    tier !== ambassador.tier ||
    rank !== ambassador.rank ||
    isActive !== ambassador.is_active ||
    kycVerified !== ambassador.kyc_verified ||
    isFounder !== ambassador.is_founder;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('ambassador_profiles')
      .update({
        tier,
        rank,
        is_active: isActive,
        kyc_verified: kycVerified,
        is_founder: isFounder,
        ...(isFounder && !ambassador.is_founder ? { founder_start_date: new Date().toISOString() } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', ambassador.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    onSaved({
      ...ambassador,
      tier,
      rank,
      is_active: isActive,
      kyc_verified: kycVerified,
      is_founder: isFounder,
    });

    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-surface-container-high rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-on-surface">{ambassador.name}</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">{ambassador.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-highest transition-colors text-on-surface-variant"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Read-only info */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-surface-container rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider text-on-surface-variant">Referral Code</p>
            <p className="text-sm font-mono font-bold text-primary-container mt-1">{ambassador.referral_code}</p>
          </div>
          <div className="bg-surface-container rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider text-on-surface-variant">Joined</p>
            <p className="text-sm font-semibold text-on-surface mt-1">{ambassador.created_at}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-surface-container rounded-lg p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-on-surface-variant">Sales This Month</p>
            <p className="text-lg font-bold text-secondary mt-1">
              ${ambassador.personal_sales_this_month.toLocaleString()}
            </p>
          </div>
          <div className="bg-surface-container rounded-lg p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-on-surface-variant">Total Sales</p>
            <p className="text-lg font-bold text-secondary mt-1">
              ${ambassador.total_sales.toLocaleString()}
            </p>
          </div>
          <div className="bg-surface-container rounded-lg p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-on-surface-variant">Recruits</p>
            <p className="text-lg font-bold text-primary-container mt-1">{ambassador.total_recruits}</p>
          </div>
        </div>

        <hr className="border-outline-variant/10 mb-6" />

        {/* Editable fields */}
        <div className="space-y-4">
          {/* Tier */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Tier</label>
            <select
              value={tier}
              onChange={(e) => setTier(Number(e.target.value))}
              className="w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  Tier {t}
                </option>
              ))}
            </select>
          </div>

          {/* Rank */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Rank</label>
            <select
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              className="w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface capitalize focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {RANKS.map((r) => (
                <option key={r} value={r} className="capitalize">
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle: Active */}
          <ToggleRow
            label="Active Status"
            description="Ambassador can earn commissions and recruit"
            checked={isActive}
            onChange={setIsActive}
            activeColor="bg-secondary"
          />

          {/* Toggle: KYC */}
          <ToggleRow
            label="KYC Verified"
            description="Identity verification approved"
            checked={kycVerified}
            onChange={setKycVerified}
            activeColor="bg-secondary"
          />

          {/* Toggle: Founder */}
          <ToggleRow
            label="Founder Status"
            description="Receives 2x token multiplier"
            checked={isFounder}
            onChange={setIsFounder}
            activeColor="bg-primary"
          />
        </div>

        {/* Error / Success */}
        {error && (
          <div className="mt-4 rounded-lg bg-error/10 border border-error/20 px-4 py-2 text-sm text-error">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 rounded-lg bg-secondary/10 border border-secondary/20 px-4 py-2 text-sm text-secondary">
            Changes saved successfully.
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-container-highest text-on-surface-variant text-sm font-semibold hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="px-5 py-2 rounded-lg bg-primary-container text-on-primary text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all flex items-center gap-2"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toggle Row component                                               */
/* ------------------------------------------------------------------ */

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  activeColor = 'bg-secondary',
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  activeColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-semibold text-on-surface">{label}</p>
        <p className="text-xs text-on-surface-variant">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? activeColor : 'bg-surface-container'
        } border border-outline-variant/20`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
            checked ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bulk KYC Approval Modal                                            */
/* ------------------------------------------------------------------ */

function BulkKycModal({
  count,
  onConfirm,
  onClose,
  loading,
}: {
  count: number;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-surface-container-high rounded-xl p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full bg-secondary/20 p-2">
            <ShieldCheck className="h-5 w-5 text-secondary" />
          </div>
          <h3 className="text-lg font-bold text-on-surface">Bulk Approve KYC</h3>
        </div>
        <p className="text-sm text-on-surface-variant mb-6">
          You are about to mark <span className="font-bold text-on-surface">{count}</span> selected
          ambassador{count !== 1 ? 's' : ''} as KYC verified. This action cannot be easily undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-container-highest text-on-surface-variant text-sm font-semibold hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-secondary/90 text-white text-sm font-semibold hover:bg-secondary transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {loading ? 'Approving...' : 'Approve All'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function AmbassadorsPage() {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modal state
  const [selectedAmbassador, setSelectedAmbassador] = useState<Ambassador | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkKyc, setShowBulkKyc] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Inline toggle loading state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  /* ---------------------------------------------------------------- */
  /*  Fetch                                                            */
  /* ---------------------------------------------------------------- */

  const fetchAmbassadors = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('ambassador_profiles')
      .select(
        'id, referral_code, tier, rank, is_active, total_recruits, total_sales, personal_sales_this_month, kyc_verified, is_founder, created_at, profiles!ambassador_profiles_id_fkey(full_name, email)'
      )
      .order('total_sales', { ascending: false })
      .limit(500);

    setAmbassadors(
      (data || []).map((a: any) => ({
        id: a.id,
        name: a.profiles?.full_name || '--',
        email: a.profiles?.email || '--',
        referral_code: a.referral_code || '--',
        tier: a.tier ?? 0,
        rank: a.rank || 'new',
        is_active: a.is_active ?? false,
        total_recruits: a.total_recruits ?? 0,
        total_sales: Number(a.total_sales) || 0,
        personal_sales_this_month: Number(a.personal_sales_this_month) || 0,
        kyc_verified: a.kyc_verified ?? false,
        is_founder: a.is_founder ?? false,
        created_at: a.created_at?.split('T')[0] || '',
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAmbassadors();
  }, [fetchAmbassadors]);

  /* ---------------------------------------------------------------- */
  /*  Inline toggle active status                                      */
  /* ---------------------------------------------------------------- */

  const toggleActive = async (amb: Ambassador) => {
    setTogglingId(amb.id);
    const supabase = createClient();
    const newValue = !amb.is_active;

    const { error } = await supabase
      .from('ambassador_profiles')
      .update({ is_active: newValue, updated_at: new Date().toISOString() })
      .eq('id', amb.id);

    if (!error) {
      setAmbassadors((prev) =>
        prev.map((a) => (a.id === amb.id ? { ...a, is_active: newValue } : a))
      );
    }
    setTogglingId(null);
  };

  /* ---------------------------------------------------------------- */
  /*  Bulk KYC approve                                                 */
  /* ---------------------------------------------------------------- */

  const bulkApproveKyc = async () => {
    setBulkLoading(true);
    const supabase = createClient();
    const ids = Array.from(selectedIds);

    const { error } = await supabase
      .from('ambassador_profiles')
      .update({ kyc_verified: true, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (!error) {
      setAmbassadors((prev) =>
        prev.map((a) => (selectedIds.has(a.id) ? { ...a, kyc_verified: true } : a))
      );
      setSelectedIds(new Set());
    }
    setBulkLoading(false);
    setShowBulkKyc(false);
  };

  /* ---------------------------------------------------------------- */
  /*  Modal save handler                                               */
  /* ---------------------------------------------------------------- */

  const handleModalSaved = (updated: Ambassador) => {
    setAmbassadors((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Selection helpers                                                */
  /* ---------------------------------------------------------------- */

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((a) => a.id)));
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Filter + search                                                  */
  /* ---------------------------------------------------------------- */

  const filtered = ambassadors.filter((a) => {
    const matchFilter =
      filter === 'all' ||
      (filter === 'active' && a.is_active) ||
      (filter === 'inactive' && !a.is_active) ||
      (filter === 'founder' && a.is_founder) ||
      (filter === 'kyc' && !a.kyc_verified);
    const matchSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.referral_code.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  /* ---------------------------------------------------------------- */
  /*  Derived stats                                                    */
  /* ---------------------------------------------------------------- */

  const activeCount = ambassadors.filter((a) => a.is_active).length;
  const founderCount = ambassadors.filter((a) => a.is_founder).length;
  const kycPending = ambassadors.filter((a) => !a.kyc_verified).length;
  const totalSales = ambassadors.reduce((s, a) => s + a.total_sales, 0);

  // Count how many selected are not yet KYC verified (for bulk action)
  const selectedNonKyc = Array.from(selectedIds).filter(
    (id) => ambassadors.find((a) => a.id === id && !a.kyc_verified)
  ).length;

  /* ---------------------------------------------------------------- */
  /*  Table columns                                                    */
  /* ---------------------------------------------------------------- */

  const columns: Column<Ambassador>[] = [
    {
      key: 'id' as keyof Ambassador,
      label: '',
      width: '40px',
      render: (_v: any, row: Ambassador) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={(e) => {
            e.stopPropagation();
            toggleSelect(row.id);
          }}
          className="h-4 w-4 rounded border-outline-variant/20 bg-surface-container text-primary accent-primary cursor-pointer"
        />
      ),
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (v: any, row: Ambassador) => (
        <div>
          <span className="font-semibold text-on-surface">{String(v)}</span>
          {row.is_founder && (
            <Crown className="inline-block ml-1.5 h-3.5 w-3.5 text-primary-container" />
          )}
        </div>
      ),
    },
    { key: 'email', label: 'Email' },
    {
      key: 'tier',
      label: 'Tier',
      sortable: true,
      render: (v: any) => (
        <span className="font-bold text-primary-container">T{String(v)}</span>
      ),
    },
    {
      key: 'rank',
      label: 'Rank',
      sortable: true,
      render: (v: any) => (
        <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-xs font-semibold capitalize">
          {String(v)}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (_v: any, row: Ambassador) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleActive(row);
          }}
          disabled={togglingId === row.id}
          className="group flex items-center gap-1.5 transition-colors"
        >
          {togglingId === row.id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-on-surface-variant" />
          ) : row.is_active ? (
            <>
              <UserCheck className="h-3.5 w-3.5 text-secondary" />
              <span className="px-2 py-0.5 rounded-full bg-secondary/20 text-secondary text-xs font-semibold group-hover:bg-secondary/30 transition-colors">
                Active
              </span>
            </>
          ) : (
            <>
              <UserX className="h-3.5 w-3.5 text-on-surface-variant" />
              <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-xs font-semibold group-hover:bg-surface-container transition-colors">
                Inactive
              </span>
            </>
          )}
        </button>
      ),
    },
    {
      key: 'total_sales',
      label: 'Total Sales',
      sortable: true,
      render: (v: any) => (
        <span className="text-secondary font-semibold">${Number(v).toLocaleString()}</span>
      ),
    },
    {
      key: 'total_recruits',
      label: 'Recruits',
      sortable: true,
    },
    {
      key: 'kyc_verified',
      label: 'KYC',
      render: (v: any) =>
        v ? (
          <span className="flex items-center gap-1 text-secondary text-xs font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Verified
          </span>
        ) : (
          <span className="flex items-center gap-1 text-yellow-500 text-xs font-semibold">
            <Clock className="h-3.5 w-3.5" />
            Pending
          </span>
        ),
    },
    { key: 'created_at', label: 'Joined', sortable: true },
  ];

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Ambassadors</h1>
          <p className="mt-1 text-on-surface-variant">
            {ambassadors.length} ambassador{ambassadors.length !== 1 ? 's' : ''} on the platform
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Ambassadors" value={ambassadors.length} icon={Users} accent="text-primary-container" />
        <StatCard label="Active" value={activeCount} icon={UserCheck} accent="text-secondary" />
        <StatCard label="Founders" value={founderCount} icon={Crown} accent="text-primary-container" />
        <StatCard
          label="KYC Pending"
          value={kycPending}
          icon={Shield}
          accent="text-error"
          border="border-error/20"
        />
        <StatCard
          label="Total Sales Volume"
          value={`$${totalSales.toLocaleString()}`}
          icon={DollarSign}
          accent="text-secondary"
        />
      </div>

      {/* Search, filters, bulk actions */}
      <div className="flex gap-3 flex-wrap items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, or referral code..."
          className="flex-1 min-w-48 px-4 py-2 bg-surface-container border border-outline-variant/20 rounded-lg text-sm text-on-surface-variant placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'inactive', label: 'Inactive' },
            { key: 'founder', label: 'Founders' },
            { key: 'kyc', label: 'KYC Pending' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                filter === key
                  ? 'bg-primary-container text-on-primary'
                  : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 rounded-xl border border-outline-variant/10 bg-surface-container p-3">
          <span className="text-sm text-on-surface-variant">
            <span className="font-bold text-on-surface">{selectedIds.size}</span> selected
          </span>
          <div className="h-4 w-px bg-outline-variant/20" />
          <button
            onClick={() => setShowBulkKyc(true)}
            disabled={selectedNonKyc === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/20 text-secondary text-sm font-semibold hover:bg-secondary/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Approve KYC ({selectedNonKyc})
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          onRowClick={(row) => setSelectedAmbassador(row)}
          actions={[
            {
              label: 'Manage',
              onClick: (row) => setSelectedAmbassador(row),
              variant: 'primary',
            },
          ]}
          pageSize={15}
        />
      )}

      {/* Select all hint (below table) */}
      {!loading && filtered.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={toggleSelectAll}
            className="text-xs text-on-surface-variant hover:text-primary-container transition-colors"
          >
            {selectedIds.size === filtered.length ? 'Deselect all' : `Select all ${filtered.length}`}
          </button>
        </div>
      )}

      {/* Ambassador detail modal */}
      {selectedAmbassador && (
        <AmbassadorModal
          ambassador={selectedAmbassador}
          onClose={() => setSelectedAmbassador(null)}
          onSaved={(updated) => {
            handleModalSaved(updated);
            setSelectedAmbassador(updated);
          }}
        />
      )}

      {/* Bulk KYC confirmation modal */}
      {showBulkKyc && (
        <BulkKycModal
          count={selectedNonKyc}
          onConfirm={bulkApproveKyc}
          onClose={() => setShowBulkKyc(false)}
          loading={bulkLoading}
        />
      )}
    </div>
  );
}
