'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface ShareCardProps {
  /** The code or link to display */
  value: string;
  /** Type of share (code, link, qr) */
  type: 'code' | 'link' | 'qr';
  /** Label for the card */
  label: string;
  /** Number of times used */
  usageCount?: number;
  /** Optional description */
  description?: string;
  /** Callback when copy is clicked */
  onCopy?: (value: string) => void;
}

/**
 * ShareCard
 * Reusable component for displaying shareable codes/links
 * with copy button and usage stats
 */
export default function ShareCard({
  value,
  type,
  label,
  usageCount,
  description,
  onCopy,
}: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    onCopy?.(value);

    // Reset copied state after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine formatting based on type
  const displayValue =
    type === 'link'
      ? value.replace(/^https?:\/\//, '')
      : type === 'code'
      ? value.toUpperCase()
      : value;

  const getTypeColor = () => {
    switch (type) {
      case 'code':
        return 'from-purple-500/10 to-pink-500/10 border-purple-500/30';
      case 'link':
        return 'from-cyan-500/10 to-cyan-500/10 border-cyan-500/30';
      case 'qr':
        return 'from-green-500/10 to-emerald-500/10 border-green-500/30';
      default:
        return 'from-gray-500/10 to-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <div className={`rounded-lg border bg-gradient-to-br p-4 ${getTypeColor()}`}>
      {/* Label */}
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>

      {/* Value Display */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1">
          {type === 'qr' ? (
            <div className="h-40 w-40 rounded-lg bg-white p-2">
              <div className="h-full w-full bg-gray-200 rounded flex items-center justify-center">
                <span className="text-xs text-gray-500">[QR Code]</span>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-gray-800/50 px-4 py-3">
              <p className="break-all font-mono text-sm font-semibold text-gray-100">
                {displayValue}
              </p>
            </div>
          )}
        </div>

        {/* Copy Button */}
        {type !== 'qr' && (
          <button
            onClick={handleCopy}
            className={`flex h-12 w-12 items-center justify-center rounded-lg border transition-all duration-200 ${
              copied
                ? 'border-emerald-500/50 bg-emerald-500/20'
                : 'border-gray-600 bg-gray-800/50 hover:bg-gray-700/50'
            }`}
          >
            {copied ? (
              <Check className="h-5 w-5 text-emerald-400" />
            ) : (
              <Copy className="h-5 w-5 text-gray-400" />
            )}
          </button>
        )}
      </div>

      {/* Description & Stats */}
      <div className="flex items-center justify-between">
        {description && (
          <p className="text-xs text-gray-400">{description}</p>
        )}
        {usageCount !== undefined && (
          <div className="text-xs text-gray-500">
            <span className="font-semibold text-fuchsia-300">{usageCount}</span> uses
          </div>
        )}
      </div>
    </div>
  );
}
