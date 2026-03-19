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
import Navbar            from '@/components/layout/Navbar'
import Footer            from '@/components/layout/Footer'
import WhatsAppButton    from '@/components/ui/WhatsAppButton'

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
  <div className="min-h-screen bg-cream flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="text-4xl animate-float">🏡</div>
      <p className="text-deep/40 text-sm">Loading DealMatch...</p>
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

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider>
        <AuthProvider>
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background:   '#1A1210',
                color:        '#FAF6F0',
                borderRadius: '100px',
                padding:      '14px 24px',
                fontSize:     '14px',
                fontFamily:   'DM Sans, sans-serif',
                fontWeight:   '500',
              },
              success: { iconTheme: { primary: '#7A9E7E', secondary: '#FAF6F0' } },
              error:   { iconTheme: { primary: '#C96A3A', secondary: '#FAF6F0' } },
            }}
          />
          <Routes>
            <Route path="/"              element={<AppShell><HomePage /></AppShell>} />
            <Route path="/professionals" element={<AppShell><ProfessionalsPage /></AppShell>} />
            <Route path="/auth" element={
              <PublicOnlyRoute>
                <AppShell showNav={false} showFooter={false} showWhatsApp={false}>
                  <AuthPage />
                </AppShell>
              </PublicOnlyRoute>
            } />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/onboarding" element={
              <ProtectedRoute requireOnboarding={false}>
                <AppShell showNav={false} showFooter={false} showWhatsApp={false}>
                  <OnboardingPage />
                </AppShell>
              </ProtectedRoute>
            } />
            <Route path="/dashboard"    element={<ProtectedRoute><AppShell showFooter={false}><DashboardPage /></AppShell></ProtectedRoute>} />
            <Route path="/browse"       element={<ProtectedRoute><AppShell showFooter={false}><BrowsePage /></AppShell></ProtectedRoute>} />
            <Route path="/matches"      element={<ProtectedRoute><AppShell showFooter={false}><MatchesPage /></AppShell></ProtectedRoute>} />
            <Route path="/property/:id" element={<ProtectedRoute><AppShell showFooter={false}><PropertyPage /></AppShell></ProtectedRoute>} />
            <Route path="/list"         element={<ProtectedRoute><AppShell><ListPropertyPage /></AppShell></ProtectedRoute>} />
            <Route path="/profile"      element={<ProtectedRoute><AppShell><ProfilePage /></AppShell></ProtectedRoute>} />
            <Route path="/admin/*"      element={<ProtectedRoute><AppShell showFooter={false}><AdminPage /></AppShell></ProtectedRoute>} />
            <Route path="*" element={
              <AppShell>
                <div className="min-h-screen flex items-center justify-center flex-col gap-5 pt-20">
                  <div className="text-6xl">🏚️</div>
                  <h1 className="font-display text-3xl font-black text-deep">Page not found</h1>
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
