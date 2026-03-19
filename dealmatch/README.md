# DealMatch 🏡❤️
**Nigeria's real estate matching platform — find your perfect property like finding love.**

---

## What's Inside

DealMatch is a full-stack real estate platform where buyers swipe on AI-matched properties, and professionals (surveyors, inspectors, lenders) pay to be matched with motivated buyers.

### V2 Features Added
- ✅ **Google Maps** — property location map with nearby schools, hospitals, banks, shopping
- ✅ **Map Explorer** — browse all listings on an interactive Nigeria map  
- ✅ **Location Autocomplete** — Google Places search with Nigerian address suggestions
- ✅ **Framer Motion animations** — scroll-reveal, stagger, float, slide effects throughout
- ✅ **Animated stat counters** — numbers count up when scrolled into view
- ✅ **Image carousel** — swipeable property photo gallery with lightbox
- ✅ **Search palette** — Cmd+K global search with keyboard navigation
- ✅ **WhatsApp button** — floating contact button with bounce animation
- ✅ **Dark mode** — toggle with persistence via localStorage
- ✅ **Match toast** — dating-style "It's a Match!" notification
- ✅ **Video demo modal** — hero section watch demo button
- ✅ **City browse cards** — Lagos, Abuja, Uyo, PH quick-filter
- ✅ **Trust badges section** — verified listings, AI matching, secure payments
- ✅ **Share button** — native share API with clipboard fallback
- ✅ **Seller profile card** — with WhatsApp direct contact

---

## Tech Stack

| Tool | Purpose | Free Tier |
|------|---------|-----------|
| React + Vite | Frontend | ✅ |
| Tailwind CSS | Styling | ✅ |
| Framer Motion | Animations | ✅ |
| @react-google-maps/api | Google Maps | ✅ $200/mo credit |
| Supabase | Database + Auth | ✅ 500MB |
| Pinecone | AI vector matching | ✅ 1 index |
| Paystack | Payments (NGN) | ✅ 1.5% local |
| Vercel | Hosting + API routes | ✅ |
| Cloudflare | DNS + SSL | ✅ |
| PostHog | Analytics | ✅ 1M events |
| Sentry | Error tracking | ✅ 5K errors |
| Resend | Emails | ✅ 100/day |
| GitHub | Version control | ✅ |

---

## Project Structure

```
dealmatch/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx          Navbar with search palette + dark mode
│   │   │   └── Footer.jsx
│   │   ├── maps/
│   │   │   └── PropertyMap.jsx     Google Maps (property + explorer + autocomplete)
│   │   ├── matching/
│   │   │   └── SwipeCard.jsx       Drag-to-swipe card with gestures
│   │   └── ui/
│   │       ├── AnimatedStat.jsx    CountUp stats on scroll
│   │       ├── MatchToast.jsx      Dating-style match notification
│   │       ├── PropertyCarousel.jsx Image gallery with lightbox
│   │       ├── ScrollReveal.jsx    Framer Motion scroll animations
│   │       ├── SearchPalette.jsx   Cmd+K command palette
│   │       └── WhatsAppButton.jsx  Floating WhatsApp CTA
│   ├── context/
│   │   ├── AuthContext.jsx         Supabase auth state
│   │   └── ThemeContext.jsx        Dark mode toggle
│   ├── lib/
│   │   ├── supabase.js             DB helpers (profiles, properties, swipes, matches)
│   │   ├── pinecone.js             AI matching client
│   │   ├── paystack.js             Payment plans + Paystack popup
│   │   └── posthog.js              Analytics event tracking
│   └── pages/
│       ├── Home/HomePage.jsx       Landing page (animated, map preview, cities)
│       ├── Auth/AuthPage.jsx       Sign up / sign in (all 5 roles)
│       ├── Auth/AuthCallback.jsx   OAuth redirect handler
│       ├── Onboarding/             5-step buyer preference quiz
│       ├── Browse/BrowsePage.jsx   Swipe experience with AI matching
│       ├── Matches/MatchesPage.jsx Liked properties list
│       ├── Property/PropertyPage.jsx Full detail + map + carousel + share
│       ├── Professionals/          Pro listing + Paystack payment flow
│       ├── List/ListPropertyPage.jsx 4-step seller listing form
│       ├── Dashboard/DashboardPage.jsx Buyer + seller stats dashboard
│       ├── Profile/ProfilePage.jsx User profile + preferences
│       └── Admin/AdminPage.jsx     Admin overview
├── api/
│   ├── match.js                    Vercel function — Pinecone AI matching
│   ├── index-property.js           Vercel function — index new listing
│   └── payments/verify.js          Vercel function — Paystack verification
├── supabase-schema.sql             Full DB schema — paste into SQL Editor
├── .env.example                    All environment variables documented
├── vercel.json                     Deployment config with security headers
├── tailwind.config.js              Custom colors, fonts, animations
└── package.json                    All dependencies
```

---

## Setup Guide

### Step 1 — Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/dealmatch.git
cd dealmatch
npm install
```

### Step 2 — Environment Variables
```bash
cp .env.example .env.local
# Fill in all values — see comments in .env.example
```

### Step 3 — Supabase Setup
1. Go to [supabase.com](https://supabase.com) → New Project → name it `dealmatch`
2. **SQL Editor** → paste entire `supabase-schema.sql` → Run
3. **Settings → API** → copy Project URL + anon key + service_role key
4. **Authentication → Providers** → enable Google (optional)

### Step 4 — Google Maps
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project → Enable: **Maps JavaScript API** + **Places API** + **Geocoding API**
3. Create API key → restrict to your domain
4. Add to `.env.local` as `VITE_GOOGLE_MAPS_API_KEY`

### Step 5 — Pinecone
1. [pinecone.io](https://pinecone.io) → Create index:
   - Name: `dealmatch-properties`
   - Dimensions: `1536` — Metric: `cosine`
2. Copy API key → `PINECONE_API_KEY`

### Step 6 — Paystack
1. [paystack.com](https://paystack.com) → Settings → API Keys
2. Public key → `VITE_PAYSTACK_PUBLIC_KEY`
3. Secret key → `PAYSTACK_SECRET_KEY`

### Step 7 — Resend, PostHog, Sentry
Each has a free tier — create accounts and copy API keys into `.env.local`

### Step 8 — Run locally
```bash
npm run dev
# → http://localhost:3000
```

### Step 9 — Deploy to Vercel
```bash
git add .
git commit -m "DealMatch v2 — Google Maps + modern UI"
git push origin main
```
Then import repo on [vercel.com](https://vercel.com) and add all env vars.

### Step 10 — Connect Cloudflare DNS
Point your domain to Vercel via Cloudflare — free SSL + CDN + DDoS protection.

---

## Revenue Model

| Professional | Monthly | Annual (save 20%) |
|-------------|---------|-------------------|
| Land Surveyor | ₦25,000 | ₦240,000 |
| Property Inspector | ₦35,000 | ₦336,000 |
| Mortgage Lender | ₦75,000 | ₦720,000 |

**At 10 professionals per type → ₦1.35M/month MRR**

---

## WhatsApp Number
Update the number in `src/components/ui/WhatsAppButton.jsx`:
```js
const WHATSAPP_NUMBER = '2348000000000' // Replace with yours
```

---

## Roadmap
- [ ] Real embeddings (OpenAI text-embedding-3-small)
- [ ] In-app messaging between buyers and professionals  
- [ ] LandVerify title verification integration
- [ ] Push notifications (PWA)
- [ ] Mobile app (React Native / Expo)
- [ ] Stripe for international buyers

---

Built with ❤️ by DealMatch · Powered by Supabase + Pinecone + Paystack
