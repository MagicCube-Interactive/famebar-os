'use client';

import React, { useState } from 'react';
import { HiOutlineCalendar, HiOutlineLocationMarker, HiOutlineUsers } from 'react-icons/hi';

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  type: 'online' | 'offline' | 'hybrid';
  ambassadorHost: string;
  attendees: number;
  description: string;
  image?: string;
}

/**
 * EventsPage
 * Upcoming events for buyers to discover and attend
 * Shows events hosted by ambassadors with RSVP functionality
 */
export default function EventsPage() {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([
    {
      id: 'event-1',
      name: 'Spring Collection Launch',
      date: '2024-04-20',
      time: '2:00 PM',
      location: 'Online via Zoom',
      type: 'online',
      ambassadorHost: 'Alex Johnson',
      attendees: 42,
      description:
        'Join us for an exclusive first look at our spring collection. Learn about new products and get exclusive launch discounts!',
    },
    {
      id: 'event-2',
      name: 'Exclusive VIP Tasting',
      date: '2024-04-25',
      time: '6:00 PM',
      location: 'New York, NY',
      type: 'offline',
      ambassadorHost: 'Sarah Williams',
      attendees: 28,
      description:
        'Premium in-person event featuring our luxury wellness line. Light refreshments and networking included.',
    },
    {
      id: 'event-3',
      name: 'Wellness Workshop',
      date: '2024-05-05',
      time: '10:00 AM',
      location: 'Hybrid Event',
      type: 'hybrid',
      ambassadorHost: 'Alex Johnson',
      attendees: 67,
      description:
        'Learn wellness tips and tricks from industry experts. Available both in-person and online.',
    },
    {
      id: 'event-4',
      name: 'Community Meetup',
      date: '2024-05-15',
      time: '5:00 PM',
      location: 'Los Angeles, CA',
      type: 'offline',
      ambassadorHost: 'Marcus Davis',
      attendees: 15,
      description:
        'Casual meetup for FameBar community members. Connect with other buyers and ambassadors!',
    },
  ]);

  const [rsvpedEvents, setRsvpedEvents] = useState<Set<string>>(new Set());

  const handleRsvp = (eventId: string) => {
    const newRsvpedEvents = new Set(rsvpedEvents);
    if (newRsvpedEvents.has(eventId)) {
      newRsvpedEvents.delete(eventId);
    } else {
      newRsvpedEvents.add(eventId);
    }
    setRsvpedEvents(newRsvpedEvents);
  };

  const typeConfig = {
    online: { bg: 'bg-blue-500/10', text: 'text-blue-300', label: '📱 Online' },
    offline: { bg: 'bg-purple-500/10', text: 'text-purple-300', label: '📍 In-Person' },
    hybrid: { bg: 'bg-pink-500/10', text: 'text-pink-300', label: '🌐 Hybrid' },
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Upcoming Events</h1>
        <p className="text-gray-400">Connect with ambassadors and fellow buyers at exclusive events</p>
      </div>

      {/* Events List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {upcomingEvents.map((event) => {
          const isRsvped = rsvpedEvents.has(event.id);
          const config = typeConfig[event.type];
          const eventDate = new Date(event.date);
          const formattedDate = eventDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            weekday: 'short',
          });

          return (
            <div
              key={event.id}
              className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 overflow-hidden transition-all hover:border-amber-400/30"
            >
              {/* Image Placeholder */}
              <div className="h-40 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                <span className="text-4xl">📅</span>
              </div>

              {/* Event Info */}
              <div className="p-6 space-y-4">
                {/* Header with Type Badge */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">{event.name}</h3>
                    <p className="text-sm text-gray-400 mb-3">{event.description}</p>
                  </div>
                  <div className={`rounded-lg px-3 py-1 text-xs font-semibold whitespace-nowrap ${config.bg} ${config.text}`}>
                    {config.label}
                  </div>
                </div>

                {/* Event Details */}
                <div className="space-y-2 border-t border-gray-700/30 pt-4">
                  {/* Date & Time */}
                  <div className="flex items-center gap-3">
                    <HiOutlineCalendar className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-100">{formattedDate}</p>
                      <p className="text-xs text-gray-500">{event.time}</p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-3">
                    <HiOutlineLocationMarker className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <p className="text-sm text-gray-400">{event.location}</p>
                  </div>

                  {/* Host & Attendees */}
                  <div className="flex items-center gap-3">
                    <HiOutlineUsers className="h-4 w-4 text-purple-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-400">
                        Hosted by <span className="font-semibold text-amber-300">{event.ambassadorHost}</span>
                      </p>
                      <p className="text-xs text-gray-500">{event.attendees} attendees</p>
                    </div>
                  </div>
                </div>

                {/* RSVP Button */}
                <button
                  onClick={() => handleRsvp(event.id)}
                  className={`w-full rounded-lg py-2.5 px-4 text-center font-semibold transition-all ${
                    isRsvped
                      ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                      : 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-white'
                  }`}
                >
                  {isRsvped ? '✓ You\'re Going' : 'RSVP Now'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Past Events Section */}
      <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Past Events</h2>
        <p className="text-gray-400">Check out the events you've attended or missed!</p>
        <button className="mt-4 text-amber-300 hover:text-amber-400 font-semibold">
          View past events →
        </button>
      </div>

      {/* Info Section */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-6">
        <h3 className="text-lg font-semibold text-blue-300 mb-4">Why Attend?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-200/80">
          <div>
            <p className="font-semibold text-blue-300 mb-1">🎁 Exclusive Offers</p>
            <p>Get special event-only discounts and limited-edition products</p>
          </div>
          <div>
            <p className="font-semibold text-blue-300 mb-1">🤝 Network</p>
            <p>Connect with ambassadors and other buyers in your community</p>
          </div>
          <div>
            <p className="font-semibold text-blue-300 mb-1">📚 Learn</p>
            <p>Discover wellness tips, product education, and industry insights</p>
          </div>
        </div>
      </div>
    </div>
  );
}
