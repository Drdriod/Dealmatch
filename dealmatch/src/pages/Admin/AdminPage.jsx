import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function AdminPage() {
  const { profile } = useAuth()

  return (
    <div className="min-h-screen bg-cream pt-20 px-6 pb-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-3xl font-black mb-2">Admin Dashboard</h1>
        <p className="text-deep/40 text-sm mb-10">Manage listings, professionals, and platform data.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Listings', value: '—', icon: '🏡' },
            { label: 'Active Buyers',  value: '—', icon: '👤' },
            { label: 'Professionals',  value: '—', icon: '🤝' },
            { label: 'Revenue (MRR)',  value: '—', icon: '💰' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className="font-display text-2xl font-black text-deep">{s.value}</p>
              <p className="text-xs text-deep/40 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <h2 className="font-semibold text-deep mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Review Professional Applications', href: '/admin/professionals' },
              { label: 'Manage Listings', href: '/admin/listings' },
              { label: 'View All Users', href: '/admin/users' },
              { label: 'Payment Reports', href: '/admin/payments' },
            ].map(({ label, href }) => (
              <Link key={label} to={href} className="p-4 rounded-2xl border border-deep/8 hover:border-terracotta hover:bg-terracotta/3 transition-all text-sm font-medium text-deep">
                {label} →
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
