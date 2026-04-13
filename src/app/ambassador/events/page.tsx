'use client';

import React from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { canViewAmbassadorPages } from '@/types';
import { Calendar, MapPin, Users, Zap, Clock } from 'lucide-react';

export default function EventsPage() {
  const { userProfile } = useAuthContext();

  if (!userProfile || !canViewAmbassadorPages(userProfile)) {
    return null;
  }

  const events = [
    {
      id: 1,
      name: 'Building Your 6-Figure Network',
      type: 'Bootcamp',
      date: '2024-04-15',
      time: '6:00 PM EDT',
      location: 'Online',
      host: 'Sarah Mitchell (Founder)',
      description: 'Intensive training on scaling your team and hitting six figures',
      rsvpd: true,
      attendees: 245,
      speakers: ['Sarah Mitchell', 'James Chen', 'Marcus Johnson'],
    },
    {
      id: 2,
      name: 'Weekly Mindset + Sharing Strategies',
      type: 'Webinar',
      date: '2024-04-10',
      time: '7:30 PM EDT',
      location: 'Online',
      host: 'Marcus Johnson',
      description: 'Weekly session on mindset shifts and sharing mastery',
      rsvpd: false,
      attendees: 89,
      speakers: ['Marcus Johnson'],
    },
    {
      id: 3,
      name: 'Q2 In-Person Summit',
      type: 'Conference',
      date: '2024-05-18',
      time: '9:00 AM EDT',
      location: 'Miami, FL',
      host: 'FameClub Team',
      description: 'Network with top ambassadors and learn advanced strategies',
      rsvpd: true,
      attendees: 150,
      speakers: ['Global Leadership Team'],
    },
  ];

  const pastEventCount = 5;
  const earnedFromEvents = 2500;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Events</h1>
        <p className="mt-2 text-gray-400">Attend events and grow your network</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4">
          <p className="text-xs text-gray-500">RSVP'd Events</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {events.filter(e => e.rsvpd).length}
          </p>
        </div>
        <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-4">
          <p className="text-xs text-gray-500">Past Events</p>
          <p className="mt-2 text-2xl font-bold text-cyan-400">{pastEventCount}</p>
        </div>
        <div className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-950/20 p-4">
          <p className="text-xs text-gray-500">Event Earnings</p>
          <p className="mt-2 text-2xl font-bold text-fuchsia-400">
            ${earnedFromEvents.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Upcoming Events */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-100">Upcoming Events</h2>
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className={`rounded-lg border p-6 transition-all duration-200 ${
                event.rsvpd
                  ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-green-950/20'
                  : 'border-gray-700/50 bg-gray-800/30'
              }`}
            >
              <div className="mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex rounded-full bg-fuchsia-500/20 px-3 py-1 text-xs font-semibold text-fuchsia-300">
                      {event.type}
                    </span>
                    {event.rsvpd && (
                      <span className="inline-flex rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                        ✓ RSVP'd
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-100">{event.name}</h3>
                  <p className="mt-2 text-sm text-gray-400">{event.description}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {event.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {event.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {event.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {event.attendees} attending
                    </span>
                  </div>

                  {event.speakers.length > 0 && (
                    <div className="mt-3 text-xs text-gray-400">
                      <span className="font-semibold">Speakers:</span> {event.speakers.join(', ')}
                    </div>
                  )}
                </div>

                <button
                  className={`whitespace-nowrap rounded-lg px-6 py-2.5 font-semibold transition-all duration-200 ${
                    event.rsvpd
                      ? 'border border-emerald-500/50 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                      : 'bg-gradient-to-r from-fuchsia-500 to-purple-400 text-gray-900 hover:from-fuchsia-600 hover:to-purple-500'
                  }`}
                >
                  {event.rsvpd ? '✓ RSVP\'d' : 'RSVP Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Event Strategy */}
      <div className="rounded-lg border border-purple-500/30 bg-purple-950/20 p-6">
        <h3 className="mb-3 font-semibold text-purple-300">Why Events Matter</h3>
        <div className="space-y-2 text-sm text-purple-200">
          <p>• <span className="font-semibold">In-person connections</span> convert 3-5x better than digital sharing</p>
          <p>• <span className="font-semibold">Learn from top performers</span> and get exclusive strategies</p>
          <p>• <span className="font-semibold">Network with leaders</span> in your region</p>
          <p>• <span className="font-semibold">Recruitment boost</span> - most ambassadors recruited at events</p>
          <p>• <span className="font-semibold">Special event codes</span> available for higher conversion tracking</p>
        </div>
      </div>

      {/* Past Events Summary */}
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-100">Your Event Performance</h3>

        <div className="space-y-3">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-gray-400">Events Attended</span>
              <span className="font-bold text-gray-200">{pastEventCount}</span>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-gray-400">Earnings from Events</span>
              <span className="font-bold text-emerald-400">${earnedFromEvents.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-gray-400">Average per Event</span>
              <span className="font-bold text-fuchsia-400">
                ${(earnedFromEvents / pastEventCount).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 mt-4">
            <p className="text-xs text-emerald-300">
              <span className="font-semibold">Great job!</span> Events have contributed{' '}
              <span className="font-bold">20% of your total earnings</span> this month. Continue attending
              to scale faster!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
