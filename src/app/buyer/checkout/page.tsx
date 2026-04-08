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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Secure Checkout</h1>
        <p className="text-gray-400">Complete your purchase safely and securely</p>
      </div>

      {/* Stepper */}
      <div className="grid grid-cols-4 gap-4">
        {steps.map((step, index) => {
          const isCurrentStep = currentStep === step.id;
          const isPastStep = steps.findIndex((s) => s.id === currentStep) > index;

          return (
            <div key={step.id} className="flex flex-col items-center">
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  isCurrentStep
                    ? 'bg-amber-500 text-white border-2 border-amber-400'
                    : isPastStep
                    ? 'bg-emerald-500 text-white border-2 border-emerald-400'
                    : 'bg-gray-700 text-gray-400 border-2 border-gray-600'
                }`}
              >
                {isPastStep ? <HiOutlineCheckCircle className="h-6 w-6" /> : step.number}
              </div>
              <p className={`mt-2 text-xs font-semibold ${isCurrentStep ? 'text-amber-400' : 'text-gray-400'}`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* STEP 1: Age Verification */}
          {currentStep === 'age-verify' && (
            <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-8 space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <HiOutlineUser className="h-6 w-6 text-amber-400" />
                Age Verification Required
              </h2>

              <p className="text-gray-400">
                You must be 21 or older to purchase products on FameBar. This is for your safety and
                compliance with applicable laws.
              </p>

              {/* Age Confirmation Checkbox */}
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ageVerified}
                    onChange={(e) => {
                      setAgeVerified(e.target.checked);
                      if (!e.target.checked) setShowBirthDateInput(false);
                    }}
                    className="mt-1 h-5 w-5 rounded border-gray-600 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-base text-gray-100">
                    I confirm that I am 21 years of age or older
                  </span>
                </label>
              </div>

              {/* Birth Date Input */}
              {ageVerified && (
                <div className="space-y-4 border-t border-gray-700/30 pt-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-3 text-gray-100 focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  {/* ID Type Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      ID Type
                    </label>
                    <select
                      name="idType"
                      value={formData.idType}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-3 text-gray-100 focus:outline-none focus:border-amber-400"
                    >
                      <option value="drivers-license">Driver's License</option>
                      <option value="passport">Passport</option>
                      <option value="state-id">State ID</option>
                    </select>
                  </div>

                  {/* ID Upload Placeholder */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Upload ID Photo
                    </label>
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-amber-400 transition-colors cursor-pointer bg-gray-800/30">
                      <p className="text-sm text-gray-400">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="rounded-lg border border-blue-500/30 bg-blue-950/20 p-4 flex gap-3">
                    <HiOutlineExclamation className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-300">
                      Your identity information is encrypted and processed securely in compliance with
                      privacy laws.
                    </p>
                  </div>
                </div>
              )}

              {/* Proceed Button */}
              <button
                onClick={() => setCurrentStep('shipping')}
                disabled={!canProceedToShipping}
                className="w-full rounded-lg bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 disabled:from-gray-700 disabled:to-gray-600 transition-all py-3 px-4 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Shipping
              </button>
            </div>
          )}

          {/* STEP 2: Shipping Information */}
          {currentStep === 'shipping' && (
            <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-8 space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <HiOutlineLocationMarker className="h-6 w-6 text-amber-400" />
                Shipping Address
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep('age-verify')}
                  className="flex-1 rounded-lg border border-gray-600 bg-gray-700/30 hover:bg-gray-700/50 transition-colors py-3 font-semibold text-gray-100"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep('payment')}
                  disabled={!canProceedToPayment}
                  className="flex-1 rounded-lg bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 disabled:from-gray-700 disabled:to-gray-600 transition-all py-3 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment Information */}
          {currentStep === 'payment' && (
            <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-8 space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <HiOutlineCreditCard className="h-6 w-6 text-amber-400" />
                Payment Method
              </h2>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  name="cardName"
                  value={formData.cardName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="4532 1234 5678 9010"
                  className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                    className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">CVV</label>
                  <input
                    type="text"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Security Notice */}
              <div className="rounded-lg border border-green-500/30 bg-green-950/20 p-4">
                <p className="text-sm text-green-300">
                  ✓ This checkout is SSL encrypted and PCI compliant
                </p>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep('shipping')}
                  className="flex-1 rounded-lg border border-gray-600 bg-gray-700/30 hover:bg-gray-700/50 transition-colors py-3 font-semibold text-gray-100"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep('confirmation')}
                  disabled={!canProceedToConfirmation}
                  className="flex-1 rounded-lg bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 disabled:from-gray-700 disabled:to-gray-600 transition-all py-3 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Review Order
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Order Confirmation */}
          {currentStep === 'confirmation' && (
            <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-8 space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <HiOutlineCheckCircle className="h-6 w-6 text-emerald-400" />
                Confirm Your Order
              </h2>

              {/* Attribution Lock */}
              <div className="rounded-lg border border-amber-400/30 bg-amber-900/20 p-6">
                <h3 className="font-semibold text-amber-300 mb-4">Order Attribution (Locked)</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Referred by:</span>
                    <span className="font-semibold text-amber-300">{ambassadorInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Code:</span>
                    <span className="font-mono font-semibold text-amber-300 bg-amber-950/50 px-3 py-1 rounded">
                      {ambassadorInfo.code}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-amber-200/70 mt-4">
                  This attribution is locked and cannot be changed. Your purchase supports{' '}
                  {ambassadorInfo.name}'s business.
                </p>
              </div>

              {/* Review Items */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-100">Order Items ({orderSummary.items})</h3>
                <div className="rounded-lg bg-gray-700/20 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">3x Premium Products</span>
                    <span className="text-gray-100">${orderSummary.subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Final CTA */}
              <button
                onClick={() => setCurrentStep('age-verify')} // Reset for demo
                className="w-full rounded-lg bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 transition-all py-4 px-6 text-lg font-bold text-white"
              >
                Complete Purchase
              </button>

              <p className="text-xs text-gray-500 text-center">
                By placing this order, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6 space-y-6 sticky top-24">
            <h3 className="text-lg font-semibold text-white">Order Summary</h3>

            {/* Items */}
            <div className="space-y-2 border-b border-gray-700/30 pb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Items ({orderSummary.items})</span>
                <span className="text-gray-100">${orderSummary.subtotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between">
              <span className="text-base font-semibold text-white">Total</span>
              <span className="text-2xl font-bold text-emerald-400">
                ${orderSummary.total.toFixed(2)}
              </span>
            </div>

            {/* Tokens */}
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4">
              <p className="text-xs text-gray-500 mb-1">Tokens Earned</p>
              <p className="text-2xl font-bold text-yellow-400">
                {Math.floor(orderSummary.total * 10)}
              </p>
              <p className="text-xs text-yellow-200/70 mt-1">$FAME tokens</p>
            </div>

            {/* Shipping Notice */}
            <div className="rounded-lg bg-blue-950/20 border border-blue-500/30 p-4">
              <p className="text-xs text-blue-300">
                <span className="font-semibold">Standard Shipping:</span> 5-7 business days
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
