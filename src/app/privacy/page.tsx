export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-on-surface">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-4xl font-black">Privacy Policy</h1>
        <p className="text-sm text-on-surface-variant">
          FameBar stores the profile, referral, order, pack, commission, and token information
          needed to operate the buyer and ambassador workflow. This includes age-verification state,
          sponsor attribution, payment records, and internal audit details for commercial operations.
        </p>
        <p className="text-sm text-on-surface-variant">
          Admin-only tools are used to approve 50-packs, record remittances, process payouts, and
          resolve refunds. Access to those functions is restricted to authenticated admin users.
        </p>
      </div>
    </main>
  );
}
