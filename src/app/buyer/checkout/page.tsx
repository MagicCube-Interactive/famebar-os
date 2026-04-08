'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  HiOutlineCheckCircle,
  HiOutlineUser,
  HiOutlineLocationMarker,
  HiOutlineCreditCard,
  HiOutlineExclamation,
} from 'react-icons/hi';
import { useAuthContext } from '@/context/AuthContext';
import type { BuyerProfile } from '@/types';

type CheckoutStep = 'age-verify' | 'shipping' | 'payment' | 'confirmation';

/**
 * CheckoutPage
 * Age-gated checkout flow with 4 steps:
 * 1. Age verification (21+ confirmation, DOB, ID upload)
 * 2. Shipping information
 * 3. Payment
 * 4. Order confirmation with attribution lock
 */
export default function CheckoutPage() {
  const { userProfile } = useAuthContext();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('age-verify');
  const [ageVerified, setAgeVerified] = useState(false);
  const [showBirthDateInput, setShowBirthDateInput] = useState(false);

  const buyerProfile = userProfile as BuyerProfile | null;

  // Form states
  const [formData, setFormData] = useState({
    birthDate: '',
    idType: 'drivers-license',
    idUpload: '',
    firstName: buyerProfile?.firstName || '',
    lastName: buyerProfile?.lastName || '',
    email: buyerProfile?.email || '',
    phone: buyerProfile?.phoneNumber || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    cardName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  // DOB split fields
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobYear, setDobYear] = useState('');

  const ambassadorInfo = {
    name: 'Alex Johnson',
    code: 'ALEX2024',
  };

  const orderSummary = {
    items: 3,
    subtotal: 75.0,
    discount: 0,
    total: 75.0,
  };

  const steps = [
    { id: 'age-verify', label: 'Age Verify', number: 1 },
    { id: 'shipping', label: 'Shipping', number: 2 },
    { id: 'payment', label: 'Payment', number: 3 },
    { id: 'confirmation', label: 'Confirm', number: 4 },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const canProceedToShipping = ageVerified;

  const canProceedToPayment =
    formData.firstName &&
    formData.lastName &&
    formData.address &&
    formData.city &&
    formData.state &&
    formData.zipCode;

  const canProceedToConfirmation =
    formData.cardName && formData.cardNumber && formData.expiryDate && formData.cvv;

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto px-6 py-12">
      {/* ── Stepper ── */}
      <div className="w-full mb-12">
        <div className="flex justify-between items-center relative">
          {/* connector line */}
          <div className="absolute top-5 left-0 w-full h-[2px] bg-surface-container -z-0" />

          {steps.map((step, index) => {
            const isActive = currentStepIndex === index;
            const isPast = currentStepIndex > index;

            return (
              <div key={step.id} className="flex flex-col items-center gap-2 z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    isActive
                      ? 'bg-primary-container text-on-primary shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                      : isPast
                        ? 'bg-primary-container text-on-primary'
                        : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {isPast ? <HiOutlineCheckCircle className="h-5 w-5" /> : step.number}
                </div>
                <span
                  className={`text-[10px] font-bold tracking-widest uppercase ${
                    isActive ? 'text-primary-container' : 'text-on-surface-variant'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════ STEP 1: Age Verification ═══════════ */}
      {currentStep === 'age-verify' && (
        <>
          {/* Hero headline */}
          <section className="text-center mb-10 w-full">
            <h1 className="text-3xl md:text-5xl font-extrabold text-on-surface tracking-tighter leading-tight mb-4">
              You must be{' '}
              <span className="bg-gradient-to-r from-primary-container to-primary bg-clip-text text-transparent">
                21+
              </span>{' '}
              to purchase
            </h1>
            <p className="text-on-surface-variant text-lg">
              Identity verification is required for high-performance compliance.
            </p>
          </section>

          <div className="w-full space-y-6">
            {/* Age confirmation checkbox */}
            <div className="p-8 rounded-xl bg-surface-container-low">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ageVerified}
                  onChange={(e) => {
                    setAgeVerified(e.target.checked);
                    if (!e.target.checked) setShowBirthDateInput(false);
                  }}
                  className="mt-1 h-5 w-5 rounded border-outline-variant/20 bg-surface-container-lowest text-primary-container focus:ring-primary/40"
                />
                <span className="text-base text-on-surface font-medium">
                  I confirm that I am 21 years of age or older
                </span>
              </label>
            </div>

            {ageVerified && (
              <>
                {/* DOB Input Group */}
                <div className="p-8 rounded-xl bg-surface-container-low flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <HiOutlineUser className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-on-surface">Date of Birth</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                        Month
                      </label>
                      <select
                        value={dobMonth}
                        onChange={(e) => setDobMonth(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-on-surface focus:ring-2 focus:ring-primary/40 py-4 px-4 font-mono"
                      >
                        <option value="">--</option>
                        {[
                          'January','February','March','April','May','June',
                          'July','August','September','October','November','December',
                        ].map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                        Day
                      </label>
                      <input
                        type="number"
                        placeholder="DD"
                        value={dobDay}
                        onChange={(e) => setDobDay(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-on-surface focus:ring-2 focus:ring-primary/40 py-4 px-4 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                        Year
                      </label>
                      <input
                        type="number"
                        placeholder="YYYY"
                        value={dobYear}
                        onChange={(e) => setDobYear(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-on-surface focus:ring-2 focus:ring-primary/40 py-4 px-4 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Government ID */}
                <div className="p-8 rounded-xl bg-surface-container-low flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <HiOutlineUser className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-on-surface">Government ID</h2>
                  </div>

                  {/* ID type selector tabs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, idType: 'drivers-license' }))
                      }
                      className={`flex items-center gap-3 p-4 rounded-lg text-left transition-all ${
                        formData.idType === 'drivers-license'
                          ? 'bg-surface-container border-2 border-primary/40'
                          : 'bg-surface-container-lowest border-2 border-transparent hover:border-outline-variant/30'
                      }`}
                    >
                      <HiOutlineUser
                        className={`h-5 w-5 ${
                          formData.idType === 'drivers-license'
                            ? 'text-primary'
                            : 'text-on-surface-variant'
                        }`}
                      />
                      <div>
                        <p
                          className={`font-bold text-sm ${
                            formData.idType === 'drivers-license'
                              ? 'text-on-surface'
                              : 'text-on-surface-variant'
                          }`}
                        >
                          Driver&apos;s License
                        </p>
                        <p className="text-[10px] text-on-surface-variant">Recommended</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, idType: 'passport' }))
                      }
                      className={`flex items-center gap-3 p-4 rounded-lg text-left transition-all ${
                        formData.idType === 'passport'
                          ? 'bg-surface-container border-2 border-primary/40'
                          : 'bg-surface-container-lowest border-2 border-transparent hover:border-outline-variant/30'
                      }`}
                    >
                      <HiOutlineUser
                        className={`h-5 w-5 ${
                          formData.idType === 'passport'
                            ? 'text-primary'
                            : 'text-on-surface-variant'
                        }`}
                      />
                      <div>
                        <p
                          className={`font-bold text-sm ${
                            formData.idType === 'passport'
                              ? 'text-on-surface'
                              : 'text-on-surface-variant'
                          }`}
                        >
                          Passport
                        </p>
                        <p className="text-[10px] text-on-surface-variant">International</p>
                      </div>
                    </button>
                  </div>

                  {/* Dashed upload area */}
                  <div className="border-2 border-dashed border-outline-variant/40 rounded-xl p-10 flex flex-col items-center justify-center gap-4 bg-surface-container-lowest/50 hover:bg-surface-container-lowest transition-colors cursor-pointer group">
                    <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center group-hover:scale-110 transition-transform">
                      <HiOutlineUser className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-on-surface">Click or drag ID photo here</p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        PNG, JPG or PDF up to 10MB
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* CTA + Legal */}
          <div className="w-full mt-10 space-y-8">
            <button
              onClick={() => setCurrentStep('shipping')}
              disabled={!canProceedToShipping}
              className="w-full py-5 rounded-lg bg-gradient-to-r from-primary-container to-primary text-on-primary font-extrabold text-lg tracking-tight shadow-[0_10px_30px_rgba(245,158,11,0.2)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.3)] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Continue to Shipping
            </button>

            {/* Legal disclaimer */}
            <div className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/10">
              <div className="flex gap-4">
                <HiOutlineExclamation className="h-5 w-5 text-on-surface-variant shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-on-surface-variant font-medium">
                  By proceeding, you certify that you are at least 21 years of age. FameBar OS uses
                  bank-grade encrypted verification protocols. Your ID data is processed securely and
                  is not stored permanently on our public servers. Falsifying age is a violation of
                  federal law and our Terms of Service.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════════ STEP 2: Shipping ═══════════ */}
      {currentStep === 'shipping' && (
        <>
          <section className="text-center mb-10 w-full">
            <h1 className="text-3xl md:text-5xl font-extrabold text-on-surface tracking-tighter leading-tight mb-4">
              Shipping Address
            </h1>
            <p className="text-on-surface-variant text-lg">
              Where should we deliver your order?
            </p>
          </section>

          <div className="w-full space-y-6">
            <div className="p-8 rounded-xl bg-surface-container-low flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-on-surface focus:ring-2 focus:ring-primary/40 py-4 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-on-surface focus:ring-2 focus:ring-primary/40 py-4 px-4"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-on-surface focus:ring-2 focus:ring-primary/40 py-4 px-4"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-on-surface focus:ring-2 focus:ring-primary/40 py-4 px-4"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-on-surface focus:ring-2 focus:ring-primary/40 py-4 px-4"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-on-surface focus:ring-2 focus:ring-primary/40 py-4 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-on-surface focus:ring-2 focus:ring-primary/40 py-4 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-on-surface focus:ring-2 focus:ring-primary/40 py-4 px-4"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="w-full mt-10 flex gap-4">
            <button
              onClick={() => setCurrentStep('age-verify')}
              className="flex-1 py-5 rounded-lg border border-outline-variant/20 bg-surface-container-lowest text-on-surface font-bold text-lg hover:bg-surface-container-low transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep('payment')}
              disabled={!canProceedToPayment}
              className="flex-1 py-5 rounded-lg bg-gradient-to-r from-primary-container to-primary text-on-primary font-extrabold text-lg tracking-tight shadow-[0_10px_30px_rgba(245,158,11,0.2)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.3)] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Continue to Payment
            </button>
          </div>
        </>
      )}

      {/* ═══════════ STEP 3: Payment ═══════════ */}
      {currentStep === 'payment' && (
        <>
          <section className="text-center mb-10 w-full">
            <h1 className="text-3xl md:text-5xl font-extrabold text-on-surface tracking-tighter leading-tight mb-4">
              Payment Method
            </h1>
            <p className="text-on-surface-variant text-lg">
              All transactions are SSL encrypted and PCI compliant.
            </p>
          </section>

          <div className="w-full space-y-6">
            <div className="p-8 rounded-xl bg-surface-container-low flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <HiOutlineCreditCard className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-on-surface">Card Details</h2>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  name="cardName"
                  value={formData.cardName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-on-surface focus:ring-2 focus:ring-primary/40 py-4 px-4"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                  Card Number
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="4532 1234 5678 9010"
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-on-surface focus:ring-2 focus:ring-primary/40 py-4 px-4 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-on-surface focus:ring-2 focus:ring-primary/40 py-4 px-4 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                    CVV
                  </label>
                  <input
                    type="text"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-on-surface focus:ring-2 focus:ring-primary/40 py-4 px-4 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Security notice */}
            <div className="p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/10">
              <div className="flex gap-4">
                <HiOutlineCheckCircle className="h-5 w-5 text-secondary shrink-0" />
                <p className="text-[11px] leading-relaxed text-on-surface-variant font-medium">
                  This checkout is SSL encrypted and PCI compliant. Your payment data is never stored
                  on our servers.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="w-full mt-10 flex gap-4">
            <button
              onClick={() => setCurrentStep('shipping')}
              className="flex-1 py-5 rounded-lg border border-outline-variant/20 bg-surface-container-lowest text-on-surface font-bold text-lg hover:bg-surface-container-low transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep('confirmation')}
              disabled={!canProceedToConfirmation}
              className="flex-1 py-5 rounded-lg bg-gradient-to-r from-primary-container to-primary text-on-primary font-extrabold text-lg tracking-tight shadow-[0_10px_30px_rgba(245,158,11,0.2)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.3)] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Review Order
            </button>
          </div>
        </>
      )}

      {/* ═══════════ STEP 4: Confirmation ═══════════ */}
      {currentStep === 'confirmation' && (
        <>
          <section className="text-center mb-10 w-full">
            <h1 className="text-3xl md:text-5xl font-extrabold text-on-surface tracking-tighter leading-tight mb-4">
              Confirm Your Order
            </h1>
            <p className="text-on-surface-variant text-lg">
              Review and finalize your purchase.
            </p>
          </section>

          <div className="w-full space-y-6">
            {/* Attribution lock */}
            <div className="p-8 rounded-xl bg-surface-container-low flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <HiOutlineCheckCircle className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-on-surface">
                  Order Attribution (Locked)
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant text-sm">Referred by:</span>
                  <span className="font-bold text-primary">{ambassadorInfo.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant text-sm">Code:</span>
                  <span className="font-mono font-bold text-primary bg-surface-container-lowest px-3 py-1 rounded-lg">
                    {ambassadorInfo.code}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-2">
                This attribution is locked and cannot be changed. Your purchase supports{' '}
                {ambassadorInfo.name}&apos;s business.
              </p>
            </div>

            {/* Order items */}
            <div className="p-8 rounded-xl bg-surface-container-low flex flex-col gap-4">
              <h3 className="font-semibold text-on-surface">
                Order Items ({orderSummary.items})
              </h3>
              <div className="rounded-lg bg-surface-container-lowest p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">3x Premium Products</span>
                  <span className="text-on-surface font-mono">
                    ${orderSummary.subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-outline-variant/10">
                <span className="text-on-surface font-bold">Total</span>
                <span className="text-2xl font-extrabold text-primary">
                  ${orderSummary.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Tokens earned */}
            <div className="p-6 rounded-xl bg-surface-container-lowest border border-primary/20">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-on-surface-variant mb-1">Tokens Earned</p>
                  <p className="text-2xl font-extrabold text-primary">
                    {Math.floor(orderSummary.total * 10)}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1 font-mono">$FAME tokens</p>
                </div>
              </div>
            </div>
          </div>

          {/* Complete purchase CTA */}
          <div className="w-full mt-10 space-y-8">
            <button
              onClick={() => setCurrentStep('age-verify')}
              className="w-full py-5 rounded-lg bg-gradient-to-r from-primary-container to-primary text-on-primary font-extrabold text-lg tracking-tight shadow-[0_10px_30px_rgba(245,158,11,0.2)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.3)] transition-all active:scale-[0.98]"
            >
              Complete Purchase
            </button>

            <p className="text-[11px] text-on-surface-variant text-center leading-relaxed">
              By placing this order, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </>
      )}

      {/* ── Branding footer ── */}
      <footer className="mt-16 flex flex-col items-center gap-4 opacity-40">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold tracking-[0.2em] text-on-surface">
            FAMEBAR OS
          </span>
          <span className="h-px w-8 bg-on-surface" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface">
            Vault Secure v2.4
          </span>
        </div>
      </footer>
    </div>
  );
}
