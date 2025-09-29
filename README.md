# 🎬 CINEMX - Premium Movie Streaming Platform

CINEMX is a modern, full-featured movie streaming platform built with cutting-edge web technologies. Experience cinema-quality streaming with 4K Ultra HD, real-time watch parties, AI-generated trailers, and seamless subscription management.

## 🌟 Features

### 🎥 Streaming & Playback

- **4K Ultra HD Streaming** - Premium quality video playback
- **Adaptive Bitrate** - Automatic quality adjustment based on connection
- **Real-time Progress Tracking** - Resume where you left off
- **Watch History** - Complete viewing analytics

### 👥 Social Features

- **Watch Parties** - Synchronized viewing with friends (up to 5 guests)
- **Real-time Chat** - Interactive discussions during movies
- **Movie Reviews & Ratings** - Community feedback system

### 🤖 AI-Powered

- **AI Trailers** - OpenAI-generated promotional videos
- **Smart Recommendations** - Personalized movie suggestions
- **Content Analysis** - Automated movie metadata extraction

### 💳 Subscription & Billing

- **Flexible Plans** - Monthly ($3) and Yearly ($25) subscriptions
- **Free Tier** - 2 movies/month with ads
- **Polar Integration** - Secure payment processing
- **Usage Limits** - Fair usage tracking and enforcement

### 🎨 User Experience

- **Dark Theme** - Cinema-inspired design
- **Responsive Design** - Works on all devices
- **Intuitive Navigation** - Seamless movie discovery
- **Admin Dashboard** - Content management tools

## 🚀 Tech Stack

### Frontend

- **Next.js 15 canary** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Shadcn UI** - Accessible component library

### Backend & Database

- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Robust relational database
- **Better Auth** - Authentication & authorization
- **Next.js API Routes** - Serverless API endpoints

### External Services

- **Polar.sh** - Payment processing/subscription management
- **AWS S3** - File storage & CDN
- **OpenAI** - AI trailer generation
- **ElevenLabs** - AI voice for trailers
- **Resend** - Email notifications

### Real-time Features

- **Socket.IO** - Real-time communication
- **WebSockets** - Live watch party synchronization

## 📋 Prerequisites

- **Node.js** 18+ or **Bun** runtime
- **PostgreSQL** database
- **AWS S3** bucket (for file storage)
- **Stripe** account (for payments)
- **OpenAI** API key (for AI features)

## 🛠️ Installation & Setup

### 1. Clone the Repository

### 2. Install Dependencies

```bash
bun install
```

````bun husky init


### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/CINEMX"

# Authentication
BETTER_AUTH_SECRET="your-secret-key"
NEXT_PUBLIC_BETTER_AUTH_URL="https://cinemx.adrianfinik.sk"

# AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
NEXT_PUBLIC_AWS_S3_BUCKET_NAME="your-bucket-name"
NEXT_PUBLIC_AWS_REGION="us-east-1"


#ElevenLabs
ELEVENLABS_API_KEY="elevenlabs_..."

# OpenAI
OPENAI_API_KEY="sk-..."

# Email (Resend)
RESEND_API_KEY="re_..."

# Polar.sh (for subscriptions)
POLAR_ACCESS_TOKEN="polar_..."
````

### 4. Database Setup

````bash
# Generate Prisma client
bunx prisma generate

# Run database migrations
bunx prisma db push


### 5. Start Development Server

```bash
# Start Next.js development server
bun run dev

# For full development (with WebSocket server)
bun run dev:full
````

## 🎭 Key Features Overview

### Movie Streaming

- 4K Ultra HD streaming with adaptive bitrate
- Progress tracking and resume functionality
- Watch history and analytics

### Watch Parties

- Create watch parties for synchronized viewing
- Real-time chat during movies
- Invite up to 5 guests (no signup required)
- Share movie recommendations

### AI Trailers

- OpenAI-powered trailer generation
- Automatic script writing and voice synthesis
- Stored in AWS S3 with CDN delivery

### Subscription Management

- Free tier: 2 movies/month with ads
- Premium: Unlimited movies, no ads
- Stripe-powered billing
- Usage limit enforcement

### Admin Features

- Movie catalog management
- User administration
- Content moderation tools

### Code Standards

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Husky for pre-commit hooks
