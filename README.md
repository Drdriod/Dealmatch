# DealMatch 🏡

> Nigeria's first dating-app style real estate platform. Swipe, match, and connect with your perfect property deal.

**Live:** [dealmatch-yvdm.vercel.app](https://dealmatch-yvdm.vercel.app)  
**GitHub:** [github.com/Drdriod/Dealmatch](https://github.com/Drdriod/Dealmatch)  
**Built by:** Divine Bassey, Uyo, Akwa Ibom, Nigeria

> *Every match is a connection, every connection is a home ❤️*

---

## What is DealMatch?

DealMatch is a full-stack real estate and hospitality platform for Nigeria. It combines the swipe mechanic of dating apps with AI-powered property matching, connecting buyers with properties, renters with landlords, guests with hotels, and property professionals with motivated clients.

---

## Platform Features

### 🏡 Property Sales
- Buyers set preferences (budget, location, type, goals) during onboarding
- AI matches them to listings using Pinecone vector search
- Swipe to like, pass, or super-like properties
- Properties show photos, video tours, features, and documents
- Sellers list properties in 5 steps: type → location → details → photos/video → description

### 🔑 Rentals & Short-lets
- Grid view and swipe view
- Filter by Rental or Short-let, by state, by property type
- Interest form: tenant details sent directly to landlord via WhatsApp
- Landlords list in 6 steps with photo and video upload

### 🏨 Hotels & Lodging
- Browse hotels with filter by type (Luxury, Budget, Resort, Short-let, Boutique) and state
- Full booking modal: dates, guests, rooms, real-time price calculator
- Booking confirmation saved to database and notified via WhatsApp

### 💼 For Professionals (Swipe & Request In-App)
- Swipe left/right through verified professionals (no WhatsApp redirect)
- Full profile cards: avatar, rating, verified badge, years of experience, coverage areas, bio
- In-app contact request form: saved to `professional_requests` table, professional notified
- Star ratings and review counts displayed per professional
- List view and swipe view modes

### 🔒 Escrow Protection
- Pay rent / property deposit through DealMatch
- Funds held until tenant confirms move-in
- Paystack (NGN) + USDT/USDC crypto payment options
- 3% platform facilitation fee

### 🏦 Mortgage & Lenders
- Buyers submit mortgage applications with property and financial details
- Verified lenders review, respond, and manage applications in their dashboard
- Role-based access: only lenders and admins can view applications

### 🎓 Student Hostels
- Browse student accommodation near Nigerian universities
- Filter by institution, price range, room type
- Student identity verification flow

---

## Platform Fees

| Transaction | Fee |
|-------------|-----|
| Property Sale | 1.5% of final sale price |
| Annual Rental | 3% of first year total rent |
| Short-let Booking | 8% per confirmed booking |
| Hotel Booking | 8% per confirmed booking |
| Professional Subscription | Flat ₦25k–₦75k/month |
| Escrow Facilitation | 3% |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS + Framer Motion |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Cache / Rate limiting | Upstash Redis |
| AI Matching | Pinecone (vector embeddings) |
| Payments | Paystack (NGN) + USDT/USDC crypto |
| Maps | Google Maps API + Places API |
| Analytics | PostHog |
| Error tracking | Sentry (with ErrorBoundary) |
| Email | Supabase Auth (built-in service) |
| Hosting | Vercel |
| CDN / DNS / SSL | Cloudflare |
| Version Control | GitHub |

---

## Security

- **Input sanitization** : XSS prevention on all user inputs (`src/lib/security.js`)
- **Server-side rate limiting** : Upstash Redis, per-IP, sliding window on all API routes
- **Client-side rate limiting** : prevents spam form submissions
- **File validation** : type + size checked before any upload
- **CSP headers** : Content Security Policy in `vercel.json`
- **HSTS** : Strict-Transport-Security with preload
- **Parameterized queries** : Supabase handles all DB interactions; no raw SQL from client
- **CORS** : API routes locked to app domain only using `VITE_APP_URL`
- **RLS** : Row Level Security enforced on every Supabase table
- **Sentry ErrorBoundary** : all crashes caught, notified, user shown clean error screen
- **Auth tokens** : never exposed in client logs or error reports (Sentry PII scrubbing)
- **Auth Flow** : Supabase native email confirmation — no client-side OTP vulnerabilities
- **Webhook verification** : Paystack webhooks verified via HMAC-SHA512 signature

---

## Database Tables

`profiles` · `properties` · `bookings` · `swipes` · `matches` · `professional_applications` · `professional_requests` · `professional_reviews` · `payments` · `crypto_payments` · `rental_enquiries` · `room_categories` · `deal_agreements` · `escrow_transactions`

---

## Database Setup

Run SQL files in `/db` folder in this order:
1. `supabase-schema.sql`
2. `professional-schema.sql`
3. `agreements-schema.sql`
4. `availability-schema.sql`
5. `crypto-schema.sql`
6. `storage-setup.sql`
7. `professionals-ratings.sql`
8. `rental-enquiries.sql`

---

## Environment Variables

See `.env.example` for all variables. Add to Vercel → Project Settings → Environment Variables.

**Client-safe** (prefix `VITE_`): SUPABASE_URL, SUPABASE_ANON_KEY, PAYSTACK_PUBLIC_KEY, GOOGLE_MAPS_API_KEY, SENTRY_DSN, POSTHOG_KEY  
**Server-only** (no `VITE_` prefix): PAYSTACK_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY, PINECONE_API_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

---

## Local Development

```bash
npm install
cp .env.example .env.local
# Fill in your keys
npm run dev
```

---

## Deployment

**Vercel (primary):**
- Connect GitHub repo to Vercel
- Add environment variables
- Deploys automatically on push to `main`

Vite config auto-detects environment:
```js
base: process.env.GITHUB_ACTIONS ? '/Dealmatch/' : '/'
```

---

## Revenue Model

| Stream | How |
|--------|-----|
| Property sale fee | 1.5% on close |
| Rental fee | 3% first year |
| Short-let fee | 8% per booking |
| Hotel fee | 8% per booking |
| Professional subscriptions | ₦25k–₦75k/month |
| Escrow facilitation | 3% per escrow transaction |

---

## Contact

**Divine Bassey**  
Founder & CEO: DealMatch  
📍 Uyo, Akwa Ibom, Nigeria  
📱 WhatsApp: +234 705 739 2060  
 X: [@dvbcruise001](https://x.com/dvbcruise001)

---

*Built with ❤️ for the Nigerian property market.*  
*Every match is a connection, every connection is a home.*
