export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-on-surface">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-4xl font-black">Terms of Service</h1>
        <p className="text-sm text-on-surface-variant">
          FameBar access is restricted to users who are at least 21 years old and who participate
          through a valid sponsor invitation. Operational features, commissions, remittances, and
          token rewards are subject to admin review, refund clawback windows, and the program rules
          displayed in the app.
        </p>
        <p className="text-sm text-on-surface-variant">
          Retail orders, consignment activity, wholesale packs, and ambassador payouts are recorded
          in the platform ledger and may be adjusted if fraud, compliance, or refund events occur.
        </p>
      </div>
    </main>
  );
}
