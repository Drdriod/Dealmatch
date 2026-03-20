import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'

import HomePage          from '@/pages/Home/HomePage'
import AuthPage          from '@/pages/Auth/AuthPage'
import OnboardingPage    from '@/pages/Onboarding/OnboardingPage'
import DashboardPage     from '@/pages/Dashboard/DashboardPage'
import BrowsePage        from '@/pages/Browse/BrowsePage'
import MatchesPage       from '@/pages/Matches/MatchesPage'
import PropertyPage      from '@/pages/Property/PropertyPage'
import ProfessionalsPage from '@/pages/Professionals/ProfessionalsPage'
import ListPropertyPage  from '@/pages/List/ListPropertyPage'
import ProfilePage       from '@/pages/Profile/ProfilePage'
import AdminPage         from '@/pages/Admin/AdminPage'
import AuthCallback      from '@/pages/Auth/AuthCallback'
import RentalsPage       from '@/pages/Rentals/RentalsPage'
import HotelsPage        from '@/pages/Hotels/HotelsPage'
import ListRentalPage    from '@/pages/Rentals/ListRentalPage'
import EarnPage          from '@/pages/Earn/EarnPage'

import Navbar         from '@/components/layout/Navbar'
import Footer         from '@/components/layout/Footer'
import WhatsAppButton from '@/components/ui/WhatsAppButton'

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

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:'#FFFAF5'}}>
    <div className="flex flex-col items-center gap-4">
      <div className="text-4xl animate-float">🏡</div>
      <p className="text-sm" style={{color:'rgba(26,18,16,0.4)'}}>Loading DealMatch...</p>
    </div>
  </div>
)

const AppShell = ({ children, showNav = true, showFooter = true, showWhatsApp = true }) => (
  <div className="min-h-screen flex flex-col">
    {showNav && <Navbar />}
    <main className="flex-1">{children}</main>
    {showFooter && <Footer />}
    {showWhatsApp && <WhatsAppButton />}
  </div>
)

const basename = import.meta.env.BASE_URL

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="bottom-center" toastOptions={{
            style: { background:'#1A1210', color:'#FAF6F0', borderRadius:'100px', padding:'14px 24px', fontSize:'14px', fontFamily:'DM Sans, sans-serif', fontWeight:'500' },
            success: { iconTheme: { primary:'#7A9E7E', secondary:'#FAF6F0' } },
            error:   { iconTheme: { primary:'#C96A3A', secondary:'#FAF6F0' } },
          }} />

          <Routes>
            {/* Public */}
            <Route path="/"              element={<AppShell><HomePage /></AppShell>} />
            <Route path="/professionals" element={<AppShell><ProfessionalsPage /></AppShell>} />
            <Route path="/rentals"       element={<AppShell><RentalsPage /></AppShell>} />
            <Route path="/hotels"        element={<AppShell><HotelsPage /></AppShell>} />
            <Route path="/list-rental"   element={<AppShell><ListRentalPage /></AppShell>} />
            <Route path="/earn"           element={<AppShell><EarnPage /></AppShell>} />

            {/* Auth */}
            <Route path="/auth" element={
              <PublicOnlyRoute>
                <AppShell showNav={false} showFooter={false} showWhatsApp={false}><AuthPage /></AppShell>
              </PublicOnlyRoute>
            } />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Onboarding */}
            <Route path="/onboarding" element={
              <ProtectedRoute requireOnboarding={false}>
                <AppShell showNav={false} showFooter={false} showWhatsApp={false}><OnboardingPage /></AppShell>
              </ProtectedRoute>
            } />

            {/* Protected */}
            <Route path="/dashboard"    element={<ProtectedRoute><AppShell showFooter={false}><DashboardPage /></AppShell></ProtectedRoute>} />
            <Route path="/browse"       element={<ProtectedRoute><AppShell showFooter={false}><BrowsePage /></AppShell></ProtectedRoute>} />
            <Route path="/matches"      element={<ProtectedRoute><AppShell showFooter={false}><MatchesPage /></AppShell></ProtectedRoute>} />
            <Route path="/property/:id" element={<ProtectedRoute><AppShell showFooter={false}><PropertyPage /></AppShell></ProtectedRoute>} />
            <Route path="/list"         element={<ProtectedRoute><AppShell><ListPropertyPage /></AppShell></ProtectedRoute>} />
            <Route path="/profile"      element={<ProtectedRoute><AppShell><ProfilePage /></AppShell></ProtectedRoute>} />
            <Route path="/admin/*"      element={<ProtectedRoute><AppShell showFooter={false}><AdminPage /></AppShell></ProtectedRoute>} />

            {/* 404 */}
            <Route path="*" element={
              <AppShell>
                <div className="min-h-screen flex items-center justify-center flex-col gap-5 pt-20">
                  <div className="text-6xl">🏚️</div>
                  <h1 className="font-display text-3xl font-black" style={{color:'#1A1210'}}>Page not found</h1>
                  <a href="/" className="btn-primary text-sm px-6 py-3">Go home</a>
                </div>
              </AppShell>
            } />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
