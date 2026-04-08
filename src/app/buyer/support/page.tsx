'use client';

import React, { useState } from 'react';
import { HiOutlineQuestionMarkCircle, HiOutlineMail, HiOutlinePhone } from 'react-icons/hi';

/**
 * SupportPage
 * Customer support and FAQ section for buyers
 */
export default function SupportPage() {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const faqs = [
    {
      id: 'faq-1',
      question: 'How do I track my order?',
      answer:
        'You can track your order status by visiting the "My Orders" section of your account. Each order shows the current status (pending, shipped, delivered, etc.) and estimated delivery date.',
    },
    {
      id: 'faq-2',
      question: 'What is the return/refund policy?',
      answer:
        'We offer a 30-day return policy on most products. If you\'re not satisfied with your purchase, contact support within 30 days of delivery for a full refund or exchange.',
    },
    {
      id: 'faq-3',
      question: 'How long does shipping take?',
      answer:
        'Standard shipping takes 5-7 business days from the date your order is shipped. You\'ll receive a tracking number via email once your order is on its way.',
    },
    {
      id: 'faq-4',
      question: 'Can I modify my order after purchase?',
      answer:
        'Orders can only be modified within 24 hours of placement. If you need to make changes, contact support immediately with your order number.',
    },
    {
      id: 'faq-5',
      question: 'How do Hold-to-Save tokens work?',
      answer:
        'You earn 10 $FAME tokens for every $1 spent. When you reach certain token thresholds (10K, 25K, 50K, 100K), you unlock discounts on future purchases (5%, 10%, 15%, 20%).',
    },
    {
      id: 'faq-6',
      question: 'What payment methods do you accept?',
      answer:
        'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and digital wallets like Apple Pay and Google Pay.',
    },
    {
      id: 'faq-7',
      question: 'Is my payment information secure?',
      answer:
        'Yes. All transactions are encrypted with SSL security and processed through PCI-compliant payment gateways. We never store your full card details.',
    },
    {
      id: 'faq-8',
      question: 'How do I contact customer support?',
      answer:
        'You can reach our support team via email at support@famebar.com or through the contact form below. We typically respond within 24 hours.',
    },
  ];

  const contactMethods = [
    {
      method: 'Email',
      value: 'support@famebar.com',
      icon: HiOutlineMail,
      responseTime: '24 hours',
    },
    {
      method: 'Phone',
      value: '1-800-FAMEBAR',
      icon: HiOutlinePhone,
      responseTime: 'Business hours',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Help & Support</h1>
        <p className="text-gray-400">Find answers to common questions or contact our support team</p>
      </div>

      {/* Contact Methods */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {contactMethods.map((contact) => {
          const Icon = contact.icon;
          return (
            <div
              key={contact.method}
              className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Icon className="h-6 w-6 text-amber-400" />
                <h3 className="text-lg font-bold text-white">{contact.method}</h3>
              </div>
              <p className="text-2xl font-bold text-amber-300 mb-2">{contact.value}</p>
              <p className="text-xs text-gray-500">Response time: {contact.responseTime}</p>
            </div>
          );
        })}
      </div>

      {/* Contact Form */}
      <div className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Your Name</label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Subject</label>
            <select className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-100 focus:outline-none focus:border-amber-400">
              <option>Order Issue</option>
              <option>Product Question</option>
              <option>Refund Request</option>
              <option>Account Help</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Message</label>
            <textarea
              placeholder="Tell us how we can help..."
              rows={5}
              className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 transition-all py-3 font-semibold text-white"
          >
            Send Message
          </button>
        </form>
      </div>

      {/* FAQ Section */}
      <div className="space-y-6">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-white mb-6">
            <HiOutlineQuestionMarkCircle className="h-7 w-7 text-amber-400" />
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq) => (
            <div key={faq.id} className="rounded-lg border border-gray-700/50 bg-gray-800/30 overflow-hidden">
              <button
                onClick={() =>
                  setExpandedFaq(expandedFaq === faq.id ? null : faq.id)
                }
                className="w-full px-6 py-4 text-left font-semibold text-gray-100 hover:bg-gray-700/30 transition-colors flex justify-between items-center"
              >
                {faq.question}
                <span
                  className={`text-amber-400 transition-transform ${
                    expandedFaq === faq.id ? 'rotate-180' : ''
                  }`}
                >
                  ▼
                </span>
              </button>

              {expandedFaq === faq.id && (
                <div className="border-t border-gray-700/30 px-6 py-4 bg-gray-900/20">
                  <p className="text-gray-400 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Additional Resources */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-8">
        <h2 className="text-2xl font-bold text-blue-300 mb-6">Additional Resources</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-lg bg-blue-900/30 p-4 border border-blue-500/20">
            <h3 className="font-semibold text-blue-300 mb-2">📖 Blog</h3>
            <p className="text-sm text-blue-200/80 mb-3">
              Read articles about wellness, product features, and ambassador success stories.
            </p>
            <a href="#" className="text-sm font-semibold text-blue-400 hover:text-blue-300">
              Visit blog →
            </a>
          </div>

          <div className="rounded-lg bg-blue-900/30 p-4 border border-blue-500/20">
            <h3 className="font-semibold text-blue-300 mb-2">🎓 Academy</h3>
            <p className="text-sm text-blue-200/80 mb-3">
              Learn how to maximize your FameBar experience with tutorials and guides.
            </p>
            <a href="#" className="text-sm font-semibold text-blue-400 hover:text-blue-300">
              Learn more →
            </a>
          </div>

          <div className="rounded-lg bg-blue-900/30 p-4 border border-blue-500/20">
            <h3 className="font-semibold text-blue-300 mb-2">🔒 Privacy Policy</h3>
            <p className="text-sm text-blue-200/80 mb-3">
              Understand how we protect your data and privacy.
            </p>
            <a href="#" className="text-sm font-semibold text-blue-400 hover:text-blue-300">
              Read policy →
            </a>
          </div>

          <div className="rounded-lg bg-blue-900/30 p-4 border border-blue-500/20">
            <h3 className="font-semibold text-blue-300 mb-2">📋 Terms of Service</h3>
            <p className="text-sm text-blue-200/80 mb-3">
              Review our terms and conditions.
            </p>
            <a href="#" className="text-sm font-semibold text-blue-400 hover:text-blue-300">
              View terms →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
