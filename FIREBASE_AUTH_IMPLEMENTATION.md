# Firebase Authentication & Role-Based Access System - Implementation Guide

## Overview

Complete Firebase authentication and role-based access control (RBAC) system for FameBar OS has been implemented. This system provides:

- Client-side Firebase configuration with environment variable support
- Server-side Firebase Admin SDK for backend operations
- Comprehensive auth helper functions (signup, signin, signout, token management)
- React Context-based authentication provider
- Custom hooks for auth state management and role-based routing
- Next.js middleware for route protection
- Production-quality login and registration pages with Tailwind CSS styling
- Full TypeScript support throughout

## File Structure

```
src/
├── lib/firebase/
│   ├── config.ts          # Client-side Firebase config
│   ├── admin.ts           # Server-side Admin SDK
│   └── auth.ts            # Auth helper functions
├── context/
│   └── AuthContext.tsx    # Auth context provider
├── hooks/
│   ├── useAuth.ts         # Auth context hook
│   └── useRole.ts         # Role-based routing hook
├── middleware.ts          # Route protection middleware
├── app/
│   ├── layout.tsx         # Updated with AuthProvider
│   └── (auth)/
│       ├── login/
│       │   └── page.tsx   # Login page
│       └── register/
│           └── page.tsx   # Register page
└── types/
    └── index.ts           # (existing types)
```

## Environment Variables

Set these in your `.env.local` file:

```env
# Firebase Client Configuration (public - safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Server Configuration (secret - never expose)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

## Core Components

### 1. Firebase Config (`src/lib/firebase/config.ts`)

Initializes Firebase client with environment variables. Provides singleton instances of:
- `auth` - Firebase Authentication
- `db` - Cloud Firestore
- Default app export

**Usage:**
```typescript
import { auth, db } from '@/lib/firebase/config';
```

### 2. Firebase Admin SDK (`src/lib/firebase/admin.ts`)

Server-side initialization with helper functions for:
- Setting custom claims on users
- Verifying ID tokens
- Managing Firestore documents
- User management operations

**Usage (API routes only):**
```typescript
import { adminAuth, adminDb, setCustomClaims } from '@/lib/firebase/admin';

// Server component or API route
await setCustomClaims(uid, { role: 'ambassador' });
```

### 3. Auth Helpers (`src/lib/firebase/auth.ts`)

Client-side authentication functions:

**Sign Up:**
```typescript
import { signUpWithEmail } from '@/lib/firebase/auth';

await signUpWithEmail({
  email: 'user@example.com',
  password: 'Password123',
  firstName: 'John',
  lastName: 'Doe',
  role: 'buyer',
  referralCode: 'optional-code',
});
```

**Sign In:**
```typescript
import { signInWithEmail } from '@/lib/firebase/auth';

await signInWithEmail('user@example.com', 'Password123');
```

**Get User Profile:**
```typescript
import { getUserProfile } from '@/lib/firebase/auth';

const profile = await getUserProfile(userId, 'buyer');
```

**Get Token with Claims:**
```typescript
import { getIdTokenWithClaims } from '@/lib/firebase/auth';

const tokenResult = await getIdTokenWithClaims();
console.log(tokenResult.claims.role); // 'buyer', 'ambassador', 'leader', or 'admin'
```

### 4. Auth Context (`src/context/AuthContext.tsx`)

React Context provider that manages:
- Current Firebase user
- User profile from Firestore
- User role
- Loading state
- Role helpers (isBuyer, isAmbassador, isLeader, isAdmin)

**Wrap your app in the provider:**
```typescript
// Already done in src/app/layout.tsx
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### 5. useAuth Hook (`src/hooks/useAuth.ts`)

Access auth context from any component:

```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function MyComponent() {
  const {
    user,              // Firebase user object or null
    userProfile,       // Full user profile from Firestore
    role,              // 'buyer' | 'ambassador' | 'leader' | 'admin'
    loading,           // true while auth state is loading
    isAuthenticated,   // boolean
    isBuyer,           // boolean
    isAmbassador,      // boolean
    isLeader,          // boolean
    isAdmin,           // boolean
    error,             // error message or null
    clearError,        // () => void
  } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {userProfile?.firstName}!</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

### 6. useRole Hook (`src/hooks/useRole.ts`)

Role-based routing helpers:

```typescript
'use client';

import { useRole, useCanAccess, useDashboardPath } from '@/hooks/useRole';

export default function MyComponent() {
  const { dashboardPath, availableRoutes, role } = useRole();
  const canAccess = useCanAccess('/ambassador/team');
  const dashPath = useDashboardPath();

  return <div>Dashboard: {dashPath}</div>;
}
```

### 7. Next.js Middleware (`src/middleware.ts`)

Automatically protects all routes based on:
- Authentication status
- User role
- Route permissions

Routes are protected by role:
- **Public:** `/`, `/login`, `/register`, `/public/*`
- **Buyer:** `/buyer/*` (accessible by buyer, ambassador, leader, admin)
- **Ambassador:** `/ambassador/*` (accessible by ambassador, leader, admin)
- **Leader:** `/leader/*` (accessible by leader, admin)
- **Admin:** `/admin/*` (accessible by admin only)

Middleware automatically:
1. Redirects unauthenticated users to `/login`
2. Redirects users with wrong role to their dashboard
3. Verifies ID tokens

### 8. Login Page (`src/app/(auth)/login/page.tsx`)

Features:
- Email/password form
- Form validation
- Password visibility toggle
- Tailwind dark premium styling (black/gold/emerald)
- Role-appropriate redirect after login
- Error handling with user-friendly messages

### 9. Register Page (`src/app/(auth)/register/page.tsx`)

Features:
- Email, password, name fields
- Role selection (buyer vs ambassador)
- Optional referral code field (auto-filled from URL param `?ref=code`)
- 21+ age verification checkbox
- Terms of Service acceptance
- Password strength validation
- Confirm password matching
- Premium dark theme styling

## Firestore Database Structure

The system creates user documents in role-specific collections:

### Buyers Collection (`/buyers/{userId}`)
```typescript
{
  userId: string;
  email: string;
  role: 'buyer';
  firstName: string;
  lastName: string;
  referredBy?: string;        // Ambassador ID
  fameBalance: number;
  holdToSaveTier: 0 | 5 | 10 | 15 | 20;
  totalOrders: number;
  ageVerified: boolean;
  ageVerificationDate?: string;
  totalSpending: number;
  createdAt: string;
  updatedAt: string;
}
```

### Ambassadors Collection (`/ambassadors/{userId}`)
```typescript
{
  userId: string;
  email: string;
  role: 'ambassador';
  firstName: string;
  lastName: string;
  sponsorId?: string;         // Recruiting ambassador ID
  referralCode: string;       // Primary referral code
  tier: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  isFounder: boolean;
  founderStartDate?: string;
  activeStatus: boolean;
  personalSalesThisMonth: number;
  totalSales: number;
  totalRecruits: number;
  campaignTags: string[];
  eventTags: string[];
  preferredMessageCategories: string[];
  createdAt: string;
  updatedAt: string;
}
```

## Firebase Custom Claims

Custom claims are set on Firebase auth user tokens to indicate role:

```typescript
{
  role: 'buyer' | 'ambassador' | 'leader' | 'admin'
}
```

Set via Admin SDK in API routes or Cloud Functions:

```typescript
import { setCustomClaims } from '@/lib/firebase/admin';

// In API route
await setCustomClaims(userId, { role: 'ambassador' });
```

Read from client via:

```typescript
const { claims } = await getIdTokenWithClaims();
console.log(claims.role);
```

## Usage Examples

### Protected Component

```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';

export default function AmbassadorOnly() {
  const { isAmbassador, isLeader, isAdmin, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  // Redirect if not ambassador or above
  if (!isAmbassador && !isLeader && !isAdmin) {
    redirect('/buyer/dashboard');
  }

  return <div>Ambassador content here</div>;
}
```

### Conditional Rendering Based on Role

```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function Dashboard() {
  const { isBuyer, isAmbassador, isLeader, isAdmin } = useAuth();

  return (
    <div>
      {isBuyer && <BuyerDashboard />}
      {isAmbassador && <AmbassadorDashboard />}
      {isLeader && <LeaderDashboard />}
      {isAdmin && <AdminDashboard />}
    </div>
  );
}
```

### Route Navigation Based on Role

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useDashboardPath } from '@/hooks/useRole';

export default function LoginRedirect() {
  const router = useRouter();
  const dashboardPath = useDashboardPath();

  const handleLogin = async () => {
    // ... login logic ...
    router.push(dashboardPath);
  };

  return <button onClick={handleLogin}>Login</button>;
}
```

## API Route Protection

For API routes that need authentication:

```typescript
// app/api/my-endpoint/route.ts
import { verifyIdToken } from '@/lib/firebase/admin';

export async function GET(request: Request) {
  // Get token from Authorization header
  const token = request.headers.get('Authorization')?.split('Bearer ')[1];

  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const claims = await verifyIdToken(token);
    const userRole = claims.role;

    if (userRole !== 'ambassador') {
      return new Response('Forbidden', { status: 403 });
    }

    // Process request...
    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    return new Response('Unauthorized', { status: 401 });
  }
}
```

## Security Considerations

1. **Environment Variables:** All Firebase keys are properly scoped:
   - `NEXT_PUBLIC_*` variables are safe to expose (public keys)
   - `FIREBASE_SERVICE_ACCOUNT` is secret and never exposed

2. **Client-Server Separation:**
   - `src/lib/firebase/config.ts` - client only
   - `src/lib/firebase/admin.ts` - server only
   - Never import admin.ts in client components

3. **Token Verification:**
   - Middleware verifies ID tokens
   - API routes should verify tokens
   - Custom claims are checked for authorization

4. **Password Requirements:**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number

5. **Role-Based Access:**
   - Middleware enforces role restrictions
   - Components can conditionally render based on role
   - Redirect users to appropriate dashboards

## Next Steps

1. **Create Cloud Functions** for server-side operations:
   - Setting user role claims on signup
   - Creating referral codes
   - Processing orders and commissions
   - Settlement calculations

2. **Create Dashboard Components:**
   - `/buyer/dashboard` - Buyer home
   - `/ambassador/dashboard` - Ambassador home
   - `/leader/dashboard` - Leader home
   - `/admin/dashboard` - Admin home

3. **Implement Firestore Security Rules:**
   ```
   match /databases/{database}/documents {
     match /buyers/{userId} {
       allow read: if request.auth.uid == userId;
       allow write: if request.auth.uid == userId && 
                       request.auth.token.role in ['buyer', 'ambassador', 'leader', 'admin'];
     }
     match /ambassadors/{userId} {
       allow read: if request.auth.uid == userId ||
                      request.auth.token.role in ['leader', 'admin'];
       allow write: if request.auth.uid == userId;
     }
     match /users/{userId} {
       allow read: if request.auth.uid == userId;
       allow write: if request.auth.uid == userId;
     }
   }
   ```

4. **Set Up Email Verification:**
   - Send verification emails on signup
   - Require verification before certain operations

5. **Create Password Reset Flow:**
   - Forgot password page
   - Email verification
   - Password reset form

6. **Implement Audit Logging:**
   - Log all authentication events
   - Log permission-based access
   - Track suspicious activities

## Testing

Test the authentication system:

1. **Signup Flow:**
   - Go to `/register`
   - Fill in form with buyer role
   - Verify redirect to buyer dashboard

2. **Login Flow:**
   - Go to `/login`
   - Use previously created account
   - Verify redirect to correct dashboard

3. **Route Protection:**
   - Try accessing `/ambassador/dashboard` as buyer
   - Should redirect to `/buyer/dashboard`

4. **Role Detection:**
   - Check `useAuth()` hook values
   - Verify role-specific UI renders

## Troubleshooting

**"Firebase Service Account env var not set"**
- Ensure `FIREBASE_SERVICE_ACCOUNT` is set in `.env.local`
- Should be a JSON string of your service account key

**"Missing required Firebase environment variables"**
- Ensure all `NEXT_PUBLIC_FIREBASE_*` vars are set
- Check `NEXT_PUBLIC_FIREBASE_PROJECT_ID` matches your Firebase project

**Middleware not protecting routes**
- Check that middleware.ts is in root of `src/`
- Verify `config.matcher` is set correctly
- Check browser console for token verification errors

**Auth context returns null**
- Verify component is wrapped in `<AuthProvider>`
- Check that component is marked with `'use client'`
- Ensure auth state has finished loading

## Production Checklist

- [ ] All environment variables set in production
- [ ] Firebase Security Rules configured
- [ ] Email verification enabled
- [ ] Password reset flow implemented
- [ ] Rate limiting on login/signup endpoints
- [ ] Audit logging enabled
- [ ] HTTPS enforced
- [ ] CSP headers configured
- [ ] CORS properly configured
- [ ] User role claims set via Cloud Functions
- [ ] Referral code validation implemented
- [ ] Age verification flow complete

## Support & Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/database/admin/start)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [React Context API](https://react.dev/reference/react/useContext)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/)
