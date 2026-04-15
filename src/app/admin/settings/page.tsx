'use client';

import React from 'react';
import { Settings, Lock, Database, Bell } from 'lucide-react';

export default function SettingsPage() {
  const settings = [
    {
      title: 'Platform Configuration',
      description: 'Adjust core platform settings and parameters',
      icon: Settings,
    },
    {
      title: 'Security & Access',
      description: 'Manage admin permissions and security settings',
      icon: Lock,
    },
    {
      title: 'Data & Backups',
      description: 'Database backups and data management',
      icon: Database,
    },
    {
      title: 'Notifications',
      description: 'Configure system alerts and notifications',
      icon: Bell,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-100">Settings</h1>
        <p className="text-gray-400">System configuration and administration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settings.map((setting, idx) => {
          const Icon = setting.icon;
          return (
            <div
              key={idx}
              className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-6 opacity-75"
            >
              <div className="flex items-start gap-4">
                <Icon className="h-6 w-6 text-fuchsia-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-100 mb-1">{setting.title}</h3>
                  <p className="text-sm text-gray-400">{setting.description}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Read-only until settings mutations are scoped and audited
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
