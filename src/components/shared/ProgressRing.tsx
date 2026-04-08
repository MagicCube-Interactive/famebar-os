'use client';

import React from 'react';

interface ProgressRingProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Ring size in pixels (width/height) */
  size?: number;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Ring color (Tailwind or hex) */
  color?: 'emerald' | 'amber' | 'green' | 'blue' | 'purple' | string;
  /** Main label text */
  label?: string;
  /** Sublabel text (smaller, secondary) */
  sublabel?: string;
  /** Show percentage text */
  showPercentage?: boolean;
  /** Animated (smooth transition) */
  animated?: boolean;
}

/**
 * ProgressRing
 * Circular SVG progress indicator
 * Used for active requirements, tier progress, team goals, etc.
 * Supports customizable size, color, and labels
 */
export default function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = 'emerald',
  label,
  sublabel,
  showPercentage = true,
  animated = true,
}: ProgressRingProps) {
  // Clamp progress to 0-100
  const clampedProgress = Math.min(100, Math.max(0, progress));

  // Calculate SVG dimensions
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedProgress / 100) * circumference;

  // Color map
  const colorMap: Record<string, { gradient: string; text: string }> = {
    emerald: { gradient: 'from-emerald-400 to-green-500', text: 'text-emerald-400' },
    amber: { gradient: 'from-amber-400 to-yellow-400', text: 'text-amber-400' },
    green: { gradient: 'from-green-400 to-emerald-500', text: 'text-green-400' },
    blue: { gradient: 'from-blue-400 to-cyan-500', text: 'text-blue-400' },
    purple: { gradient: 'from-purple-400 to-pink-500', text: 'text-purple-400' },
  };

  const colorConfig = colorMap[color] || colorMap.emerald;

  return (
    <div className="flex flex-col items-center justify-center">
      {/* SVG Ring */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="drop-shadow-lg">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-700/50"
          />

          {/* Define gradient */}
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop
                offset="0%"
                stopColor={getGradientStartColor(color)}
                stopOpacity="1"
              />
              <stop
                offset="100%"
                stopColor={getGradientEndColor(color)}
                stopOpacity="1"
              />
            </linearGradient>
          </defs>

          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#gradient-${color})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={animated ? 'transition-all duration-500 ease-out' : ''}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: `${size / 2}px ${size / 2}px`,
            }}
          />

          {/* Glow effect on filled portion */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#gradient-${color})`}
            strokeWidth={strokeWidth * 2}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            opacity="0.2"
            filter="blur(2px)"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: `${size / 2}px ${size / 2}px`,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showPercentage && (
            <div className={`text-center`}>
              <div className={`text-2xl font-bold bg-gradient-to-r ${colorConfig.gradient} bg-clip-text text-transparent`}>
                {Math.round(clampedProgress)}%
              </div>
            </div>
          )}

          {label && (
            <div className={`text-xs font-semibold text-gray-300 ${showPercentage ? 'mt-1' : ''}`}>
              {label}
            </div>
          )}

          {sublabel && (
            <div className="text-xs text-gray-500 mt-0.5">
              {sublabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Helper to get gradient start color
 */
function getGradientStartColor(color: string): string {
  const colorMap: Record<string, string> = {
    emerald: '#10b981',
    amber: '#f59e0b',
    green: '#22c55e',
    blue: '#60a5fa',
    purple: '#a855f7',
  };
  return colorMap[color] || colorMap.emerald;
}

/**
 * Helper to get gradient end color
 */
function getGradientEndColor(color: string): string {
  const colorMap: Record<string, string> = {
    emerald: '#34d399',
    amber: '#fbbf24',
    green: '#84cc16',
    blue: '#06b6d4',
    purple: '#ec4899',
  };
  return colorMap[color] || colorMap.emerald;
}

/**
 * Demo/Example Usage Component
 */
export function ProgressRingDemo() {
  const [progress, setProgress] = React.useState(65);

  return (
    <div className="flex flex-col gap-8 p-8 bg-gray-900 rounded-lg">
      <h2 className="text-lg font-bold text-gray-100">Progress Ring Examples</h2>

      {/* Basic rings */}
      <div className="grid grid-cols-4 gap-8">
        <div className="flex flex-col items-center gap-4">
          <ProgressRing progress={75} color="emerald" label="Active" />
          <p className="text-xs text-gray-400">Active Requirement</p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <ProgressRing progress={45} color="amber" label="Tier Progress" />
          <p className="text-xs text-gray-400">Hold-to-Save</p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <ProgressRing progress={90} color="green" label="Team Goal" />
          <p className="text-xs text-gray-400">Sales Target</p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <ProgressRing progress={30} color="purple" label="Milestone" />
          <p className="text-xs text-gray-400">Recruits</p>
        </div>
      </div>

      {/* Interactive demo */}
      <div className="border border-gray-700 rounded-lg p-6">
        <label className="block text-sm font-semibold text-gray-300 mb-4">
          Adjust Progress: {progress}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="w-full"
        />
        <div className="mt-6 flex justify-center">
          <ProgressRing
            progress={progress}
            color="blue"
            label="Demo"
            sublabel="Interactive"
            animated
          />
        </div>
      </div>
    </div>
  );
}
