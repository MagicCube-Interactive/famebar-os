'use client';

import React from 'react';
import { Calendar, Lock } from 'lucide-react';

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-100">Events</h1>
        <p className="text-gray-400">Manage platform events and track attendance</p>
      </div>

      <div className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-8 text-center">
        <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-100">Event management is intentionally disabled</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-400">
          No live RSVP, capacity, host, or attendance workflows are defined yet, so demo event cards have been removed.
          This keeps operators from treating sample events as real activations.
        </p>
        <button
          type="button"
          disabled
          className="mt-6 inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-fuchsia-500/20 px-4 py-2 text-sm font-semibold text-fuchsia-300 opacity-60"
        >
          <Lock className="h-4 w-4" />
          Pending Event Product Rules
        </button>
      </div>
    </div>
  );
}
