import Link from 'next/link';

const helpSections = [
  {
    title: 'Commerce Hub',
    description:
      'Use the Commerce Hub for buyer review approvals, consignment sales, remittances, and wholesale 50-pack booking.',
    href: '/admin/record-sale',
  },
  {
    title: 'Orders and Refunds',
    description:
      'Review paid, pending, and refunded orders from the admin order ledger before running refunds or settlement.',
    href: '/admin/orders',
  },
  {
    title: 'Ambassador Sharing',
    description:
      'Referral codes, QR downloads, and copy templates live in the Share Hub once ambassador status is active.',
    href: '/ambassador/share',
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-on-surface">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="rounded-2xl border border-outline-variant/10 bg-surface-container p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Help Center</p>
          <h1 className="mt-3 text-4xl font-black">Workflow Support</h1>
          <p className="mt-3 max-w-2xl text-sm text-on-surface-variant">
            This app is now oriented around buyer intake first, followed by admin-approved 50-pack
            promotion into ambassador status. Use the links below to reach the operational pages.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {helpSections.map((section) => (
            <Link
              key={section.title}
              href={section.href}
              className="rounded-2xl border border-outline-variant/10 bg-surface-container p-6 transition hover:bg-surface-container-high"
            >
              <h2 className="text-lg font-bold">{section.title}</h2>
              <p className="mt-2 text-sm text-on-surface-variant">{section.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
