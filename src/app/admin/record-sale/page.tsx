'use client';

import React, { useState, useCallback } from 'react';
import { PlusCircle, CheckCircle, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type PaymentMethod = 'cash' | 'zelle' | 'venmo';

interface AmbassadorInfo {
  id: string;
  name: string;
  code: string;
}

interface SaleResult {
  orderId: string;
  total: number;
  commissionsCreated: number;
  tokensAwarded: number;
}

// ============================================================================
// RECORD SALE PAGE
// ============================================================================

export default function RecordSalePage() {
  // Form state
  const [ambassadorCode, setAmbassadorCode] = useState('');
  const [ambassadorInfo, setAmbassadorInfo] = useState<AmbassadorInfo | null>(null);
  const [codeError, setCodeError] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [units, setUnits] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState<SaleResult | null>(null);

  // ---- Ambassador code validation ----
  const validateCode = useCallback(async (code: string) => {
    if (!code.trim()) {
      setAmbassadorInfo(null);
      setCodeError('');
      return;
    }

    setCodeLoading(true);
    setCodeError('');
    setAmbassadorInfo(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('referral_codes')
        .select('id, code, ambassador_id, ambassador_profiles!referral_codes_ambassador_id_fkey(id, profiles!ambassador_profiles_id_fkey(full_name))')
        .eq('code', code.toUpperCase())
        .single();

      if (error || !data) {
        setCodeError('Ambassador code not found');
      } else {
        const profile = (data as any).ambassador_profiles;
        const name = profile?.profiles?.full_name || 'Ambassador';
        setAmbassadorInfo({
          id: data.ambassador_id,
          name,
          code: data.code,
        });
      }
    } catch {
      setCodeError('Failed to validate code');
    } finally {
      setCodeLoading(false);
    }
  }, []);

  // ---- Submit sale ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ambassadorInfo) {
      setCodeError('Please enter a valid ambassador code');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/record-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ambassadorCode: ambassadorCode.toUpperCase(),
          units,
          paymentMethod,
          customerName: customerName || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setSubmitError(data.error || 'Failed to record sale');
      } else {
        setResult({
          orderId: data.orderId,
          total: data.total,
          commissionsCreated: data.commissionsCreated,
          tokensAwarded: data.tokensAwarded,
        });
      }
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Reset form ----
  const resetForm = () => {
    setAmbassadorCode('');
    setAmbassadorInfo(null);
    setCodeError('');
    setUnits(1);
    setPaymentMethod('cash');
    setCustomerName('');
    setNotes('');
    setSubmitError('');
    setResult(null);
  };

  // ---- Calculations ----
  const total = units * 25;
  const directCommission = units * 6.25;
  const tokensEstimate = units; // 1 token per unit baseline

  // ---- Success State ----
  if (result) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-secondary" />
          <div>
            <h1 className="text-3xl font-bold text-on-surface">Sale Recorded</h1>
            <p className="text-gray-500">Order has been created and commissions triggered</p>
          </div>
        </div>

        <div className="rounded-xl bg-secondary/10 border border-secondary/30 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Order ID</p>
              <p className="font-mono text-sm text-on-surface mt-1">{result.orderId.slice(0, 13).toUpperCase()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-secondary mt-1">${result.total.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Commissions Created</p>
              <p className="text-lg font-semibold text-on-surface mt-1">{result.commissionsCreated}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Tokens Awarded</p>
              <p className="text-lg font-semibold text-on-surface mt-1">{result.tokensAwarded}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-secondary/20">
            <p className="text-xs text-gray-500">Ambassador: {ambassadorInfo?.name} ({ambassadorCode.toUpperCase()})</p>
            <p className="text-xs text-gray-500">Payment: {paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}</p>
            {customerName && <p className="text-xs text-gray-500">Customer: {customerName}</p>}
          </div>
        </div>

        <button
          onClick={resetForm}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-primary-container to-primary text-on-primary font-semibold transition-all hover:opacity-90"
        >
          <RotateCcw className="h-4 w-4" />
          Record Another Sale
        </button>
      </div>
    );
  }

  // ---- Form State ----
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <PlusCircle className="h-8 w-8 text-primary-container" />
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Record Sale</h1>
          <p className="text-gray-500">Manually record a cash, Zelle, or Venmo sale</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ambassador Code */}
        <div className="rounded-xl bg-surface-container border border-outline-variant/20 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Ambassador</h2>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">
              Ambassador Code <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={ambassadorCode}
              onChange={(e) => setAmbassadorCode(e.target.value.toUpperCase())}
              onBlur={() => validateCode(ambassadorCode)}
              placeholder="e.g. FAME-JOHN"
              className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface placeholder-gray-600 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 uppercase"
            />
            {codeLoading && (
              <div className="flex items-center gap-2 mt-2 text-gray-500 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Validating...
              </div>
            )}
            {codeError && (
              <div className="flex items-center gap-2 mt-2 text-error text-sm">
                <AlertCircle className="h-4 w-4" />
                {codeError}
              </div>
            )}
            {ambassadorInfo && (
              <div className="flex items-center gap-2 mt-2 text-secondary text-sm">
                <CheckCircle className="h-4 w-4" />
                {ambassadorInfo.name}
              </div>
            )}
          </div>
        </div>

        {/* Sale Details */}
        <div className="rounded-xl bg-surface-container border border-outline-variant/20 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Sale Details</h2>

          {/* Units */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">
              Units <span className="text-error">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={units}
              onChange={(e) => setUnits(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <p className="text-xs text-gray-500 mt-1">$25 per unit</p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">
              Payment Method <span className="text-error">*</span>
            </label>
            <div className="flex gap-3">
              {(['cash', 'zelle', 'venmo'] as PaymentMethod[]).map((method) => (
                <label
                  key={method}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                    paymentMethod === method
                      ? 'bg-primary-container/20 border-primary-container text-on-surface'
                      : 'bg-surface-container-high border-outline-variant/20 text-gray-400 hover:text-on-surface-variant'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold capitalize">{method}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">
              Customer Name <span className="text-gray-500 text-xs">(optional)</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name"
              className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface placeholder-gray-600 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">
              Notes <span className="text-gray-500 text-xs">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
              className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface placeholder-gray-600 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
          </div>
        </div>

        {/* Live Calculation Panel */}
        <div className="rounded-xl bg-surface-container border border-outline-variant/20 p-6 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Sale Summary</h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-surface-container-low p-4 text-center">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-2xl font-bold text-on-surface mt-1">
                ${total.toFixed(2)}
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5">{units} x $25</p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-4 text-center">
              <p className="text-xs text-gray-500">Direct Commission</p>
              <p className="text-2xl font-bold text-secondary mt-1">
                ${directCommission.toFixed(2)}
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5">{units} x $6.25</p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-4 text-center">
              <p className="text-xs text-gray-500">Tokens Earned</p>
              <p className="text-2xl font-bold text-primary-fixed-dim mt-1">
                ~{tokensEstimate}
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5">estimated</p>
            </div>
          </div>
        </div>

        {/* Error */}
        {submitError && (
          <div className="rounded-lg bg-error/10 border border-error/30 p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-error flex-shrink-0" />
            <p className="text-sm text-error">{submitError}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !ambassadorInfo}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg bg-gradient-to-r from-primary-container to-primary text-on-primary font-bold text-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Recording...
            </>
          ) : (
            <>
              <PlusCircle className="h-5 w-5" />
              Record Sale
            </>
          )}
        </button>
      </form>
    </div>
  );
}
