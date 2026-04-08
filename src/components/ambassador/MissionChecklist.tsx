'use client';

import React, { useState, useEffect } from 'react';
import { Check, Target } from 'lucide-react';

interface Mission {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  order: number;
}

interface MissionChecklistProps {
  /** List of missions to display */
  missions: Mission[];
  /** Callback when all missions are completed */
  onAllComplete?: () => void;
}

/**
 * MissionChecklist
 * Gamified mission checklist with completion states
 * Shows confetti/celebration when all missions completed
 */
export default function MissionChecklist({
  missions,
  onAllComplete,
}: MissionChecklistProps) {
  const [displayMissions, setDisplayMissions] = useState<Mission[]>(missions);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    setDisplayMissions(missions);

    // Check if all missions are complete
    const allComplete = missions.every(m => m.completed);
    if (allComplete && missions.length > 0) {
      setShowCelebration(true);
      onAllComplete?.();

      // Reset celebration after animation
      setTimeout(() => setShowCelebration(false), 3000);
    }
  }, [missions, onAllComplete]);

  const completedCount = displayMissions.filter(m => m.completed).length;
  const totalCount = displayMissions.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="relative space-y-4">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <div className="animate-bounce rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 px-8 py-6 text-center shadow-2xl">
            <p className="text-2xl font-bold text-gray-900">All Missions Complete!</p>
            <p className="mt-2 text-sm font-semibold text-gray-800">Great job ambassador!</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-100">
            <Target className="h-5 w-5 text-amber-400" />
            Starter Missions
          </h3>
          <div className="text-xs font-semibold text-amber-300">
            {completedCount}/{totalCount}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-gray-700/50">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">
            {completedCount === totalCount
              ? 'All missions unlocked!'
              : `${totalCount - completedCount} remaining`}
          </p>
        </div>
      </div>

      {/* Missions List */}
      <div className="space-y-3">
        {displayMissions
          .sort((a, b) => a.order - b.order)
          .map((mission, index) => (
            <div
              key={mission.id}
              className={`relative overflow-hidden rounded-lg border transition-all duration-300 ${
                mission.completed
                  ? 'border-emerald-500/30 bg-emerald-950/20'
                  : 'border-gray-700/50 bg-gradient-to-br from-gray-800/30 to-gray-900/20'
              }`}
            >
              {/* Gradient accent for completed */}
              {mission.completed && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-green-500" />
              )}

              <div className="flex items-start gap-4 p-4">
                {/* Checkbox */}
                <div
                  className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    mission.completed
                      ? 'border-emerald-400 bg-emerald-500/20'
                      : 'border-gray-600 bg-gray-800/30'
                  }`}
                >
                  {mission.completed && (
                    <Check className="h-4 w-4 text-emerald-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h4
                    className={`text-sm font-semibold transition-all duration-300 ${
                      mission.completed
                        ? 'text-gray-400 line-through'
                        : 'text-gray-100'
                    }`}
                  >
                    {mission.title}
                  </h4>
                  <p className="mt-1 text-xs text-gray-500">
                    {mission.description}
                  </p>
                </div>

                {/* Step Number */}
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all duration-300 ${
                    mission.completed
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-gray-700/50 text-gray-400'
                  }`}
                >
                  {index + 1}
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Reward Preview */}
      {completedCount > 0 && completedCount < totalCount && (
        <div className="rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-900/20 to-yellow-900/20 p-4">
          <p className="text-xs text-gray-400">
            <span className="font-semibold text-amber-300">Unlock bonus:</span> Complete all
            missions to earn your Founder Badge and exclusive rewards!
          </p>
        </div>
      )}

      {/* All Complete Message */}
      {completedCount === totalCount && totalCount > 0 && (
        <div className="rounded-lg border border-emerald-500/30 bg-gradient-to-r from-emerald-900/20 to-green-900/20 p-4">
          <p className="text-xs text-emerald-300">
            <span className="font-semibold">Achievement Unlocked!</span> You've completed all starter
            missions. Welcome to the Ambassador program!
          </p>
        </div>
      )}
    </div>
  );
}
