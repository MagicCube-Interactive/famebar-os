'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Package2, Receipt, WalletCards, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { createSafeClient } from '@/lib/supabase/safe-client';

type TabKey = 'approve' | 'sale' | 'remit' | 'wholesale';

interface UserRow {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  age_verified: boolean;
}

interface PackRow {
  id: string;
  ambassador_id: string;
  mode: 'consignment' | 'wholesale';
  status: string;
  outstanding_units: number;
  remittance_balance: number;
  units_sold: number;
  approved_at: string;
}

interface BuyerRequestRow {
  id: string;
  referred_by: string | null;
  total_orders: number;
  requested_ambassador_at: string | null;
  promoted_at: string | null;
  profiles?: {
    full_name: string | null;
    email: string;
    age_verified: boolean;
    role: string;
  };
}

const tabs: Array<{ key: TabKey; label: string; icon: React.ElementType }> = [
  { key: 'approve', label: 'Approve 50-Pack', icon: Package2 },
  { key: 'sale', label: 'Record Consignment Sale', icon: ShoppingBag },
  { key: 'remit', label: 'Record Remittance', icon: Receipt },
  { key: 'wholesale', label: 'Record Wholesale Pack', icon: WalletCards },
];

function getUserLabel(user: UserRow) {
  return user.full_name ? `${user.full_name} (${user.email})` : user.email;
}

export default function CommerceHubPage() {
  const safe = useMemo(() => createSafeClient(), []);
  const [tab, setTab] = useState<TabKey>('approve');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [packs, setPacks] = useState<PackRow[]>([]);
  const [buyerRequests, setBuyerRequests] = useState<BuyerRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [approvalUserId, setApprovalUserId] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  const [salePackId, setSalePackId] = useState('');
  const [saleBuyerId, setSaleBuyerId] = useState('');
  const [saleUnits, setSaleUnits] = useState(1);
  const [salePaymentMethod, setSalePaymentMethod] = useState<'cash' | 'zelle' | 'venmo'>('cash');
  const [saleAgeVerified, setSaleAgeVerified] = useState(false);
  const [saleCustomerName, setSaleCustomerName] = useState('');
  const [saleNotes, setSaleNotes] = useState('');

  const [remitPackId, setRemitPackId] = useState('');
  const [remitAmount, setRemitAmount] = useState('');
  const [remitMethod, setRemitMethod] = useState<'ach' | 'zelle' | 'wire'>('ach');
  const [remitReference, setRemitReference] = useState('');
  const [remitNotes, setRemitNotes] = useState('');

  const [wholesaleUserId, setWholesaleUserId] = useState('');
  const [wholesaleNotes, setWholesaleNotes] = useState('');

  const refreshData = useCallback(async () => {
    setLoading(true);
    const [userResult, packResult, buyerRequestResult] = await Promise.all([
      safe
        .from('profiles')
        .select('id, full_name, email, role, age_verified')
        .order('created_at', { ascending: false })
        .limit(500),
      safe
        .from('ambassador_packs')
        .select('id, ambassador_id, mode, status, outstanding_units, remittance_balance, units_sold, approved_at')
        .order('approved_at', { ascending: false })
        .limit(200),
      safe
        .from('buyer_profiles')
        .select('id, referred_by, total_orders, requested_ambassador_at, promoted_at, profiles!buyer_profiles_id_fkey(full_name, email, age_verified, role)')
        .order('requested_ambassador_at', { ascending: false })
        .limit(200),
    ]);

    setUsers((userResult.data || []) as UserRow[]);
    setPacks((packResult.data || []) as PackRow[]);
    setBuyerRequests((buyerRequestResult.data || []) as BuyerRequestRow[]);
    setLoading(false);
  }, [safe]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const buyers = users.filter((user) => user.role === 'buyer');
  const ambassadors = users.filter((user) => user.role === 'ambassador');
  const buyerAndAmbassadorPool = users.filter((user) => user.role === 'buyer' || user.role === 'ambassador');
  const usersById = new Map(users.map((user) => [user.id, user]));
  const pendingReviewBuyers = buyerRequests.filter(
    (buyer) => !!buyer.requested_ambassador_at && !buyer.promoted_at
  );

  const approvalPool = [...buyerAndAmbassadorPool].sort((left, right) => {
    const leftRequested = pendingReviewBuyers.some((buyer) => buyer.id === left.id);
    const rightRequested = pendingReviewBuyers.some((buyer) => buyer.id === right.id);
    if (leftRequested === rightRequested) return 0;
    return leftRequested ? -1 : 1;
  });

  const consignmentPacks = packs.filter((pack) => pack.mode === 'consignment');
  const openSalePacks = consignmentPacks.filter((pack) => pack.outstanding_units > 0);
  const remittancePacks = consignmentPacks.filter((pack) => Number(pack.remittance_balance || 0) > 0);

  const handleRequest = async (url: string, body: Record<string, any>, successMessage: string) => {
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Request failed');
      }
      setMessage(successMessage);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const stats = {
    buyersAwaitingReview: pendingReviewBuyers.length,
    ambassadors: ambassadors.length,
    openConsignment: openSalePacks.length,
    remittanceDue: remittancePacks.reduce((sum, pack) => sum + Number(pack.remittance_balance || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Commerce Hub</h1>
          <p className="mt-1 text-on-surface-variant">
            All buyer-to-ambassador triggers now live here: review buyer requests, approve 50-packs, record consignment activity, post remittances, and book wholesale pack purchases.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Buyer Reviews" value={stats.buyersAwaitingReview} />
        <StatCard label="Active Ambassadors" value={stats.ambassadors} />
        <StatCard label="Open Consignment Packs" value={stats.openConsignment} />
        <StatCard label="Remittance Due" value={`$${stats.remittanceDue.toFixed(2)}`} />
      </div>

      {message && (
        <div className="rounded-xl border border-secondary/20 bg-secondary/10 px-4 py-3 text-sm text-secondary">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 rounded-xl bg-surface-container p-2">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === key
                ? 'bg-primary-container text-on-primary'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary-container" />
            </div>
          ) : (
            <>
              {tab === 'approve' && (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRequest(
                      '/api/admin/approve-pack',
                      { userId: approvalUserId, notes: approvalNotes },
                      '50-pack approved and ambassador access updated.'
                    );
                  }}
                >
                  <SectionTitle
                    title="Approve Consignment 50-Pack"
                    description="This is the promotion trigger. Buyers are promoted to ambassador here and receive their primary referral code at approval time."
                  />
                  <SelectField
                    label="Buyer or Ambassador"
                    value={approvalUserId}
                    onChange={setApprovalUserId}
                    options={approvalPool.map((user) => {
                      const requestedBuyer = pendingReviewBuyers.find((buyer) => buyer.id === user.id);
                      return {
                        value: user.id,
                        label: `${getUserLabel(user)} · ${user.role}${requestedBuyer ? ' · review requested' : ''}${user.age_verified ? '' : ' · age verify needed'}`,
                      };
                    })}
                  />
                  {pendingReviewBuyers.length > 0 && (
                    <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                      {pendingReviewBuyers.length} buyer review request{pendingReviewBuyers.length === 1 ? '' : 's'} currently waiting for a 50-pack decision.
                    </p>
                  )}
                  <TextAreaField
                    label="Approval Notes"
                    value={approvalNotes}
                    onChange={setApprovalNotes}
                    placeholder="Approved for 50-unit consignment allocation."
                  />
                  <SubmitButton disabled={!approvalUserId || submitting} loading={submitting} label="Approve 50-Pack" />
                </form>
              )}

              {tab === 'sale' && (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRequest(
                      '/api/admin/record-consignment-sale',
                      {
                        packId: salePackId,
                        buyerId: saleBuyerId || null,
                        units: saleUnits,
                        paymentMethod: salePaymentMethod,
                        ageVerified: saleAgeVerified,
                        customerName: saleCustomerName,
                        notes: saleNotes,
                      },
                      'Consignment sale recorded and linked to the selected pack.'
                    );
                  }}
                >
                  <SectionTitle
                    title="Record Consignment Sale"
                    description="Each sale increases the ambassador's retained cash by $6.25 per unit and raises remittance due by $18.75 per unit."
                  />
                  <SelectField
                    label="Open Consignment Pack"
                    value={salePackId}
                    onChange={setSalePackId}
                    options={openSalePacks.map((pack) => {
                      const user = usersById.get(pack.ambassador_id);
                      return {
                        value: pack.id,
                        label: `${user ? getUserLabel(user) : pack.ambassador_id} · ${pack.outstanding_units} units left · ${pack.status}`,
                      };
                    })}
                  />
                  <SelectField
                    label="Buyer Account (optional)"
                    value={saleBuyerId}
                    onChange={setSaleBuyerId}
                    allowEmpty
                    options={buyers.map((user) => ({
                      value: user.id,
                      label: getUserLabel(user),
                    }))}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <NumberField label="Units" value={saleUnits} onChange={setSaleUnits} min={1} max={50} />
                    <SelectField
                      label="Payment Method"
                      value={salePaymentMethod}
                      onChange={(value) => setSalePaymentMethod(value as 'cash' | 'zelle' | 'venmo')}
                      options={[
                        { value: 'cash', label: 'Cash' },
                        { value: 'zelle', label: 'Zelle' },
                        { value: 'venmo', label: 'Venmo' },
                      ]}
                    />
                  </div>
                  <TextField
                    label="Customer Name (optional)"
                    value={saleCustomerName}
                    onChange={setSaleCustomerName}
                    placeholder="Party, event, or customer name"
                  />
                  <label className="flex items-start gap-3 rounded-lg border border-outline-variant/20 bg-surface-container-high px-4 py-3">
                    <input
                      type="checkbox"
                      checked={saleAgeVerified}
                      onChange={(e) => setSaleAgeVerified(e.target.checked)}
                      className="mt-1 h-4 w-4"
                    />
                    <span className="text-sm text-on-surface">
                      I confirm this sale was age-verified for 21+ compliance before it was recorded.
                    </span>
                  </label>
                  <TextAreaField
                    label="Sale Notes"
                    value={saleNotes}
                    onChange={setSaleNotes}
                    placeholder="Dorm activation, event sale, private order, etc."
                  />
                  <SubmitButton
                    disabled={!salePackId || !saleAgeVerified || submitting}
                    loading={submitting}
                    label="Record Sale"
                  />
                </form>
              )}

              {tab === 'remit' && (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRequest(
                      '/api/admin/record-remittance',
                      {
                        packId: remitPackId,
                        amount: remitAmount,
                        method: remitMethod,
                        reference: remitReference,
                        notes: remitNotes,
                      },
                      'Remittance posted against the selected pack.'
                    );
                  }}
                >
                  <SectionTitle
                    title="Record Remittance"
                    description="Use this whenever a consignment ambassador sends the treasury portion back for sold units."
                  />
                  <SelectField
                    label="Pack With Balance Due"
                    value={remitPackId}
                    onChange={setRemitPackId}
                    options={remittancePacks.map((pack) => {
                      const user = usersById.get(pack.ambassador_id);
                      return {
                        value: pack.id,
                        label: `${user ? getUserLabel(user) : pack.ambassador_id} · $${Number(pack.remittance_balance).toFixed(2)} due`,
                      };
                    })}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                      label="Amount"
                      value={remitAmount}
                      onChange={setRemitAmount}
                      placeholder="937.50"
                    />
                    <SelectField
                      label="Method"
                      value={remitMethod}
                      onChange={(value) => setRemitMethod(value as 'ach' | 'zelle' | 'wire')}
                      options={[
                        { value: 'ach', label: 'ACH' },
                        { value: 'zelle', label: 'Zelle' },
                        { value: 'wire', label: 'Wire' },
                      ]}
                    />
                  </div>
                  <TextField
                    label="Reference"
                    value={remitReference}
                    onChange={setRemitReference}
                    placeholder="ACH trace, Zelle note, wire reference"
                  />
                  <TextAreaField
                    label="Remittance Notes"
                    value={remitNotes}
                    onChange={setRemitNotes}
                    placeholder="Settlement for sold party inventory."
                  />
                  <SubmitButton disabled={!remitPackId || !remitAmount || submitting} loading={submitting} label="Post Remittance" />
                </form>
              )}

              {tab === 'wholesale' && (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRequest(
                      '/api/admin/record-wholesale-pack',
                      { userId: wholesaleUserId, notes: wholesaleNotes },
                      'Wholesale 50-pack purchase recorded and upline commissions triggered.'
                    );
                  }}
                >
                  <SectionTitle
                    title="Record Wholesale 50-Pack Purchase"
                    description="Books the $937.50 wholesale purchase, records the pack, and routes the $312.50 upline-only commission base without double-counting the ambassador's resale margin."
                  />
                  <SelectField
                    label="Buyer or Ambassador"
                    value={wholesaleUserId}
                    onChange={setWholesaleUserId}
                    options={buyerAndAmbassadorPool.map((user) => ({
                      value: user.id,
                      label: `${getUserLabel(user)} · ${user.role}`,
                    }))}
                  />
                  <TextAreaField
                    label="Wholesale Notes"
                    value={wholesaleNotes}
                    onChange={setWholesaleNotes}
                    placeholder="Wholesale 50-pack paid in full and released."
                  />
                  <SubmitButton disabled={!wholesaleUserId || submitting} loading={submitting} label="Record Wholesale Pack" />
                </form>
              )}
            </>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-outline-variant/10 bg-surface-container p-6">
            <SectionTitle
              title="Buyer Review Queue"
              description="Buyers who explicitly asked for ambassador review appear here first so admin approvals are operationally visible."
            />
            <div className="mt-4 space-y-3">
              {pendingReviewBuyers.length > 0 ? (
                pendingReviewBuyers.slice(0, 6).map((buyer) => {
                  const sponsor = buyer.referred_by ? usersById.get(buyer.referred_by) : null;
                  return (
                    <div key={buyer.id} className="rounded-xl bg-surface-container-high p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-on-surface">
                            {buyer.profiles?.full_name || buyer.profiles?.email || buyer.id}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-wider text-on-surface-variant">
                            {buyer.total_orders} retail order{buyer.total_orders === 1 ? '' : 's'} · {buyer.profiles?.age_verified ? 'age verified' : 'age verification needed'}
                          </p>
                          {sponsor && (
                            <p className="mt-2 text-xs text-on-surface-variant">
                              Sponsor: <span className="font-semibold text-on-surface">{getUserLabel(sponsor)}</span>
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setTab('approve');
                            setApprovalUserId(buyer.id);
                          }}
                          className="rounded-lg bg-primary-container px-3 py-2 text-xs font-semibold text-on-primary"
                        >
                          Load for Approval
                        </button>
                      </div>
                      <p className="mt-3 text-xs text-on-surface-variant">
                        Requested {new Date(buyer.requested_ambassador_at || '').toLocaleString()}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="rounded-xl bg-surface-container-high p-4 text-sm text-on-surface-variant">
                  No buyers are currently waiting for ambassador review.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-outline-variant/10 bg-surface-container p-6">
            <SectionTitle
              title="Recent Pack Activity"
              description="A quick operational snapshot so the next triggering event is always visible."
            />
            <div className="mt-4 space-y-3">
              {packs.slice(0, 8).map((pack) => {
                const user = usersById.get(pack.ambassador_id);
                return (
                  <div key={pack.id} className="rounded-xl bg-surface-container-high p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-on-surface">
                          {user ? getUserLabel(user) : pack.ambassador_id}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-wider text-on-surface-variant">
                          {pack.mode} · {pack.status}
                        </p>
                      </div>
                      <div className="text-right text-xs text-on-surface-variant">
                        <p>{new Date(pack.approved_at).toLocaleDateString()}</p>
                        {pack.mode === 'consignment' ? (
                          <p>${Number(pack.remittance_balance || 0).toFixed(2)} due</p>
                        ) : (
                          <p>{pack.outstanding_units} units in stock</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-on-surface-variant">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary-container" />
                      <span>{pack.outstanding_units} units remaining, {pack.units_sold} sold</span>
                    </div>
                  </div>
                );
              })}
              {packs.length === 0 && (
                <p className="rounded-xl bg-surface-container-high p-4 text-sm text-on-surface-variant">
                  No 50-pack activity yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container p-4">
      <p className="text-xs uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="mt-2 text-2xl font-bold text-on-surface">{value}</p>
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-on-surface">{title}</h2>
      <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  allowEmpty = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  allowEmpty?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-on-surface">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-4 py-3 text-on-surface"
      >
        <option value="">{allowEmpty ? 'Optional' : 'Select an option'}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-on-surface">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-4 py-3 text-on-surface"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-on-surface">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
        className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-4 py-3 text-on-surface"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-on-surface">{label}</span>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-4 py-3 text-on-surface"
      />
    </label>
  );
}

function SubmitButton({
  disabled,
  loading,
  label,
}: {
  disabled: boolean;
  loading: boolean;
  label: string;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-container to-primary px-5 py-3 text-sm font-semibold text-on-primary disabled:opacity-50"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {loading ? 'Processing...' : label}
    </button>
  );
}
