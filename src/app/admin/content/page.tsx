'use client';

import React from 'react';
import { FileText, Plus } from 'lucide-react';

export default function ContentPage() {
  const content = [
    { title: 'Ambassador Onboarding Guide', type: 'PDF', size: '2.4 MB', updated: '2024-04-05' },
    { title: 'Sales Playbook v2.1', type: 'PDF', size: '3.8 MB', updated: '2024-03-28' },
    { title: 'Brand Guidelines', type: 'PDF', size: '5.2 MB', updated: '2024-02-15' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Content Library</h1>
          <p className="text-gray-400">Manage resources and marketing materials</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-fuchsia-500/20 px-4 py-2.5 text-sm font-medium text-fuchsia-300 hover:bg-fuchsia-500/30 transition-colors">
          <Plus className="h-4 w-4" />
          Upload Content
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {content.map((item, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-4"
          >
            <div className="flex items-start gap-3 mb-3">
              <FileText className="h-8 w-8 text-cyan-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-100 truncate">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{item.size}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">Updated: {item.updated}</p>
            <button className="w-full rounded-lg border border-gray-600 bg-gray-700/20 py-2 text-xs font-medium text-gray-200 hover:bg-gray-700/40 transition-colors">
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
