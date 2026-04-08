# Firebase Auth & RBAC System - Quick Start Guide

## 5-Minute Setup

### 1. Create `.env.local`
```bash
cp .env.example .env.local
```

### 2. Add Firebase Credentials to `.env.local`

Get your Firebase credentials:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your FameBar OS project
3. Click Project Settings (⚙️ icon)
4. Go to "General" tab → copy web app config
5. Fill in `NEXT_PUBLIC_FIREBASE_*` variables
6. Go to "Service Accounts" tab → click "Generate New Private Key" → paste JSON as `FIREBASE_SERVICE_ACCOUNT`

### 3. Start Development Server
```bash
npm run dev
```

### 4. Test Authentication
- Go to http://localhost:3000/register
- Create account with role selection
- Auto-redirects to role-specific dashboard
- Try wrong-role routes (auto-redirects to correct dashboard)
- Login at http://localhost:3000/login

## File Structure at a Glance

```
src/
├── lib/firebase/
│   ├── config.ts      ← Client Firebase setup
│   ├── admin.ts       ← Server-side operations
│   └── auth.ts        ← Auth functions
├── context/
│   └── AuthContext.tsx ← Global auth state
├── hooks/
│   ├── useAuth.ts     ← Access auth context
│   └── useRole.ts     ← Role-based routing
├── middleware.ts      ← Route protection
└── app/
    ├── layout.tsx     ← AuthProvider wrapper
    └── (auth)/
        ├── login/page.tsx
        └── register/page.tsx
```

## Common Tasks

### Check if User is Authenticated
```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function MyComponent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;

  return <div>Welcome back!</div>;
}
```

### Get User Role
```typescript
const { role, isBuyer, isAmbassador, isLeader, isAdmin } = useAuth();

// All of these work:
// - role === 'buyer'
// - isBuyer === true
// - isAmbassador === false
```

### Protect a Route (Component Level)
```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';

export default function AmbassadorOnly() {
  const { isAmbassador, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAmbassador) redirect('/buyer/dashboard');

  return <div>Ambassador content here</div>;
}
```

### Route Protection (Automatic via Middleware)
All routes are protected by role:

| Route | Required Role | Can Access |
|-------|---------------|-----------|
| `/buyer/*` | any | buyer, ambassador, leader, admin |
| `/ambassador/*` | ambassador | ambassador, leader, admin |
| `/leader/*` | leader | leader, admin |
| `/admin/*` | admin | admin only |
| `/login` | none | everyone |
| `/register` | none | everyone |

Unauthenticated users → auto-redirect to `/login`
Wrong role → auto-redirect to role dashboard

### Get User Profile
```typescript
const { userProfile } = useAuth();

// userProfile is typed as User | AmbassadorProfile | BuyerProfile
if (userProfile?.role === 'ambassador') {
  console.log(userProfile.tier); // 0-6
  console.log(userProfile.referralCode);
  console.log(userProfile.totalRecruits);
}
```

### Redirect Based on Role
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useDashboardPath } from '@/hooks/useRole';

export default function Home() {
  const router = useRouter();
  const dashboardPath = useDashboardPath();

  const handleSignIn = async () => {
    // ... sign in logic ...
    router.push(dashboardPath); // Goes to correct dashboard
  };

  return <button onClick={handleSignIn}>Sign In</button>;
}
```

### Handle Errors
```typescript
const { error, clearError } = useAuth();

if (error) {
  return (
    <div>
      <p>Error: {error}</p>
      <button onClick={clearError}>Dismiss</button>
    </div>
  );
}
```

## Authentication Flow

### Sign Up Flow
```
/register → Form submission → signUpWithEmail()
  ↓
Create Firebase Auth user
  ↓
Create Firestore profile (buyer or ambassador)
  ↓
Auto-login user
  ↓
AuthContext detects user change
  ↓
Fetch profile from Firestore
  ↓
Get token claims (role)
  ↓
Redirect to dashboard (based on role)
```

### Sign In Flow
```
/login → Form submission → signInWithEmail()
  ↓
Firebase verifies credentials
  ↓
AuthContext detects user change
  ↓
Fetch profile from Firestore
  ↓
Get token claims (role)
  ↓
Redirect to dashboard (based on role)
```

### Protected Route Access
```
User navigates to /ambassador/dashboard
  ↓
Middleware intercepts request
  ↓
Check for Firebase auth token
  ↓
Token missing? → Redirect to /login
  ↓
Token invalid? → Redirect to /login
  ↓
Extract role from token
  ↓
Role allows access? → Allow
  ↓
Role doesn't allow? → Redirect to role dashboard
```

## API Routes with Auth

Protect an API route:

```typescript
// app/api/my-endpoint/route.ts
import { verifyIdToken } from '@/lib/firebase/admin';

export async function GET(request: Request) {
  const token = request.headers
    .get('Authorization')
    ?.split('Bearer ')[1];

  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const claims = await verifyIdToken(token);
    const { role, uid } = claims;

    // Check role
    if (role !== 'ambassador') {
      return new Response('Forbidden', { status: 403 });
    }

    // Process request
    return new Response(
      JSON.stringify({ success: true, userId: uid })
    );
  } catch (error) {
    return new Response('Unauthorized', { status: 401 });
  }
}
```

Use from client:

```typescript
const { user } = useAuth();

const response = await fetch('/api/my-endpoint', {
  headers: {
    'Authorization': `Bearer ${await user?.getIdToken()}`,
  },
});
```

## Setting User Roles (Server-Side)

Only do this in Cloud Functions or API routes:

```typescript
// functions/setUserRole.ts
import * as functions from 'firebase-functions';
import { setCustomClaims } from '@/lib/firebase/admin';

export const onUserCreate = functions.auth
  .user()
  .onCreate(async (user) => {
    // Set role based on signup
    await setCustomClaims(user.uid, { role: 'buyer' });
  });
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Missing Firebase env vars" | Copy `.env.example` to `.env.local` and fill in values |
| Login doesn't work | Check Firebase project is active and credentials are correct |
| Routes not protected | Ensure middleware.ts is in src/ root and config.matcher is set |
| AuthContext returns null | Verify component has `'use client'` at top and is inside `<AuthProvider>` |
| Middleware errors | Check FIREBASE_SERVICE_ACCOUNT is valid JSON string in .env.local |

## Environment Variables Explained

**Public (safe to expose in code):**
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase API key
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Authentication domain
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Cloud Storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - FCM sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase app ID

**Secret (never expose):**
- `FIREBASE_SERVICE_ACCOUNT` - Admin SDK credentials (sensitive!)

## Next Steps

1. **Create Dashboards:**
   - `/buyer/dashboard`
   - `/ambassador/dashboard`
   - `/leader/dashboard`
   - `/admin/dashboard`

2. **Set Up Cloud Functions:**
   - User role assignment on signup
   - Referral code validation
   - Commission calculations

3. **Configure Security Rules:**
   ```
   Firestore rules restricting access by role
   ```

4. **Email Verification:**
   - Send verification emails on signup
   - Require verification before certain actions

5. **Password Reset:**
   - Forgot password page
   - Email-based reset flow

## Documentation

- Full API docs: See `FIREBASE_AUTH_IMPLEMENTATION.md`
- Component details: Check JSDoc comments in source files
- Type definitions: See `src/types/index.ts`

## Production Checklist

- [ ] Firebase project created and configured
- [ ] All env vars set in production
- [ ] Firestore security rules configured
- [ ] Email verification enabled
- [ ] Password reset flow working
- [ ] Rate limiting enabled on auth endpoints
- [ ] HTTPS enforced
- [ ] CORS configured properly
- [ ] User audit logging enabled
- [ ] Backup and recovery plan in place

## Support

For detailed documentation, see:
1. `FIREBASE_AUTH_IMPLEMENTATION.md` - Complete guide
2. `.env.example` - Environment setup
3. JSDoc comments in source files
4. Type definitions in `src/types/index.ts`
