import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Home, RotateCw, Users, Settings, LogOut, Plus, Eye, Clock, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralCode] = useState('DM' + (user?.id || '').toString().padStart(6, '0'));

  const { data: profileData } = trpc.profile.me.useQuery();
  const { data: listingsData } = trpc.properties.myListings.useQuery();

  useEffect(() => {
    if (profileData) setProfile(profileData);
    if (listingsData) setListings(listingsData);
    setLoading(false);
  }, [profileData, listingsData]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  const stats = [
    { label: 'My Listings', value: listings.length, icon: Home, color: 'text-orange-500' },
    { label: 'Pending Verification', value: listings.filter(l => l.status === 'pending_verification').length, icon: Clock, color: 'text-yellow-500' },
    { label: 'Published', value: listings.filter(l => l.status === 'published').length, icon: Eye, color: 'text-green-500' },
    { label: 'Referrals', value: 0, icon: Users, color: 'text-blue-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
              DM
            </div>
            <h1 className="text-xl font-bold text-slate-900">DealMatch</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/browse')}>
              Browse
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
              <Settings size={16} className="mr-2" />
              Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut size={16} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {user?.name || 'User'}! 👋
          </h2>
          <p className="text-slate-600">
            Here's your DealMatch dashboard. Manage your listings and track your activity.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  <Icon size={32} className={`${stat.color} opacity-20`} />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => navigate('/list-property')}
                  className="gap-2 h-12"
                >
                  <Plus size={20} />
                  List Property
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/browse')}
                  className="gap-2 h-12"
                >
                  <Eye size={20} />
                  Browse Properties
                </Button>
              </div>
            </Card>

            {/* My Listings */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">My Listings</h3>
              <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                <RotateCw size={16} />
              </Button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-slate-500">Loading...</div>
              ) : listings.length === 0 ? (
                <div className="text-center py-8">
                  <Home size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-slate-600 mb-4">No listings yet</p>
                  <Button onClick={() => navigate('/list-property')}>
                    Create Your First Listing
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {listings.map((listing: any) => (
                    <div key={listing.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{listing.title}</h4>
                          <p className="text-sm text-slate-600">{listing.city}, {listing.state}</p>
                          <p className="text-lg font-bold text-orange-500 mt-1">
                            ₦{parseInt(listing.price).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            listing.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : listing.status === 'pending_verification'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {listing.status === 'published' ? 'Published' : 'Pending Verification'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Referral Program */}
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Earn with Referrals 💰</h3>
              <p className="text-sm text-slate-700 mb-4">
                Share your unique code and earn ₦2,000 for each successful referral.
              </p>
              <div className="bg-white rounded-lg p-3 mb-3 border border-orange-200">
                <p className="text-xs text-slate-600 mb-1">Your Referral Code</p>
                <p className="font-mono font-bold text-slate-900">{referralCode}</p>
              </div>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(referralCode);
                  toast.success('Code copied!');
                }}
                className="w-full"
              >
                Copy Code
              </Button>
            </Card>

            {/* Verification Status */}
            {profile?.verificationCompleted === false && (
              <Card className="p-6 border-yellow-200 bg-yellow-50">
                <div className="flex gap-3">
                  <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Complete Your Verification</h4>
                    <p className="text-sm text-slate-700 mb-3">
                      Verify your identity to unlock full platform features.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => navigate('/profile-setup')}
                      className="w-full"
                    >
                      Complete Now
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Help & Support */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Help & Support</h3>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start text-sm">
                  📖 How to List
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  💬 Contact Support
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  ❓ FAQ
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
