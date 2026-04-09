'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DollarSign, X, CheckCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import DataTable, { Column } from '@/components/admin/DataTable';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CommissionEntry {
  id: string;
  ambassador_name: string;
  order_id: string;
  amount: number;
  tier: number;
  status: string;
  created_at: string;
}

interface PayoutModalState {
  open: boolean;
  commissionIds: string[];
  ambassadorName: string;
  totalAmount: number;
}

// ============================================================================
// CASH LEDGER PAGE
// ============================================================================

export default function CashLedgerPage() {
  const [entries, setEntries] = useState<CommissionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Payout modal state
  const [payoutModal, setPayoutModal] = useState<PayoutModalState>({
    open: false,
    commissionIds: [],
    ambassadorName: '',
    totalAmount: 0,
  });
  const [payoutMethod, setPayoutMethod] = useState<'cash' | 'zelle' | 'venmo'>('cash');
  const [payoutReference, setPayoutReference] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState('');

  // ---- Fetch entries ----
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('commission_events')
      .select('id, order_id, amount, tier, status, created_at, ambassador_id, ambassador_profiles!commission_events_ambassador_id_fkey(id, profiles!ambassador_profiles_id_fkey(full_name))')
      .order('created_at', { ascending: false })
      .limit(200);

    setEntries(
      (data || []).map((e: any) => ({
        id: e.id,
        ambassador_name: e.ambassador_profiles?.profiles?.full_name || e.ambassador_id?.slice(0, 8) || '\u2014',
        order_id: e.order_id,
        amount: Number(e.amount),
        tier: e.tier,
        status: e.status,
        created_at: e.created_at?.split('T')[0] || '',
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const filtered = statusFilter === 'all' ? entries : entries.filter(e => e.status === statusFilter);

  const pendingTotal = entries.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
  const availableTotal = entries.filter(e => e.status === 'available').reduce((s, e) => s + e.amount, 0);
  const paidTotal = entries.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0);
  const clawedbackTotal = entries.filter(e => e.status === 'clawedback').reduce((s, e) => s + e.amount, 0);

  // ---- Selection handling ----
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

  const selectedAvailable = entries.filter(
    (e) => selectedIds.has(e.id) && e.status === 'available'
  );
  const selectedTotal = selectedAvailable.reduce((s, e) => s + e.amount, 0);

  // ---- Open single payout modal ----
  const openSinglePayout = (entry: CommissionEntry) => {
    setPayoutModal({
      open: true,
      commissionIds: [entry.id],
      ambassadorName: entry.ambassador_name,
      totalAmount: entry.amount,
    });
    setPayoutMethod('cash');
    setPayoutReference('');
    setPayoutError('');
  };

  // ---- Open batch payout modal ----
  const openBatchPayout = () => {
    if (selectedAvailable.length === 0) return;
    const names = [...new Set(selectedAvailable.map((e) => e.ambassador_name))];
    setPayoutModal({
      open: true,
      commissionIds: selectedAvailable.map((e) => e.id),
      ambassadorName: names.length <= 3 ? names.join(', ') : `${names.length} ambassadors`,
      totalAmount: selectedTotal,
    });
    setPayoutMethod('cash');
    setPayoutReference('');
    setPayoutError('');
  };

  // ---- Close modal ----
  const closeModal = () => {
    setPayoutModal({ open: false, commissionIds: [], ambassadorName: '', totalAmount: 0 });
    setPayoutError('');
  };

  // ---- Submit payout ----
  const handlePayout = async () => {
    if (!payoutReference.trim()) {
      setPayoutError('Payment reference is required');
      return;
    }

    setPayoutLoading(true);
    setPayoutError('');

    try {
      const res = await fetch('/api/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commissionIds: payoutModal.commissionIds,
          payoutMethod,
          paymentReference: payoutReference.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setPayoutError(data.error || 'Failed to process payout');
      } else {
        closeModal();
        setSelectedIds(new Set());
        await fetchEntries();
      }
    } catch {
      setPayoutError('Network error. Please try again.');
    } finally {
      setPayoutLoading(false);
    }
  };

  // ---- Table columns ----
  const columns: Column<CommissionEntry>[] = [
    {
      key: 'id',
      label: '',
      width: '40px',
      render: (_v, row) =>
        row.status === 'available' ? (
          <input
            type="checkbox"
            checked={selectedIds.has(row.id)}
            onChange={() => toggleSelect(row.id)}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-outline-variant/30 bg-surface-container-high accent-primary cursor-pointer"
          />
        ) : (
          <span />
        ),
    },
    { key: 'ambassador_name', label: 'Ambassador', sortable: true },
    { key: 'order_id', label: 'Order', render: (v) => <span className="font-mono text-xs text-gray-500">{String(v).slice(0, 13).toUpperCase()}</span> },
    { key: 'tier', label: 'Tier', render: (v) => <span className="text-primary-fixed-dim font-semibold">T{String(v)}</span> },
    { key: 'amount', label: 'Amount', sortable: true, render: (v) => <span className="text-secondary font-semibold">${Number(v).toFixed(2)}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (v) => {
        const colors: Record<string, string> = {
          pending: 'bg-primary-fixed-dim/20 text-primary-fixed-dim',
          available: 'bg-tertiary/20 text-tertiary',
          paid: 'bg-secondary/20 text-secondary',
          clawedback: 'bg-error/20 text-error',
        };
        return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${colors[String(v)] || 'bg-gray-500/20 text-on-surface-variant'}`}>{String(v)}</span>;
      },
    },
    { key: 'created_at', label: 'Date', sortable: true },
  ];

  const actions = [
    {
      label: 'Mark as Paid',
      onClick: (row: CommissionEntry) => {
        if (row.status === 'available') {
          openSinglePayout(row);
        }
      },
      variant: 'primary' as const,
    },
  ];

  // Only show the action column on rows that are available
  const filteredActions = filtered.some((e) => e.status === 'available') ? actions : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="h-8 w-8 text-secondary" />
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Cash Ledger</h1>
          <p className="text-gray-500">Commission events across all ambassadors</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-primary/20 bg-surface-container-low p-4">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-primary mt-1">${pendingTotal.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-tertiary/20 bg-surface-container-low p-4">
          <p className="text-xs text-gray-500">Available</p>
          <p className="text-2xl font-bold text-tertiary mt-1">${availableTotal.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-secondary/20 bg-surface-container-low p-4">
          <p className="text-xs text-gray-500">Paid Out</p>
          <p className="text-2xl font-bold text-secondary mt-1">${paidTotal.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-error/20 bg-surface-container-low p-4">
          <p className="text-xs text-gray-500">Clawed Back</p>
          <p className="text-2xl font-bold text-error mt-1">${clawedbackTotal.toFixed(2)}</p>
        </div>
      </div>

      {/* Filter tabs + batch payout button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          {['all', 'pending', 'available', 'paid', 'clawedback'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                statusFilter === s ? 'bg-primary-container text-on-primary' : 'bg-surface-container-highest text-gray-300 hover:bg-surface-container'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {selectedAvailable.length > 0 && (
          <button
            onClick={openBatchPayout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-container to-primary text-on-primary font-semibold text-sm transition-all hover:opacity-90"
          >
            <CheckCircle className="h-4 w-4" />
            Pay Selected ({selectedAvailable.length}) &mdash; ${selectedTotal.toFixed(2)}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          actions={filteredActions}
        />
      )}

      {/* ---- Payout Modal ---- */}
      {payoutModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-surface-container border border-outline-variant/20 p-6 space-y-5 shadow-2xl shadow-black/40">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface">Process Payout</h2>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg hover:bg-surface-container-high transition-colors text-gray-400 hover:text-on-surface"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-surface-container-low p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ambassador</span>
                <span className="text-on-surface font-medium">{payoutModal.ambassadorName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Commissions</span>
                <span className="text-on-surface font-medium">{payoutModal.commissionIds.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Total Amount</span>
                <span className="text-secondary font-bold text-lg">${payoutModal.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                Payment Method
              </label>
              <div className="flex gap-3">
                {(['cash', 'zelle', 'venmo'] as const).map((method) => (
                  <label
                    key={method}
                    className={`flex-1 flex items-center justify-center px-3 py-2.5 rounded-lg border cursor-pointer transition-all text-sm font-semibold capitalize ${
                      payoutMethod === method
                        ? 'bg-primary-container/20 border-primary-container text-on-surface'
                        : 'bg-surface-container-high border-outline-variant/20 text-gray-400 hover:text-on-surface-variant'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payoutMethod"
                      value={method}
                      checked={payoutMethod === method}
                      onChange={() => setPayoutMethod(method)}
                      className="sr-only"
                    />
                    {method}
                  </label>
                ))}
              </div>
            </div>

            {/* Payment Reference */}
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                Payment Reference / Confirmation #
              </label>
              <input
                type="text"
                value={payoutReference}
                onChange={(e) => setPayoutReference(e.target.value)}
                placeholder="e.g. Zelle confirmation #, cash receipt"
                className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface placeholder-gray-600 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
              />
            </div>

            {/* Error */}
            {payoutError && (
              <p className="text-sm text-error">{payoutError}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-3 rounded-lg border border-outline-variant/20 bg-surface-container-high text-on-surface-variant font-semibold text-sm hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePayout}
                disabled={payoutLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-primary-container to-primary text-on-primary font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {payoutLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Confirm Payout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
