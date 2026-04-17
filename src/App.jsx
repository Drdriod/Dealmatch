import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import InstallPrompt from '@/components/ui/InstallPrompt'

const HomePage            = lazy(() => import('@/pages/Home/HomePage'))
const AuthPage            = lazy(() => import('@/pages/Auth/AuthPage'))
const OnboardingPage      = lazy(() => import('@/pages/Onboarding/OnboardingPage'))
const VerifyIdentityPage  = lazy(() => import('@/pages/PostVerification/VerifyIdentityPage'))
const DashboardPage       = lazy(() => import('@/pages/Dashboard/DashboardPage'))
const BrowsePage          = lazy(() => import('@/pages/Browse/BrowsePage'))
const MatchesPage         = lazy(() => import('@/pages/Matches/MatchesPage'))
const PropertyPage        = lazy(() => import('@/pages/Property/PropertyPage'))
const ProfessionalsPage   = lazy(() => import('@/pages/Professionals/ProfessionalsPage'))
const LandlordDashboardPage = lazy(() => import('@/pages/LandlordDashboard/LandlordDashboardPage'))
const ProfilePage         = lazy(() => import('@/pages/Profile/ProfilePage'))
const AdminPage           = lazy(() => import('@/pages/Admin/AdminPage'))
const AuthCallback        = lazy(() => import('@/pages/Auth/AuthCallback'))
const RentalsPage         = lazy(() => import('@/pages/Rentals/RentalsPage'))
const HotelsPage          = lazy(() => import('@/pages/Hotels/HotelsPage'))
const ListRentalPage      = lazy(() => import('@/pages/Rentals/ListRentalPage'))
const EarnPage            = lazy(() => import('@/pages/Earn/EarnPage'))
const EscrowPage          = lazy(() => import('@/pages/Escrow/EscrowPage'))
const TenancyPage         = lazy(() => import('@/pages/Tenancy/TenancyPage'))
const ListPropertyPage    = lazy(() => import('@/pages/List/ListPropertyPage'))
const AvailabilityPage    = lazy(() => import('@/pages/Availability/AvailabilityPage'))
const PrivacyPage         = lazy(() => import('@/pages/Legal/PrivacyPage'))
const TermsPage           = lazy(() => import('@/pages/Legal/TermsPage'))
const MortgagePage        = lazy(() => import('@/pages/Mortgage/MortgagePage'))
const VerificationPage    = lazy(() => import('@/pages/Verification/VerificationPage'))
const MessagesPage        = lazy(() => import('@/pages/Messages/MessagesPage'))
const LenderDashboardPage = lazy(() => import('@/pages/LenderDashboard/LenderDashboardPage'))

const LoadingScreen = () => (
  <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(145deg,#0f0f0f 0%,#1a1210 50%,#0f0f0f 100%)', position:'relative', overflow:'hidden' }}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes pulse-ring{0%{transform:scale(0.8);opacity:0.8}100%{transform:scale(1.6);opacity:0}}
      @keyframes fade-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
      @keyframes float-dot{0%,100%{transform:translateY(0);opacity:0.3}50%{transform:translateY(-8px);opacity:1}}
      @keyframes glow-pulse{0%,100%{opacity:0.15}50%{opacity:0.35}}
      .dm-logo{font-family:'DM Sans',sans-serif;font-size:28px;font-weight:700;background:linear-gradient(90deg,#c9a96e,#f0d4a0,#c9a96e);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 2.5s linear infinite,fade-up 0.6s ease forwards}
      .dm-sub{font-family:'DM Sans',sans-serif;font-size:12px;color:rgba(255,255,255,0.35);letter-spacing:2.5px;text-transform:uppercase;animation:fade-up 0.6s ease 0.2s both}
      .dm-tag{font-family:'DM Sans',sans-serif;font-size:11px;color:rgba(201,106,58,0.7);letter-spacing:1px;animation:fade-up 0.6s ease 0.35s both}
      .dm-ring{width:52px;height:52px;border-radius:50%;border:2px solid rgba(201,169,110,0.15);border-top:2px solid #c9a96e;animation:spin 1s cubic-bezier(0.4,0,0.2,1) infinite}
      .dm-pulse{position:absolute;width:52px;height:52px;border-radius:50%;border:1px solid rgba(201,169,110,0.5);animation:pulse-ring 1.5s ease-out infinite}
      .dm-dot{width:5px;height:5px;border-radius:50%;background:#c9a96e}
      .dm-dot:nth-child(1){animation:float-dot 1.4s ease-in-out 0s infinite}
      .dm-dot:nth-child(2){animation:float-dot 1.4s ease-in-out 0.2s infinite}
      .dm-dot:nth-child(3){animation:float-dot 1.4s ease-in-out 0.4s infinite}
      .dm-glow{position:absolute;border-radius:50%;filter:blur(80px);animation:glow-pulse 3s ease-in-out infinite;pointer-events:none}
    `}</style>
    <div className="dm-glow" style={{ width:300, height:300, background:'#c9a96e', top:'-80px', right:'-80px' }} />
    <div className="dm-glow" style={{ width:250, height:250, background:'#7A9E7E', bottom:'-60px', left:'-60px', animationDelay:'1.5s' }} />
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:28, zIndex:1 }}>
      <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className="dm-pulse" /><div className="dm-ring" />
        <div style={{ position:'absolute', fontSize:18, animation:'fade-up 0.5s ease 0.3s both' }}>🏠</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
        <span className="dm-logo">DealMatch</span>
        <span className="dm-sub">Nigeria's Property Platform</span>
        <span className="dm-tag">Every match is a connection ❤️</span>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        <div className="dm-dot" /><div className="dm-dot" /><div className="dm-dot" />
      </div>
    </div>
  </div>
)

const ProtectedRoute = ({ children, requireOnboarding = true }) => {
  const { isAuthenticated, hasCompletedOnboarding, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/auth" replace />
  if (requireOnboarding && !hasCompletedOnboarding) return <Navigate to="/onboarding" replace />
  return children
}

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, hasCompletedOnboarding, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (isAuthenticated) return <Navigate to={hasCompletedOnboarding ? '/browse' : '/onboarding'} replace />
  return children
}

const AppShell = ({ children, showNav = true, showFooter = true, showWhatsApp = true }) => (
  <div className="min-h-screen flex flex-col">
    {showNav && <Navbar />}
    <main className="flex-1">{children}</main>
    {showFooter && <Footer />}
    {showWhatsApp && <WhatsAppButton />}
    <InstallPrompt />
  </div>
)

const basename = import.meta.env.BASE_URL

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="bottom-center" toastOptions={{
            style: { background:'#1A1210', color:'#FAF6F0', borderRadius:'100px', padding:'14px 24px', fontSize:'14px', fontFamily:"'DM Sans',sans-serif", fontWeight:'500' },
            success: { iconTheme: { primary:'#7A9E7E', secondary:'#FAF6F0' } },
            error:   { iconTheme: { primary:'#C96A3A', secondary:'#FAF6F0' } },
          }} />
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* ── Public ─────────────────────────────── */}
              <Route path="/"              element={<AppShell><HomePage /></AppShell>} />
              <Route path="/professionals" element={<AppShell><ProfessionalsPage /></AppShell>} />
              <Route path="/escrow"        element={<AppShell><EscrowPage /></AppShell>} />
              <Route path="/tenancy"       element={<AppShell><TenancyPage /></AppShell>} />
              <Route path="/earn"          element={<AppShell><EarnPage /></AppShell>} />
              <Route path="/mortgage"      element={<AppShell><MortgagePage /></AppShell>} />
              <Route path="/privacy"       element={<AppShell><PrivacyPage /></AppShell>} />
              <Route path="/terms"         element={<AppShell><TermsPage /></AppShell>} />
              <Route path="/rentals"       element={<AppShell><RentalsPage /></AppShell>} />
              <Route path="/hotels"        element={<AppShell><HotelsPage /></AppShell>} />
              <Route path="/list-rental"   element={<AppShell><ListRentalPage /></AppShell>} />
              <Route path="/property/:id"  element={<AppShell showFooter={false}><PropertyPage /></AppShell>} />

              {/* ── Auth ──────────────────────────────── */}
              <Route path="/auth" element={<PublicOnlyRoute><AppShell showNav={false} showFooter={false} showWhatsApp={false}><AuthPage /></AppShell></PublicOnlyRoute>} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* ── Onboarding + Identity Verification ─── */}
              <Route path="/onboarding" element={
                <ProtectedRoute requireOnboarding={false}>
                  <AppShell showNav={false} showFooter={false} showWhatsApp={false}>
                    <OnboardingPage />
                  </AppShell>
                </ProtectedRoute>
              } />
              <Route path="/verify-identity" element={
                <ProtectedRoute requireOnboarding={false}>
                  <AppShell showNav={false} showFooter={false} showWhatsApp={false}>
                    <VerifyIdentityPage />
                  </AppShell>
                </ProtectedRoute>
              } />

              {/* ── Protected ─────────────────────────── */}
              <Route path="/browse"       element={<ProtectedRoute><AppShell showFooter={false}><BrowsePage /></AppShell></ProtectedRoute>} />
              <Route path="/matches"      element={<ProtectedRoute><AppShell showFooter={false}><MatchesPage /></AppShell></ProtectedRoute>} />
              <Route path="/messages"     element={<ProtectedRoute><AppShell showFooter={false}><MessagesPage /></AppShell></ProtectedRoute>} />
              <Route path="/dashboard"    element={<ProtectedRoute><AppShell showFooter={false}><DashboardPage /></AppShell></ProtectedRoute>} />
              <Route path="/landlord"     element={<ProtectedRoute><AppShell showFooter={false}><LandlordDashboardPage /></AppShell></ProtectedRoute>} />
              <Route path="/list"         element={<ProtectedRoute><AppShell showFooter={false}><ListPropertyPage /></AppShell></ProtectedRoute>} />
              <Route path="/profile"      element={<ProtectedRoute><AppShell><ProfilePage /></AppShell></ProtectedRoute>} />
              <Route path="/admin/*"      element={<ProtectedRoute><AppShell showFooter={false}><AdminPage /></AppShell></ProtectedRoute>} />
              <Route path="/availability" element={<ProtectedRoute><AppShell><AvailabilityPage /></AppShell></ProtectedRoute>} />
              <Route path="/verify"       element={<ProtectedRoute requireOnboarding={false}><AppShell showNav={false} showFooter={false} showWhatsApp={false}><VerifyIdentityPage /></AppShell></ProtectedRoute>} />
              <Route path="/lender-dashboard" element={<ProtectedRoute><AppShell showFooter={false}><LenderDashboardPage /></AppShell></ProtectedRoute>} />
              <Route path="/agent-verify" element={<ProtectedRoute><AppShell showFooter={false}><VerificationPage /></AppShell></ProtectedRoute>} />

              {/* ── 404 ─────────────────────────────── */}
              <Route path="*" element={
                <AppShell>
                  <div className="min-h-screen flex items-center justify-center flex-col gap-5 pt-20">
                    <div className="text-6xl">🏠</div>
                    <h1 className="font-display text-3xl font-black" style={{ color:'#1A1210' }}>Page not found</h1>
                    <p className="text-sm" style={{ color:'#8A7E78' }}>Every match is a connection ❤️</p>
                    <a href="/" className="btn-primary text-sm px-6 py-3">Go home</a>
                  </div>
                </AppShell>
              } />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
