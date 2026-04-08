'use client';

import React, { useState } from 'react';
import { HiOutlineUser, HiOutlineCreditCard, HiOutlineShieldCheck, HiOutlineBell } from 'react-icons/hi';
import { useAuthContext } from '@/context/AuthContext';
import type { BuyerProfile } from '@/types';

/**
 * ProfilePage
 * User profile management page
 * Sections: Personal info, payment methods, verification status, preferences
 */
export default function ProfilePage() {
  const { userProfile } = useAuthContext();
  const buyerProfile = userProfile as BuyerProfile | null;

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: buyerProfile?.firstName || '',
    lastName: buyerProfile?.lastName || '',
    email: buyerProfile?.email || '',
    phone: buyerProfile?.phoneNumber || '',
    preferredContactMethod: 'email' as 'email' | 'phone' | 'sms',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // In production, save to backend
    setEditMode(false);
    console.log('Profile saved:', formData);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Your Profile</h1>
        <p className="text-gray-400">Manage your account settings and preferences</p>
      </div>

      {/* Personal Information */}
      <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
            <HiOutlineUser className="h-6 w-6 text-amber-400" />
            Personal Information
          </h2>
          <button
            onClick={() => setEditMode(!editMode)}
            className="rounded-lg border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20 transition-colors px-4 py-2 text-sm font-semibold text-amber-300"
          >
            {editMode ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editMode ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                className="flex-1 rounded-lg bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 transition-all py-2.5 font-semibold text-white"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-700/20 p-4 border border-gray-600">
                <p className="text-xs text-gray-500 mb-1">First Name</p>
                <p className="text-lg font-semibold text-gray-100">
                  {buyerProfile?.firstName}
                </p>
              </div>
              <div className="rounded-lg bg-gray-700/20 p-4 border border-gray-600">
                <p className="text-xs text-gray-500 mb-1">Last Name</p>
                <p className="text-lg font-semibold text-gray-100">
                  {buyerProfile?.lastName}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-gray-700/20 p-4 border border-gray-600">
              <p className="text-xs text-gray-500 mb-1">Email Address</p>
              <p className="text-lg font-semibold text-gray-100">
                {buyerProfile?.email}
              </p>
            </div>

            <div className="rounded-lg bg-gray-700/20 p-4 border border-gray-600">
              <p className="text-xs text-gray-500 mb-1">Phone Number</p>
              <p className="text-lg font-semibold text-gray-100">
                {buyerProfile?.phoneNumber || 'Not provided'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Verification Status */}
      <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-8">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-white mb-6">
          <HiOutlineShieldCheck className="h-6 w-6 text-emerald-400" />
          Account Verification
        </h2>

        <div className="space-y-4">
          {/* Age Verification */}
          <div className="rounded-lg border border-gray-600 bg-gray-700/20 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-100">Age Verification</h3>
              {buyerProfile?.ageVerified ? (
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <span>✓</span> Verified
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <span>⚠</span> Pending
                </div>
              )}
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {buyerProfile?.ageVerified
                ? `Verified on ${
                    buyerProfile?.ageVerificationDate
                      ? new Date(buyerProfile.ageVerificationDate).toLocaleDateString()
                      : 'Unknown date'
                  }`
                : 'Required to purchase. Verify during checkout.'}
            </p>
            {!buyerProfile?.ageVerified && (
              <button className="text-sm font-semibold text-amber-300 hover:text-amber-400">
                Complete verification →
              </button>
            )}
          </div>

          {/* Email Verification */}
          <div className="rounded-lg border border-gray-600 bg-gray-700/20 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-100">Email Address</h3>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <span>✓</span> Verified
              </div>
            </div>
            <p className="text-sm text-gray-400">{buyerProfile?.email}</p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-8">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-white mb-6">
          <HiOutlineCreditCard className="h-6 w-6 text-amber-400" />
          Payment Methods
        </h2>

        <p className="text-gray-400 mb-4">No saved payment methods yet</p>

        <button className="rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 transition-all px-6 py-2.5 font-semibold text-white text-sm">
          Add Payment Method
        </button>
      </div>

      {/* Preferences */}
      <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-8">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-white mb-6">
          <HiOutlineBell className="h-6 w-6 text-amber-400" />
          Notification Preferences
        </h2>

        <div className="space-y-4">
          {[
            {
              label: 'Order Updates',
              description: 'Get notified about order status changes',
            },
            {
              label: 'Product Launches',
              description: 'Be the first to know about new products',
            },
            {
              label: 'Special Offers',
              description: 'Receive exclusive deals and discounts',
            },
            {
              label: 'Ambassador Events',
              description: 'Learn about upcoming events and meetups',
            },
          ].map((pref) => (
            <div
              key={pref.label}
              className="flex items-center justify-between rounded-lg border border-gray-600 bg-gray-700/20 p-4"
            >
              <div>
                <p className="font-semibold text-gray-100">{pref.label}</p>
                <p className="text-xs text-gray-500">{pref.description}</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 rounded border-gray-600 text-amber-500 focus:ring-amber-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Account Actions */}
      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-8">
        <h2 className="text-2xl font-bold text-red-300 mb-6">Account Actions</h2>

        <div className="space-y-3">
          <button className="w-full rounded-lg border border-gray-600 bg-gray-700/30 hover:bg-gray-700/50 transition-colors py-2.5 px-4 text-sm font-semibold text-gray-100">
            Change Password
          </button>
          <button className="w-full rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-colors py-2.5 px-4 text-sm font-semibold text-red-400">
            Delete Account
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Deleting your account is permanent and cannot be undone. All your data will be removed.
        </p>
      </div>
    </div>
  );
}
