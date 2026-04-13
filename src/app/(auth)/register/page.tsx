'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  signUpWithEmail,
  signOut,
  isValidEmail,
  validatePassword,
  passwordsMatch,
} from '@/lib/supabase/auth';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-secondary border-t-primary-container animate-spin" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading, role, user } = useAuth();

  const refFromUrl = searchParams.get('ref') || '';

  // Form state
  const [referralCode, setReferralCode] = useState(refFromUrl);
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [sponsorName, setSponsorName] = useState('');
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [telegramHandle, setTelegramHandle] = useState('');
  const [signalHandle, setSignalHandle] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // No blind redirect — handled by interstitial below

  // Validate referral code against Supabase
  const validateReferralCode = useCallback(async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setReferralValid(null);
      setSponsorName('');
      return;
    }

    try {
      setIsCheckingCode(true);

      const res = await fetch(`/api/sponsor-lookup?code=${encodeURIComponent(trimmed)}`);
      const data = await res.json().catch(() => ({ valid: false }));

      if (!res.ok || !data.valid) {
        setReferralValid(false);
        setSponsorName('');
        return;
      }

      setReferralValid(true);
      setSponsorName(data.sponsorName || '');
    } catch {
      setReferralValid(false);
      setSponsorName('');
    } finally {
      setIsCheckingCode(false);
    }
  }, []);

  // Auto-validate the code from URL on mount
  useEffect(() => {
    if (refFromUrl) {
      validateReferralCode(refFromUrl);
    }
  }, [refFromUrl, validateReferralCode]);

  // Validate code when user finishes typing (debounce on blur)
  const handleCodeBlur = () => {
    if (referralCode.trim() && referralCode !== refFromUrl) {
      validateReferralCode(referralCode);
    }
  };

  const validateForm = (): string | null => {
    if (!referralCode.trim()) {
      return 'A referral code is required to register. Ask your sponsor for an invite code.';
    }

    if (referralValid === false) {
      return 'Your referral code is invalid or expired. Please check with your sponsor.';
    }

    if (referralValid === null) {
      return 'Please wait for referral code validation to complete.';
    }

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return 'All fields are required';
    }

    if (!telegramHandle.trim()) {
      return 'Telegram username is required';
    }

    if (!signalHandle.trim()) {
      return 'Signal username is required';
    }

    if (!isValidEmail(email)) {
      return 'Please enter a valid email address';
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return passwordValidation.message || 'Password does not meet requirements';
    }

    if (!passwordsMatch(password, confirmPassword)) {
      return 'Passwords do not match';
    }

    if (!ageConfirmed) {
      return 'You must confirm that you are 21 or older';
    }

    if (!termsAccepted) {
      return 'You must accept the Terms of Service';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsLoading(true);

      // Double-check referral code validity server-side before signup
      const supabase = createClient();
      const { data: codeCheck, error: codeCheckError } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('code', referralCode.trim())
        .eq('is_active', true)
        .single();

      if (codeCheckError || !codeCheck) {
        setError('Referral code is no longer valid. Please contact your sponsor.');
        setIsLoading(false);
        return;
      }

      const user = await signUpWithEmail({
        email,
        password,
        firstName,
        lastName,
        referralCode: referralCode.trim(),
        telegramHandle: telegramHandle.trim().replace(/^@/, ''),
        signalHandle: signalHandle.trim().replace(/^@/, ''),
      });

      // Create ambassador_profiles + referral_codes for the new user
      if (user) {
        try {
          const setupRes = await fetch('/api/setup-ambassador', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              referralCode: referralCode.trim(),
              telegramHandle: telegramHandle.trim().replace(/^@/, ''),
              signalHandle: signalHandle.trim().replace(/^@/, ''),
            }),
          });

          if (!setupRes.ok) {
            console.error('Setup ambassador returned', setupRes.status);
            router.push('/ambassador?setup=incomplete');
            return;
          }
        } catch (setupErr) {
          console.error('Ambassador setup error:', setupErr);
          router.push('/ambassador?setup=incomplete');
          return;
        }
      }

      router.push('/ambassador');
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Failed to create account. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-secondary border-t-primary-container animate-spin mx-auto mb-4" />
          <p className="text-on-surface-variant">Loading...</p>
        </div>
      </div>
    );
  }

  // Already logged in — show interstitial instead of blind redirect
  if (isAuthenticated) {
    const dashboardPath = role === 'admin' ? '/admin' : '/ambassador';
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-container/5 rounded-full blur-3xl pointer-events-none" />
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <Link href="/">
              <h1 className="text-4xl font-black mb-2">
                <span className="text-on-surface">Fame</span>
                <span className="bg-gradient-to-r from-primary-container to-primary bg-clip-text text-transparent">Bar</span>
              </h1>
            </Link>
          </div>
          <div className="bg-surface-container rounded-xl p-8 border border-outline-variant/10 text-center">
            <h2 className="text-2xl font-bold text-on-surface mb-2">Already Signed In</h2>
            <p className="text-on-surface-variant text-sm mb-6">
              You are logged in as{' '}
              <span className="font-semibold text-on-surface">{user?.email}</span>
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push(dashboardPath)}
                className="w-full px-4 py-3 bg-gradient-to-r from-primary-container to-primary text-on-primary font-bold rounded-lg transition-all hover:opacity-90"
              >
                Go to Dashboard
              </button>
              <button
                onClick={async () => {
                  try { await signOut(); } catch (e) { console.error(e); }
                }}
                className="w-full px-4 py-3 border border-outline-variant/30 text-on-surface-variant rounded-lg hover:bg-surface-container-high transition-colors"
              >
                Sign out &amp; create new account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-container/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-4xl font-black mb-2">
              <span className="text-on-surface">Fame</span>
              <span className="bg-gradient-to-r from-primary-container to-primary bg-clip-text text-transparent">Bar</span>
            </h1>
          </Link>
          <p className="text-on-surface-variant text-sm">Become an Ambassador</p>
        </div>

        {/* Register Card */}
        <div className="bg-surface-container rounded-xl p-8 border border-outline-variant/10">
          <h2 className="text-2xl font-bold text-on-surface mb-6">Create Your Account</h2>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-error-container/20 border border-error/30 rounded-lg">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Referral Code — TOP of form, required */}
            <div>
              <label htmlFor="referralCode" className="block text-sm font-medium text-on-surface-variant mb-2">
                Invite Code <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  id="referralCode"
                  type="text"
                  value={referralCode}
                  onChange={(e) => {
                    setReferralCode(e.target.value);
                    setReferralValid(null);
                    setSponsorName('');
                  }}
                  onBlur={handleCodeBlur}
                  placeholder="Enter your invite code"
                  disabled={isLoading || !!refFromUrl}
                  readOnly={!!refFromUrl}
                  className={`w-full px-4 py-3 bg-surface-container-high border rounded-lg text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-70 transition font-mono tracking-wider ${
                    refFromUrl ? 'cursor-not-allowed' : ''
                  } ${
                    referralValid === true
                      ? 'border-secondary/50 focus:ring-secondary'
                      : referralValid === false
                      ? 'border-error/50 focus:ring-error'
                      : 'border-outline-variant/20 focus:ring-primary-container'
                  }`}
                />
                {/* Validation indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isCheckingCode && (
                    <div className="w-4 h-4 rounded-full border-2 border-primary-container border-t-transparent animate-spin" />
                  )}
                  {!isCheckingCode && referralValid === true && (
                    <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                  {!isCheckingCode && referralValid === false && (
                    <svg className="w-5 h-5 text-error" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Sponsor info */}
              {referralValid === true && sponsorName && (
                <p className="mt-2 text-sm text-secondary">
                  Invited by <span className="font-semibold">{sponsorName}</span>
                </p>
              )}
              {referralValid === false && (
                <p className="mt-2 text-sm text-error">
                  Invalid or expired code. Contact your sponsor for a valid invite.
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-outline-variant/15" />
              <span className="text-on-surface-variant/40 text-xs uppercase tracking-widest">Your Info</span>
              <div className="flex-1 h-px bg-outline-variant/15" />
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-on-surface-variant mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-surface-container-high border border-outline-variant/20 rounded-lg text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-on-surface-variant mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-surface-container-high border border-outline-variant/20 rounded-lg text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-on-surface-variant mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-surface-container-high border border-outline-variant/20 rounded-lg text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition"
              />
            </div>

            {/* Telegram & Signal Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="telegramHandle" className="block text-sm font-medium text-on-surface-variant mb-2">
                  Telegram <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-sm">@</span>
                  <input
                    id="telegramHandle"
                    type="text"
                    value={telegramHandle}
                    onChange={(e) => setTelegramHandle(e.target.value)}
                    placeholder="username"
                    disabled={isLoading}
                    className="w-full pl-8 pr-4 py-3 bg-surface-container-high border border-outline-variant/20 rounded-lg text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="signalHandle" className="block text-sm font-medium text-on-surface-variant mb-2">
                  Signal <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-sm">@</span>
                  <input
                    id="signalHandle"
                    type="text"
                    value={signalHandle}
                    onChange={(e) => setSignalHandle(e.target.value)}
                    placeholder="username"
                    disabled={isLoading}
                    className="w-full pl-8 pr-4 py-3 bg-surface-container-high border border-outline-variant/20 rounded-lg text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition"
                  />
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-on-surface-variant mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-surface-container-high border border-outline-variant/20 rounded-lg text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface disabled:opacity-50"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-on-surface-variant/60 mt-2">
                At least 8 characters with uppercase, lowercase, and numbers
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-on-surface-variant mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-surface-container-high border border-outline-variant/20 rounded-lg text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface disabled:opacity-50"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 py-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  disabled={isLoading}
                  className="mt-1 w-4 h-4 rounded border-outline-variant/30 bg-surface-container-high text-primary-container focus:ring-primary-container disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-on-surface-variant">
                  I confirm that I am 21 years of age or older
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  disabled={isLoading}
                  className="mt-1 w-4 h-4 rounded border-outline-variant/30 bg-surface-container-high text-primary-container focus:ring-primary-container disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-on-surface-variant">
                  I accept the{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-container hover:text-primary transition"
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-container hover:text-primary transition"
                  >
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || referralValid !== true}
              className="w-full mt-2 px-4 py-3.5 bg-gradient-to-r from-primary-container to-primary text-on-primary font-bold rounded-lg transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-container/20"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
                  Creating account...
                </>
              ) : (
                'Become an Ambassador'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-outline-variant/20" />
            <span className="text-on-surface-variant/50 text-sm">or</span>
            <div className="flex-1 h-px bg-outline-variant/20" />
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-on-surface-variant text-sm">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-primary-container hover:text-primary font-medium transition"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-on-surface-variant/40 text-xs">
          <p>FameClub &middot; Aureum Obsidian</p>
        </div>
      </div>
    </div>
  );
}
