'use client';

import React from 'react';
import { FileText, Lock, Plus } from 'lucide-react';

export default function ContentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Content Library</h1>
          <p className="text-gray-400">Manage resources and marketing materials</p>
        </div>
        <button
          type="button"
          disabled
          className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-fuchsia-500/20 px-4 py-2.5 text-sm font-medium text-fuchsia-300 opacity-50"
        >
          <Plus className="h-4 w-4" />
          Upload Pipeline Pending
        </button>
      </div>

      <div className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-8 text-center">
        <FileText className="mx-auto mb-4 h-12 w-12 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-100">No approved content assets are published yet</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-400">
          The previous sample PDF cards were removed because there is no storage, versioning, or publishing workflow
          behind them. Add real asset storage rules before exposing downloads to ambassadors.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-gray-700 px-3 py-1 text-xs text-gray-400">
          <Lock className="h-3.5 w-3.5" />
          Disabled until file storage is specified
        </div>
      </div>
    </div>
  );
}
