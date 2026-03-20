# DealMatch 🏡

> Nigeria's first dating-app style real estate platform. Swipe, match, and connect with your perfect property deal.

**Live:** [dealmatch-yvdm.vercel.app](https://dealmatch-yvdm.vercel.app)  
**GitHub:** [github.com/Drdriod/Dealmatch](https://github.com/Drdriod/Dealmatch)  
**Built by:** Divine Bassey, Uyo, Akwa Ibom, Nigeria

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
- Sellers list properties in 5 steps — type → location → details → photos/video → description
- Commission agreement built into every listing (1.5% on sale)

### 🔑 Rentals & Short-lets
- Browse rentals in grid view or swipe view
- Filter by For Rent or Short-let
- Interest form connects renter to landlord via WhatsApp
- Landlords list in 6 steps with photo and video upload
- Commission: 3% annual rental, 8% short-let per booking

### 🏨 Hotels & Lodging
- Browse hotels with filter by Luxury, Budget, Resort
- Full booking modal — dates, guests, rooms, price calculator
- Booking confirmation sent via WhatsApp
- Hotels list directly on the platform
- Commission: 8% per confirmed booking

### 👤 User Roles
| Role | Experience |
|------|-----------|
| Buyer | Full onboarding, AI swipe matching, matches dashboard |
| Seller / Developer | List properties for sale, manage listings |
| Land Surveyor | Professional listing, matched to land buyers |
| Property Inspector | Professional listing, matched to all buyers |
| Mortgage Lender | Professional listing, matched to financing seekers |

### 💼 For Professionals
- Surveyors: ₦25,000/month
- Property Inspectors: ₦35,000/month
- Mortgage Lenders: ₦75,000/month
- Flat fee — no commission on professional subscribers
- Unlimited deal referrals from matched buyers

### 💰 Earn with DealMatch
- Refer property deals and earn commissions
- AMG business partnership opportunity — passive network income
- Referral bonus: ₦2,000 per professional subscriber referred
- Interest form sends leads directly to founder via WhatsApp

---

## Commission Structure

| Transaction | Commission |
|-------------|-----------|
| Property Sale | 1.5% of final sale price |
| Annual Rental | 3% of first year total rent |
| Short-let Booking | 8% per confirmed booking |
| Hotel Booking | 8% per confirmed booking |
| Professional Subscribers | Flat monthly fee — no commission |

Commission agreement checkbox required on all listing forms.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS + Framer Motion |
| Database | Supabase (PostgreSQL + Auth) |
| AI Matching | Pinecone (vector embeddings) |
| Payments | Paystack (NGN) |
| Maps | Google Maps API + Places API |
| Analytics | PostHog |
| Error tracking | Sentry |
| Email | Supabase Auth (custom SMTP via Resend) |
| Hosting | Vercel |
| Version Control | GitHub |

---

## Database Schema

Tables: `profiles`, `properties`, `property_images`, `swipes`, `matches`, `professionals`, `professional_applications`, `payments`

Key property columns: `category` (sale/rental/shortlet/hotel), `price_period`, `video_url`, `contact_phone`, `contact_email`, `max_guests`, `landlord_name`, `rules`, `rating`, `review_count`

---

## File Structure

```
src/
├── App.jsx                          # Routes + shell
├── index.css                        # Global styles
├── main.jsx
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx               # Buy · Rent · Hotels · Sell · For Pros · Earn
│   │   └── Footer.jsx
│   ├── maps/
│   │   └── PropertyMap.jsx          # Google Maps + nearby amenities
│   ├── matching/
│   │   └── SwipeCard.jsx            # Drag-to-swipe matching card
│   └── ui/
│       ├── AnimatedStat.jsx         # CountUp on scroll
│       ├── CommissionAgreement.jsx  # Reusable commission checkbox
│       ├── HeroBackground.jsx       # Animated canvas background
│       ├── MatchToast.jsx
│       ├── PropertyCarousel.jsx
│       ├── ScrollReveal.jsx
│       ├── SearchPalette.jsx        # Cmd+K global search
│       └── WhatsAppButton.jsx       # Floating WhatsApp CTA
├── context/
│   ├── AuthContext.jsx
│   └── ThemeContext.jsx
├── lib/
│   ├── supabase.js
│   ├── pinecone.js
│   ├── paystack.js
│   └── posthog.js
└── pages/
    ├── Admin/AdminPage.jsx
    ├── Auth/
    │   ├── AuthPage.jsx             # Signup (OTP) + Signin
    │   └── AuthCallback.jsx
    ├── Browse/BrowsePage.jsx        # AI swipe matching
    ├── Dashboard/DashboardPage.jsx
    ├── Earn/EarnPage.jsx            # AMG partnership + referral income
    ├── Home/HomePage.jsx            # Landing page
    ├── Hotels/HotelsPage.jsx        # Browse + book hotels
    ├── List/ListPropertyPage.jsx    # 5-step sale listing with photos/video
    ├── Matches/MatchesPage.jsx
    ├── Onboarding/OnboardingPage.jsx # 6-step role + preference setup
    ├── Professionals/ProfessionalsPage.jsx
    ├── Profile/ProfilePage.jsx
    ├── Property/PropertyPage.jsx    # Detail + map + share
    └── Rentals/
        ├── RentalsPage.jsx          # Browse rentals grid + swipe
        └── ListRentalPage.jsx       # 6-step rental/hotel listing
```

---

## Environment Variables

Add these to Vercel → Project Settings → Environment Variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_MAPS_API_KEY=AIza...
VITE_PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_SECRET_KEY=sk_live_...
PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX_NAME=dealmatch-properties
```

---

## Deployment

**Vercel (primary):**
- Connect GitHub repo to Vercel
- Add environment variables
- Deploys automatically on every push to `main`

**GitHub Pages (alternative):**
- GitHub Actions workflow in `.github/workflows/deploy.yml`
- Go to repo Settings → Pages → Source → GitHub Actions
- Deploys automatically on every push

Vite config auto-detects the environment:
```js
base: process.env.GITHUB_ACTIONS ? '/Dealmatch/' : '/'
```

---

## Local Development

```bash
npm install
cp .env.example .env.local
# Fill in your keys
npm run dev
```

---

## Revenue Model

| Stream | How |
|--------|-----|
| Property sale commission | 1.5% on close |
| Rental commission | 3% first year |
| Short-let commission | 8% per booking |
| Hotel commission | 8% per booking |
| Professional subscriptions | ₦25k–₦75k/month |
| AMG partnership referrals | Passive network income |

---

## Contact

**Divine Bassey**  
Founder & CEO — DealMatch  
📍 Uyo, Akwa Ibom, Nigeria  
📱 WhatsApp: +234 705 739 2060  

---

*Built with ❤️ for the Nigerian property market.*
