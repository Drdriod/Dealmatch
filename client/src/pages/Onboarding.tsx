import { useState } from 'react';
import { useLocation } from 'wouter';
import { Check, ArrowRight, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

// Role definitions - Agent role removed
const ROLES = [
  { id: 'buyer', emoji: '🏠', label: 'I want to Buy', desc: 'Looking for a property to purchase.' },
  { id: 'seller', emoji: '💼', label: 'I want to Sell', desc: 'I have a property to list and sell.' },
  { id: 'renter', emoji: '🔑', label: 'I want to Rent', desc: 'Looking for a rental property.' },
  { id: 'landlord', emoji: '🏘️', label: "I'm a Landlord", desc: 'I have rental or hotel properties.' },
  { id: 'investor', emoji: '📈', label: "I'm an Investor", desc: 'I buy properties for investment.' },
];

// Role-specific goals
const GOALS_BY_ROLE: Record<string, Array<{ id: string; label: string; emoji: string }>> = {
  buyer: [
    { id: 'buy_home', label: 'Buy a Home', emoji: '🏡' },
    { id: 'land_banking', label: 'Land Banking', emoji: '🌿' },
    { id: 'investment', label: 'Property Investment', emoji: '📈' },
  ],
  seller: [
    { id: 'sell_home', label: 'Sell Property', emoji: '💰' },
    { id: 'quick_sale', label: 'Quick Sale', emoji: '⚡' },
  ],
  renter: [
    { id: 'find_apartment', label: 'Find Apartment', emoji: '🏢' },
    { id: 'find_shortlet', label: 'Find Shortlet', emoji: '🏨' },
  ],
  landlord: [
    { id: 'rental_income', label: 'Rental Income', emoji: '💰' },
    { id: 'hotel_business', label: 'Hotel Business', emoji: '🏨' },
  ],
  investor: [
    { id: 'investment', label: 'Property Investment', emoji: '📈' },
    { id: 'portfolio', label: 'Build Portfolio', emoji: '📊' },
  ],
};

const STATES = ['Lagos', 'Abuja', 'Rivers', 'Akwa Ibom', 'Delta', 'Oyo', 'Kano', 'Anambra', 'Enugu', 'Cross River', 'Edo', 'Imo'];
const PROP_TYPES = ['Land', 'Apartment', 'Duplex', 'Detached House', 'Terrace', 'Commercial'];

export default function Onboarding() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  
  const [data, setData] = useState({
    role: '',
    propertyGoal: '',
    preferredStates: [] as string[],
    propertyTypes: [] as string[],
    budgetMin: '',
    budgetMax: '',
    needsFinancing: false,
    fullName: '',
    phone: '',
  });

  const set = (k: string, v: any) => setData(d => ({ ...d, [k]: v }));
  const toggleArr = (k: string, v: string) => setData(d => {
    const arr = d[k as keyof typeof d] as string[];
    return {
      ...d,
      [k]: arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v],
    };
  });

  const steps = [
    {
      title: "What's your role?",
      valid: () => !!data.role,
      content: (
        <div className="space-y-3">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">👋</div>
            <h2 className="font-bold text-2xl text-slate-900">Welcome to DealMatch!</h2>
            <p className="text-sm mt-1 text-slate-600">Tell us how you'll use the platform.</p>
          </div>
          {ROLES.map(r => (
            <button
              key={r.id}
              onClick={() => set('role', r.id)}
              className="w-full flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all"
              style={{
                borderColor: data.role === r.id ? '#C96A3A' : '#E8DDD2',
                backgroundColor: data.role === r.id ? 'rgba(201,106,58,0.05)' : '#FFFFFF',
              }}
            >
              <span className="text-2xl flex-shrink-0">{r.emoji}</span>
              <div className="flex-1">
                <p className="font-semibold text-sm text-slate-900">{r.label}</p>
                <p className="text-xs mt-0.5 text-slate-600">{r.desc}</p>
              </div>
              {data.role === r.id && <Check size={16} style={{ color: '#C96A3A', flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Your goal',
      valid: () => !!data.propertyGoal,
      content: (
        <div>
          <div className="mb-5">
            <h2 className="font-bold text-2xl text-slate-900">What's your goal? 🎯</h2>
            <p className="text-sm mt-1 text-slate-600">This helps us match you better.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(GOALS_BY_ROLE[data.role] || []).map(g => (
              <button
                key={g.id}
                onClick={() => set('propertyGoal', g.id)}
                className="flex flex-col items-center gap-2 p-5 rounded-lg border-2 transition-all"
                style={{
                  borderColor: data.propertyGoal === g.id ? '#C96A3A' : '#E8DDD2',
                  backgroundColor: data.propertyGoal === g.id ? 'rgba(201,106,58,0.05)' : '#FFFFFF',
                }}
              >
                <span className="text-3xl">{g.emoji}</span>
                <span className="text-xs font-semibold text-center text-slate-900">{g.label}</span>
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Preferences',
      valid: () => !!data.budgetMax,
      content: (
        <div className="space-y-5">
          <div>
            <h2 className="font-bold text-2xl text-slate-900">Your preferences 📍</h2>
            <p className="text-sm mt-1 text-slate-600">Tell us what you're looking for.</p>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block text-slate-700">Preferred States</label>
            <div className="flex flex-wrap gap-2">
              {STATES.map(s => (
                <button
                  key={s}
                  onClick={() => toggleArr('preferredStates', s)}
                  className="px-3 py-2 rounded-full text-xs font-medium border-2 transition-all"
                  style={{
                    borderColor: data.preferredStates.includes(s) ? '#C96A3A' : '#E8DDD2',
                    backgroundColor: data.preferredStates.includes(s) ? '#C96A3A' : '#FFFFFF',
                    color: data.preferredStates.includes(s) ? '#FFFFFF' : '#5C4A3A',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block text-slate-700">Property Types</label>
            <div className="flex flex-wrap gap-2">
              {PROP_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => toggleArr('propertyTypes', t)}
                  className="px-3 py-2 rounded-full text-xs font-medium border-2 transition-all"
                  style={{
                    borderColor: data.propertyTypes.includes(t) ? '#7A9E7E' : '#E8DDD2',
                    backgroundColor: data.propertyTypes.includes(t) ? '#7A9E7E' : '#FFFFFF',
                    color: data.propertyTypes.includes(t) ? '#FFFFFF' : '#5C4A3A',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block text-slate-700">Min Budget (₦)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="e.g. 5000000"
                value={data.budgetMin}
                onChange={e => set('budgetMin', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block text-slate-700">Max Budget (₦) *</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="e.g. 50000000"
                value={data.budgetMax}
                onChange={e => set('budgetMax', e.target.value)}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Your details',
      valid: () => !!data.fullName,
      content: (
        <div className="space-y-4">
          <div>
            <h2 className="font-bold text-2xl text-slate-900">Almost done! 🎉</h2>
            <p className="text-sm mt-1 text-slate-600">A few final details for your profile.</p>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block text-slate-700">Full Name *</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="Your full name"
              value={data.fullName}
              onChange={e => set('fullName', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block text-slate-700">WhatsApp Phone</label>
            <input
              type="tel"
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="+234 800 000 0000"
              value={data.phone}
              onChange={e => set('phone', e.target.value)}
            />
          </div>
          <div
            className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all"
            style={{
              borderColor: data.needsFinancing ? '#C96A3A' : '#E8DDD2',
              backgroundColor: data.needsFinancing ? 'rgba(201,106,58,0.05)' : '#FFFFFF',
            }}
            onClick={() => set('needsFinancing', !data.needsFinancing)}
          >
            <div
              className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                borderColor: data.needsFinancing ? '#C96A3A' : '#E8DDD2',
                backgroundColor: data.needsFinancing ? '#C96A3A' : '#FFFFFF',
              }}
            >
              {data.needsFinancing && <Check size={10} color="white" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">I need mortgage financing</p>
              <p className="text-xs text-slate-600">We'll match you with lenders</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = async () => {
    if (!current.valid()) {
      toast.error('Please complete this step');
      return;
    }

    if (!isLast) {
      setStep(s => s + 1);
      return;
    }

    if (!user?.id) {
      toast.error('Not signed in');
      return;
    }

    setSaving(true);
    try {
      // Create or get profile
      await trpc.profile.getOrCreate.useMutation().mutateAsync({ userRole: data.role });

      // Update profile with onboarding data
      await trpc.profile.update.useMutation().mutateAsync({
        fullName: data.fullName,
        phone: data.phone,
        propertyGoal: data.propertyGoal,
        preferredStates: data.preferredStates,
        propertyTypes: data.propertyTypes,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        needsFinancing: data.needsFinancing,
        onboardingCompleted: true,
      });

      toast.success('Onboarding completed! Proceeding to profile setup...');
      navigate('/profile-setup', { replace: true });
    } catch (err: any) {
      console.error('Onboarding error:', err);
      toast.error('Could not save: ' + (err.message || 'Please try again'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-slate-50">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs mb-3 text-slate-600">
            <span>Step {step + 1} of {steps.length}</span>
            <span>{current.title}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-slate-200">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / steps.length) * 100}%`, backgroundColor: '#C96A3A' }}
            />
          </div>
        </div>

        {current.content}

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep(s => s - 1)}
              disabled={saving}
              className="px-5 py-4"
            >
              ←
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={saving || !current.valid()}
            className="flex-1 py-4 flex items-center justify-center gap-2"
          >
            {saving ? 'Saving...' : isLast ? 'Complete Onboarding 🎉' : <>Next <ArrowRight size={15} /></>}
          </Button>
        </div>
      </div>
    </div>
  );
}
