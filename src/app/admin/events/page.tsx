'use client';

import React from 'react';
import { Calendar, MapPin, Users } from 'lucide-react';

export default function EventsPage() {
  const events = [
    {
      id: '1',
      name: 'Q2 Leadership Summit',
      date: '2024-04-20',
      location: 'San Francisco, CA',
      type: 'hybrid',
      rsvps: 45,
      capacity: 100,
    },
    {
      id: '2',
      name: 'Campus Activation Tour',
      date: '2024-04-25',
      location: 'UC Berkeley',
      type: 'offline',
      rsvps: 82,
      capacity: 150,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-100">Events</h1>
        <p className="text-gray-400">Manage platform events and track attendance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-100">{event.name}</h3>
              <span className="text-xs rounded-full bg-blue-500/20 px-2.5 py-1 text-blue-300">
                {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Calendar className="h-4 w-4" />
                {event.date}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="h-4 w-4" />
                {event.location}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Users className="h-4 w-4" />
                {event.rsvps} / {event.capacity} attendees
              </div>
            </div>

            <div className="mb-3 h-2 bg-gray-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${(event.rsvps / event.capacity) * 100}%` }}
              />
            </div>

            <button className="w-full rounded-lg bg-amber-500/20 py-2 text-sm font-medium text-amber-300 hover:bg-amber-500/30 transition-colors">
              Manage Event
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
