# FishX

A fishing-first social platform with optional dating features for anglers 18+.

## Features

### Dating
- Swipe-based profile discovery
- Real-time messaging with typing indicators and read receipts
- Match notifications
- Profile customization

### Fishing
- Trip planning with Mapbox integration
- Fishing spot discovery and saving
- Catch logging
- Fishing buddy system with separate messaging

### Account Modes
- **Dating Only** - Focus on finding romantic connections
- **Fishing Only** - Connect with fishing buddies and plan trips
- **Both** - Full access to dating and fishing features

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Database, Real-time, Storage, Edge Functions)
- **Maps**: Mapbox GL JS
- **State Management**: TanStack Query
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd find-fishing-dates

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Structure

```
src/
├── assets/          # Images and static assets
├── components/      # Reusable UI components
│   ├── buddies/     # Fishing buddy components
│   ├── chat/        # Messaging components
│   ├── discover/    # Dating discovery components
│   ├── layout/      # Layout components (headers, nav)
│   ├── matches/     # Match-related components
│   ├── onboarding/  # Onboarding flow components
│   ├── trips/       # Trip planning components
│   └── ui/          # shadcn/ui components
├── contexts/        # React contexts
├── hooks/           # Custom React hooks
├── integrations/    # Third-party integrations
├── lib/             # Utility functions
└── pages/           # Page components
    └── app/         # Authenticated app pages
```

## License

MIT
