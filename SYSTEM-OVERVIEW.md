# FameBar OS — System Overview

**Live URL:** https://famebar-os.vercel.app
**Stack:** Next.js 14 + Supabase (Postgres, Auth, RLS) + Vercel

---

## What Is FameBar OS?

FameBar OS is a direct-selling operations platform that connects four user roles through a unified system: **Buyers** who purchase products, **Ambassadors** who refer buyers and earn commissions, **Leaders** who manage ambassador teams, and **Admins** who oversee the entire operation. Every transaction flows through a 6-tier compensation engine powered by a proprietary token economy ($FAME).

---

## The Four Portals

### 1. Buyer Portal (`/buyer`)
Buyers browse the product catalog, place orders, and earn $FAME tokens on every purchase. A **Hold-to-Save** loyalty system rewards buyers who hold tokens with escalating discounts (5% at 10K tokens up to 20% at 100K). Buyers are always linked to the ambassador who referred them.

### 2. Ambassador Portal (`/ambassador`)
Ambassadors are the revenue engine. Each ambassador gets a unique referral code and a **Share Hub** with pre-built message templates for Telegram, Instagram, and TikTok. They earn commissions on personal sales (Tier 0) plus overrides on their downline team's sales (Tiers 1-6). The dashboard tracks earnings, $FAME token rewards, team growth, and milestone progress. Founder ambassadors (first 20) receive a permanent 2x token multiplier.

### 3. Leader Portal (`/leader`)
Leaders are senior ambassadors who manage multi-level teams. Their dashboard visualizes team revenue waterfalls (L1-L6), identifies underperforming ambassadors via a **Team Activity Heatmap**, and surfaces coaching opportunities through a "Pulse" widget. Leaders track their rank progression toward titles like Platinum Executive.

### 4. Admin Portal (`/admin`)
The Ops Cockpit provides a Bloomberg-terminal-style command center: real-time GMV tracking, a global order ledger, commission-by-tier analytics, fraud queue management, cash/token ledger auditing, and user management. Admins can review flagged orders, process settlements, and monitor system health.

---

## Core Business Logic

| Feature | How It Works |
|---|---|
| **6-Tier Commissions** | Tier 0 (personal sale) = 20%. Tiers 1-6 pay overrides to the ambassador's upline chain at decreasing rates. |
| **$FAME Tokens** | Ambassadors earn tokens on every sale. Founders get 2x. Tokens are tracked in a vault with pending/available states. |
| **Hold-to-Save** | Buyers holding 10K/25K/50K/100K tokens unlock 5%/10%/15%/20% permanent discounts. |
| **14-Day Settlement** | Commissions enter a 14-day hold period before becoming withdrawable (fraud/refund protection). |
| **Referral Tracking** | Every order is linked to an ambassador's referral code, powering the entire compensation chain. |

---

## Data & Security

- **Row-Level Security (RLS):** Every database table is locked down — users only see their own data. Admins see everything.
- **Role-Based Middleware:** Next.js middleware checks auth + role on every request. Wrong role = redirect to own dashboard.
- **Service Role Key:** Admin-only operations (settlements, batch processing) use a server-side service key that bypasses RLS.

---

## Test Accounts

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@famebar.test` | `FameBar2026!` |
| **Ambassador** | `ambassador@famebar.test` | `FameBar2026!` |
| **Leader** | `leader@famebar.test` | `FameBar2026!` |
| **Buyer** | `buyer@famebar.test` | `FameBar2026!` |

Sign in at: https://famebar-os.vercel.app/login

---

## Tech Architecture (Summary)

```
Browser  -->  Next.js (Vercel)  -->  Supabase (Postgres + Auth)
                |                         |
           Middleware (RBAC)         RLS Policies
           4 Portal Layouts         Profiles + Ambassador/Buyer tables
           49 Pages                 Commissions + Tokens + Orders
           Aureum Obsidian UI       Team hierarchy (sponsor_id tree)
```

**Design System:** "Aureum Obsidian" — dark obsidian base (#0e131f), amber/gold primary accents, emerald secondary, Inter + JetBrains Mono fonts, tonal surface layering with no explicit borders.
