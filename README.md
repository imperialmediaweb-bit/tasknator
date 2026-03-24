# Tasknator

**AI-powered business diagnostic & recovery platform for SMBs and agencies.**

Tasknator scans websites, SEO, social presence, reviews, and offers — then delivers a prioritized repair plan with ready-to-use marketing assets. Think of it as a business doctor: diagnose, prescribe, and fix.

## Features

- **AI Business Audit** — Deep scan of website, SEO, social media, offers, and reputation with a clear scorecard
- **30/60/90 Day Repair Plan** — Prioritized recovery roadmap with actionable tasks sorted by impact
- **Ready-to-Use Assets** — Landing copy, ad scripts, email sequences, review replies — generated and editable
- **Sales Doctor** — Redesign offers with Basic/Standard/Premium packages and proven sales scripts
- **Reputation Fixer** — Review analysis, professional reply generation, and review-request campaigns
- **Ads & SEO Repair** — Meta ads, Google ads, keyword lists, and article ideas tailored to each business
- **PDF & ZIP Exports** — White-label export support for agencies
- **Team Collaboration** — Multi-member workspaces with role-based access (Owner, Admin, Member, Viewer)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (Google OAuth + credentials) |
| AI Providers | OpenAI, Anthropic Claude, Google Gemini (configurable per workspace) |
| Payments | Stripe + PayPal |
| Queue | BullMQ + Redis |
| Storage | S3-compatible (Cloudflare R2) |
| Email | SMTP (Mailgun / any provider) + Resend |
| UI | Tailwind CSS + Radix UI + Lucide icons |
| Monitoring | Sentry |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis instance
- At least one AI API key (OpenAI, Anthropic, or Google Gemini)

### Installation

```bash
# Clone the repository
git clone <repo-url> && cd tasknator

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Set up the database
npx prisma migrate dev

# Seed initial data (optional)
npm run db:seed

# Start the development server
npm run dev
```

### Environment Variables

Copy `.env.example` and fill in the required values:

- **Database**: `DATABASE_URL` — PostgreSQL connection string
- **Auth**: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, Google OAuth credentials
- **AI**: At least one of `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`
- **Payments**: Stripe keys + webhook secret (optional: PayPal)
- **Storage**: S3-compatible credentials for file exports
- **Email**: SMTP credentials for transactional emails

### Running the Worker

Background jobs (audits, asset generation) are processed by BullMQ:

```bash
npm run worker
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, register, password reset
│   ├── (dashboard)/     # Main app — dashboard, audits, plans, assets, billing
│   ├── admin/           # Admin panel
│   ├── api/             # API routes
│   ├── blog/            # Blog pages
│   └── pricing/         # Pricing page
├── components/          # Reusable UI components
├── lib/
│   ├── ai/              # AI provider abstraction (OpenAI, Claude, Gemini)
│   ├── jobs/            # BullMQ workers and job definitions
│   └── ...              # Auth, DB, email, encryption, branding utilities
└── prisma/
    └── schema.prisma    # Database schema
```

## Pricing Tiers

| Plan | Price | Businesses | Audits/mo | Key Features |
|------|-------|-----------|-----------|--------------|
| Starter | $9/mo | 1 | 1 | Website Fixer, Sales Doctor |
| Pro | $29/mo | 3 | 10 | All modules, PDF/ZIP exports |
| Agency | $79/mo | 25 | 100 | White-label, team members (25) |

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
npm run worker     # Start background job worker
npm run db:push    # Push schema to database
npm run db:migrate # Run database migrations
npm run db:seed    # Seed database
```

## Deployment

Optimized for deployment on Vercel (frontend) with an external PostgreSQL database and Redis instance. The BullMQ worker runs as a separate process.

1. Deploy the Next.js app to Vercel
2. Set all environment variables in the Vercel dashboard
3. Run `npx prisma migrate deploy` against your production database
4. Deploy the worker process on a VPS or container service

## License

Proprietary. All rights reserved.
