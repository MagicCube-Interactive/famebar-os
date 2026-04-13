'use client';

import React from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { canViewAmbassadorPages } from '@/types';
import { BookOpen, CheckCircle, Clock, Zap } from 'lucide-react';

export default function TrainingPage() {
  const { userProfile } = useAuthContext();

  if (!userProfile || !canViewAmbassadorPages(userProfile)) {
    return null;
  }

  // Mock training modules
  const modules = [
    {
      id: 1,
      title: 'Getting Started',
      description: 'Foundations of FameClub and your role as ambassador',
      lessons: [
        { title: 'Platform Overview', completed: true },
        { title: 'Your First Code', completed: true },
        { title: 'Understanding Commissions', completed: true },
        { title: 'Settlement & Payouts', completed: false },
      ],
      estimatedTime: '45 min',
      icon: BookOpen,
      color: 'from-tertiary/20 to-tertiary/20 border-tertiary/20 text-tertiary',
    },
    {
      id: 2,
      title: 'Sharing Mastery',
      description: 'Proven strategies for sharing your code and converting leads',
      lessons: [
        { title: 'Choosing Your Channels', completed: true },
        { title: 'Message Templates', completed: true },
        { title: 'Personal Stories', completed: false },
        { title: 'Timing & Frequency', completed: false },
      ],
      estimatedTime: '60 min',
      icon: Zap,
      color: 'from-primary/20 to-primary/20 border-primary/20 text-primary-fixed-dim',
    },
    {
      id: 3,
      title: 'Building Your Team',
      description: 'Recruiting, onboarding, and supporting ambassadors',
      lessons: [
        { title: 'Finding Leaders', completed: false },
        { title: 'Onboarding Process', completed: false },
        { title: 'Team Support Systems', completed: false },
        { title: 'Scaling Your Network', completed: false },
      ],
      estimatedTime: '90 min',
      icon: Zap,
      color: 'from-tertiary/20 to-tertiary/20 border-tertiary/20 text-tertiary',
    },
    {
      id: 4,
      title: 'Events & Campaigns',
      description: 'Maximize earnings through events and promotional campaigns',
      lessons: [
        { title: 'Event Strategy', completed: false },
        { title: 'Campaign Deep Dive', completed: false },
        { title: 'Tracking ROI', completed: false },
      ],
      estimatedTime: '75 min',
      icon: Zap,
      color: 'from-secondary/20 to-secondary/20 border-secondary/20 text-secondary',
    },
  ];

  // Calculate overall progress
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedLessons = modules.reduce(
    (sum, m) => sum + m.lessons.filter(l => l.completed).length,
    0
  );
  const overallProgress = Math.round((completedLessons / totalLessons) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-on-surface">Training Center</h1>
        <p className="mt-2 text-on-surface-variant">Master the skills to grow your FameClub business</p>
      </div>

      {/* Overall Progress */}
      <div className="rounded-lg border border-outline-variant/10 bg-surface-container-low p-6">
        <h2 className="mb-4 text-lg font-semibold text-on-surface">Your Progress</h2>

        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-on-surface-variant">Overall Completion</p>
              <p className="text-sm font-bold text-primary">{overallProgress}%</p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-surface-container-highest">
              <div
                className="h-full bg-gradient-to-r from-primary-fixed-dim to-primary transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg bg-surface-container p-3 text-center">
              <p className="text-xs text-gray-500">Lessons Done</p>
              <p className="mt-2 text-xl font-bold text-secondary">{completedLessons}</p>
            </div>
            <div className="rounded-lg bg-surface-container p-3 text-center">
              <p className="text-xs text-gray-500">Lessons Left</p>
              <p className="mt-2 text-xl font-bold text-primary-fixed-dim">{totalLessons - completedLessons}</p>
            </div>
            <div className="rounded-lg bg-surface-container p-3 text-center">
              <p className="text-xs text-gray-500">Modules</p>
              <p className="mt-2 text-xl font-bold text-tertiary">{modules.length}</p>
            </div>
            <div className="rounded-lg bg-surface-container p-3 text-center">
              <p className="text-xs text-gray-500">Time Invested</p>
              <p className="mt-2 text-xl font-bold text-tertiary">3h 15m</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-4">
        {modules.map((module) => {
          const Icon = module.icon;
          const completedCount = module.lessons.filter(l => l.completed).length;
          const moduleProgress = Math.round((completedCount / module.lessons.length) * 100);

          return (
            <div
              key={module.id}
              className={`rounded-lg border bg-gradient-to-br p-6 transition-all duration-200 hover:shadow-lg ${module.color}`}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${module.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-on-surface">{module.title}</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">{module.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {module.estimatedTime}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500">
                    {completedCount}/{module.lessons.length} lessons
                  </p>
                  <p className="text-xs font-bold text-on-surface-variant">{moduleProgress}%</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">
                  <div
                    className="h-full bg-gradient-to-r from-primary-container to-primary transition-all duration-500"
                    style={{ width: `${moduleProgress}%` }}
                  />
                </div>
              </div>

              {/* Lessons */}
              <div className="space-y-2 mb-4">
                {module.lessons.map((lesson, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-lg bg-surface-container/30 p-3">
                    {lesson.completed ? (
                      <CheckCircle className="h-4 w-4 flex-shrink-0 text-secondary" />
                    ) : (
                      <div className="h-4 w-4 flex-shrink-0 rounded-full border-2 border-outline-variant/20" />
                    )}
                    <p
                      className={`text-sm ${
                        lesson.completed ? 'text-on-surface-variant line-through' : 'text-on-surface-variant'
                      }`}
                    >
                      {lesson.title}
                    </p>
                  </div>
                ))}
              </div>

              <button className={`w-full rounded-lg py-2.5 font-semibold text-sm transition-all duration-200 ${
                moduleProgress === 100
                  ? 'bg-secondary/20 text-secondary border border-secondary/30'
                  : 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30'
              }`}>
                {moduleProgress === 100 ? '✓ Completed' : 'Continue Module'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Certification Banner */}
      <div className="rounded-lg border border-secondary/20 bg-surface-container-low p-6">
        <div className="flex items-start gap-4">
          <div className="text-3xl">🏆</div>
          <div>
            <h3 className="font-bold text-secondary">Ambassador Certification</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Complete all modules to earn your official FameClub Ambassador Certification and unlock
              exclusive perks like priority support and early access to new features.
            </p>
            <p className="mt-3 text-xs text-secondary">
              Progress: {overallProgress}% complete
            </p>
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="rounded-lg border border-tertiary/20 bg-surface-container-low p-6">
        <h3 className="mb-4 font-semibold text-tertiary">Additional Resources</h3>
        <div className="space-y-2">
          <a href="#" className="block text-sm text-tertiary hover:text-tertiary/80">
            → Download Ambassador Handbook
          </a>
          <a href="#" className="block text-sm text-tertiary hover:text-tertiary/80">
            → Watch Video: Building Your Network
          </a>
          <a href="#" className="block text-sm text-tertiary hover:text-tertiary/80">
            → Join the Ambassador Telegram Group
          </a>
          <a href="#" className="block text-sm text-tertiary hover:text-tertiary/80">
            → Schedule a 1-on-1 Coaching Call
          </a>
        </div>
      </div>
    </div>
  );
}
