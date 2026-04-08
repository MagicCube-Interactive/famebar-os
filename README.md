# FameBar OS

A direct-selling platform with Firebase backend for managing buyers, ambassadors, leaders, and administrators.

## Project Structure

```
famebar-os/
├── src/
│   ├── app/
│   │   ├── (public)/          # Public pages (landing, program explainer, FAQ)
│   │   ├── (auth)/            # Login, register, age verification
│   │   ├── buyer/             # Buyer portal
│   │   ├── ambassador/        # Ambassador portal
│   │   ├── leader/            # Leader portal
│   │   ├── admin/             # Admin portal
│   │   ├── api/               # API routes
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   │
│   ├── components/
│   │   ├── ui/                # Reusable UI components (buttons, cards, badges, progress rings)
│   │   ├── buyer/             # Buyer-specific components
│   │   ├── ambassador/        # Ambassador-specific components
│   │   ├── leader/            # Leader-specific components
│   │   ├── admin/             # Admin-specific components
│   │   └── shared/            # Cross-role shared components (NBA engine, earnings cards)
│   │
│   ├── lib/
│   │   ├── firebase/          # Firebase config, admin SDK, auth helpers
│   │   ├── commission/        # Commission math engine
│   │   ├── tokens/            # $FAME token logic
│   │   ├── referral/          # Referral attribution logic
│   │   ├── nba/               # Next Best Action engine
│   │   └── compliance/        # Age verification, FTC compliance helpers
│   │
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript type definitions
│   ├── context/               # React context providers (auth, role, theme)
│   └── utils/                 # Utility functions
│
├── functions/                 # Cloud Functions for Firebase (server-side business logic)
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.json
└── .gitignore
```

## Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project

### Installation

```bash
cd famebar-os
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

FIREBASE_ADMIN_SDK_KEY=your_admin_key
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

### Build

```bash
npm run build
npm start
```

## Key Features

### Multi-Role Support
- **Buyers**: Purchase products
- **Ambassadors**: Sell products, earn commissions
- **Leaders**: Manage teams, earn leadership bonuses
- **Admins**: Platform management

### Core Systems
- Firebase authentication and Firestore database
- Commission and royalty calculations
- Referral attribution and network building
- Next Best Action (NBA) engine for personalized recommendations
- Age verification and FTC compliance
- $FAME token system for rewards
- QR code generation for product tracking

### Styling
- Tailwind CSS for utility-first styling
- Custom color palette with primary, secondary, accent, and status colors
- Responsive design

## Dependencies

### Core
- `next` - React framework
- `react` & `react-dom` - UI library
- `typescript` - Type safety

### Firebase
- `firebase` - Client SDK
- `firebase-admin` - Admin SDK
- `firebase-functions` - Cloud Functions

### Utilities
- `uuid` - Unique ID generation
- `qrcode` - QR code generation
- `react-icons` - Icon library
- `recharts` - Data visualization

### Styling
- `tailwindcss` - Utility-first CSS framework
- `autoprefixer` - CSS vendor prefixing

## Development Guidelines

### File Structure Best Practices
- Keep components focused and single-responsibility
- Use TypeScript for type safety
- Organize utilities and helpers in lib/
- Use React context for shared state
- Implement custom hooks for reusable logic

### Component Naming
- UI components in `components/ui/`
- Role-specific components in respective folders
- Shared components in `components/shared/`

### Type Definitions
- Define all types in `src/types/`
- Use `.ts` for type-only files
- Use `.tsx` for React components

## License

Proprietary
