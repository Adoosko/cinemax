# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

CinemaX is a **premium Netflix-style movie streaming platform** built as a sophisticated full-stack web application. Originally conceived as a cinema booking system, it has evolved into a comprehensive streaming platform that showcases modern web development excellence and rivals industry-leading platforms.

## Essential Commands

### Development

```bash
# Start Next.js dev server with Turbopack
bun run dev

# Start WebSocket server for real-time features (watch parties, live updates)
bun run websocket

# Start both Next.js and WebSocket servers concurrently
bun run dev:full

# Production build
bun run build

# Start production server
bun run start
```

### Database & Seeding

```bash
# Seed database with movies, users, and streaming content
bun run seed

# Generate Prisma client after schema changes
bunx prisma generate

# Reset database and re-run migrations
bunx prisma migrate reset

# View database in Prisma Studio
bunx prisma studio
```

### Testing & Quality

```bash
# Run ESLint
bun run lint

# Type checking
bunx tsc --noEmit
```

## Architecture Overview

### Core System Design

CinemaX is a **dual-server streaming platform** built with Next.js 15 (App Router) and real-time WebSocket functionality:

1. **Primary Server** (port 3000): Next.js application handling streaming UI, API routes, and business logic
2. **WebSocket Server** (port 3001): Real-time features for watch parties, live updates, and user interactions

### Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4, Framer Motion
- **Backend**: Prisma ORM with PostgreSQL
- **Authentication**: Better Auth with magic link authentication (passwordless)
- **Payments**: Stripe integration
- **Real-time**: Socket.IO for live seat booking
- **Runtime**: Bun (package manager and runtime)

### Database Architecture

The system uses PostgreSQL with a comprehensive schema covering:

- **Better Auth Models**: User, Session, Account, Verification
- **Cinema Management**: Cinema → Theater → Seat (hierarchical structure)
- **Movie System**: Movie catalog with TMDB integration
- **Booking Engine**: Showtime → Booking → BookingSeat (with temporary reservations)
- **Payment System**: Stripe payment processing and tracking
- **Reviews & Surveys**: Customer feedback system

### Key Features & Components

#### Real-Time Seat Booking System

- **WebSocket Server** (`src/lib/websocket-server.ts`): Handles live seat reservations with 10-minute expiration
- **Temporary Reservations**: Prevents double-booking during the selection process
- **User Presence**: Tracks active users per showtime
- **Grace Period**: 30-second reconnection window before releasing seats

#### Authentication System

- **Magic Link Only**: Passwordless authentication using Better Auth
- **Role-Based Access**: Customer, admin, manager roles
- **Session Management**: 7-day sessions with daily refresh

#### Booking Flow Architecture

1. **Movie Selection** → **Showtime Selection** → **Seat Selection** (with real-time updates)
2. **Temporary Reservation** (10 minutes) → **Payment** → **Confirmation**
3. **QR Code Generation** for ticket validation

### File Structure Patterns

```
src/
├── app/                     # Next.js App Router pages
│   ├── (auth)/             # Auth-protected routes
│   ├── movies/             # Movie listings and details
│   ├── showtimes/          # Showtime selection
│   └── bookings/           # Booking management
├── lib/                    # Business logic and utilities
│   ├── auth.ts             # Better Auth configuration
│   ├── db.ts               # Prisma client setup
│   ├── websocket-server.ts # Real-time seat booking server
│   ├── *-service.ts        # Business logic services
│   └── stripe.ts           # Payment processing
└── types/                  # TypeScript type definitions
    ├── index.ts            # Prisma-generated complex types
    ├── auth.ts             # Authentication types
    └── booking.ts          # Booking-related types
```

### External Service Integrations

- **TMDB API**: Movie metadata and images
- **Stripe**: Payment processing and subscriptions
- **Resend**: Email notifications (magic links, booking confirmations)
- **Cloudinary & AWS S3**: Image hosting and management

## Development Guidelines

### Database Operations

- Use Prisma's generated types from `src/types/index.ts` for complex relations
- Always include relevant relations when fetching data (see existing type definitions)
- Handle booking race conditions using temporary reservations

### Real-Time Features

- WebSocket server must run alongside Next.js for seat booking functionality
- All seat operations should emit real-time updates to connected clients
- Implement proper error handling for disconnection scenarios

### Authentication Patterns

- All authentication flows use magic links (no passwords)
- Check user roles for admin/manager features
- Sessions are automatically managed by Better Auth

### Payment Integration

- Use Stripe Payment Intents for secure payment processing
- Store payment metadata in the database for reconciliation
- Generate QR codes for confirmed bookings

### TypeScript Conventions

- Leverage Prisma's generated types extensively
- Define complex relations in `src/types/index.ts`
- Use proper typing for WebSocket events and API responses

## Environment Requirements

- **DATABASE_URL**: PostgreSQL connection string
- **STRIPE_SECRET_KEY** & **STRIPE_PUBLISHABLE_KEY**: Stripe API credentials
- **BETTER_AUTH_SECRET**: Session encryption secret
- **RESEND_API_KEY**: Email service API key
- **TMDB_API_KEY**: Movie database API key

## Testing Considerations

- Test both servers running simultaneously for booking flows
- Mock WebSocket connections for seat booking tests
- Use test Stripe keys for payment testing
- Database seeding creates realistic test data with movies and showtimes
