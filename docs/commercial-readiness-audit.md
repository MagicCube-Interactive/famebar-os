# FameBar Commercial Readiness Audit

## Workflow Map

### Invited visitor
- Enters a sponsor code on the homepage.
- Code validation normalizes to uppercase before lookup.
- Registration creates a buyer account, not an ambassador account.

### Buyer
- Signs up through `/register`.
- Buyer profile is created through `/api/setup-buyer`.
- Can place retail orders from `/buyer`.
- Can request ambassador review, which writes `requested_ambassador_at`.

### Admin / Ming
- Uses `/admin/record-sale` as the Commerce Hub.
- Sees buyer review requests in the approval queue.
- Approves consignment 50-packs, records wholesale 50-packs, records consignment sales, and posts remittances.

### Ambassador
- Gets promoted only when a 50-pack is approved.
- Receives a referral code at promotion time.
- Uses `/ambassador/share` for code copy, share link copy, QR download, and message templates.

## Bugs Fixed
- Locked down `/api/payout`, `/api/refund`, and `/api/settlement` to authenticated admins only.
- Made reward processing idempotent so repeated order reward triggers do not duplicate commissions or token events.
- Stopped internal order flows from calling the public commission route directly; reward processing now runs in shared server logic.
- Tightened `/api/data` so non-admin users cannot query outside their own buyer or ambassador scope.
- Added the missing `/ambassador/team-tree`, `/terms`, `/privacy`, and `/help` routes.
- Surfaced buyer review requests operationally in the Commerce Hub instead of leaving them as a hidden timestamp only.
- Replaced the Share Hub QR placeholder with a real downloadable QR code.
- Normalized invite-code checks to uppercase in the visitor and registration flows.
- Fixed ambassador analytics screens that were reading the wrong commission field name and an over-broad customer order query.
- Removed the retired `leader` role from the schema role constraint so the database matches `buyer | ambassador | admin`.
- Replaced the legacy mock approval queue with a Commerce Hub link instead of fake approve/reject buttons.
- Disabled the admin command terminal input because no audited command execution workflow exists.
- Removed synthetic admin analytics, event, content, and fraud sample data that could be mistaken for real operational truth.

## Intentionally Disabled Or Redirected
- Admin campaign creation is disabled until campaign-specific referral-code rules are finalized.
- Admin content uploads are disabled until the storage and publishing workflow is defined.
- Admin event management is read-only until RSVP, host, and capacity rules are defined.
- Admin analytics routes point operators to live ledger/order surfaces until analytics definitions are ledger-backed.
- Fraud automation is disabled until detection rules, evidence capture, review actions, and audit persistence are defined.
- Admin settings cards are read-only until each mutation has scoped permissions and audit logging.
- Ambassador profile pause/delete actions are disabled until support and retention flows are defined.
- Ambassador campaign buttons route back to current live sharing surfaces instead of pretending campaign-specific codes already exist.
- Individual downline profile CTAs are disabled because no per-member profile route or permissions model is defined.

## Design Gaps Still Needing Product Decisions
- Campaign-specific referral codes exist in schema shape only; the product rules for creating, assigning, and measuring them are still incomplete.
- Event management remains preview-only because there is no agreed RSVP lifecycle, waitlist policy, or host action model yet.
- Content uploads are visible conceptually, but there is no final decision on storage, approvals, versioning, or who can publish files.
- Profile self-service edits and destructive account actions need a support/compliance policy before they can be safely enabled.
- Fraud tooling needs explicit rules for self-buy detection, device/payment fingerprinting, velocity checks, refund abuse, evidence retention, and operator review outcomes.
- Analytics still needs a product-approved metric catalog, including definitions for GMV, active ambassadors, conversion rate, token liability, and pack inventory health.
