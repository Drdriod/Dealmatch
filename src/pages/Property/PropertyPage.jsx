import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Bed, Bath, Maximize, ArrowLeft, Heart, Star, Phone, Share2, CheckCircle, Loader, MessageCircle } from 'lucide-react'
import { getPropertyById, recordSwipe } from '@/lib/supabase'
import { analytics } from '@/lib/posthog'
import { useAuth } from '@/context/AuthContext'
import PropertyCarousel from '@/components/ui/PropertyCarousel'
import { PropertyMap } from '@/components/maps/PropertyMap'
import { FadeUp } from '@/components/ui/ScrollReveal'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const formatPrice = (n) => {
  if (!n) return '₦0'
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
  return `₦${(n / 1_000).toFixed(0)}K`
}

const DEMO_PROPERTY = {
  id: 'demo',
  title: '4-Bed Detached Duplex with Pool',
  property_type: 'duplex',
  listing_type: 'For Sale',
  price: 38_500_000,
  state: 'Lagos',
  city: 'Victoria Island',
  address: '15 Kofo Abayomi Street',
  bedrooms: 4,
  bathrooms: 4,
  size_sqm: 380,
  description: 'A stunning 4-bedroom detached duplex in the heart of Victoria Island. This property features a private swimming pool, boys quarters, 4-car parking, 24/7 security, and a well-manicured garden. Located minutes from major business districts, shopping centres, and international schools.\n\nThe property sits on a 600sqm plot with a Certificate of Occupancy. Fully fitted kitchen, marble flooring throughout, and solar power backup. Ideal for a family home or high-yield investment property.',
  features: ['Swimming Pool','Boys Quarters','Solar Power','CCTV','4-Car Parking','Garden','Smart Home','Prepaid Meter'],
  documents: ['Certificate of Occupancy (C of O)','Registered Survey Plan','Building Approval'],
  latitude: 6.4281,
  longitude: 3.4219,
  images: [
    { url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80', is_primary: true },
    { url: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&q=80' },
    { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80' },
    { url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80' },
  ],
  seller: { full_name: 'Divine Bassey', avatar_url: null, phone: '+234 800 000 0000' },
}

export default function PropertyPage() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { user }    = useAuth()
  const [property, setProperty] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [liked, setLiked]       = useState(false)
  const [tab, setTab]           = useState('details') // 'details' | 'map'

  useEffect(() => {
    (async () => {
      const { data } = await getPropertyById(id)
      setProperty(data || DEMO_PROPERTY)
      setLoading(false)
      analytics.propertyViewed(id)
    })()
  }, [id])

  const handleLike = async () => {
    if (!user) { toast.error('Sign in to save properties'); return }
    await recordSwipe({ userId: user.id, propertyId: property.id, action: 'like' })
    setLiked(true)
    analytics.propertyLiked(property.id, 0)
    toast.success('Added to your matches! ❤️')
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: property.title, url })
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    }
  }

  const handleContact = () => {
    analytics.matchContacted(property?.id)
    const msg = encodeURIComponent(`Hello! I'm interested in the property: ${property?.title} at ${property?.city}, ${property?.state}. Listed on DealMatch.`)
    window.open(`https://wa.me/${property?.seller?.phone?.replace(/\D/g,'')}?text=${msg}`, '_blank')
  }

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center pt-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-deep/10 border-t-terracotta rounded-full animate-spin" />
        <p className="text-deep/30 text-sm">Loading property...</p>
      </div>
    </div>
  )

  if (!property) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-5 pt-20">
      <div className="text-6xl">🏚️</div>
      <h2 className="font-display text-2xl font-black">Property not found</h2>
      <Link to="/browse" className="btn-primary text-sm px-6 py-3">Back to Browse</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream pb-32 md:pb-16">

      {/* ── Image Carousel ── */}
      <div className="relative">
        <PropertyCarousel images={property.images || []} title={property.title} height="360px" />
        <button onClick={() => navigate(-1)}
          className="absolute top-20 left-4 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white transition-colors">
          <ArrowLeft size={16} className="text-deep" />
        </button>
      </div>

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-4 -mt-8 relative">

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-3xl p-6 shadow-card mb-5"
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-terracotta/8 text-terracotta font-bold px-3 py-1 rounded-full capitalize">{property.listing_type || 'For Sale'}</span>
                <span className="text-xs bg-deep/5 text-deep/50 font-medium px-3 py-1 rounded-full capitalize">{property.property_type}</span>
              </div>
              <h1 className="font-display text-3xl font-black text-deep leading-tight">{property.title}</h1>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-display text-3xl font-black text-terracotta">{formatPrice(property.price)}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-deep/40 text-sm mb-5">
            <MapPin size={13} className="text-terracotta" />
            {property.address ? `${property.address}, ` : ''}{property.city}, {property.state}
          </div>

          {/* Specs row */}
          <div className="flex flex-wrap gap-5 text-sm text-deep/60 py-4 border-y border-deep/8 mb-5">
            {property.bedrooms  && <span className="flex items-center gap-2"><Bed size={16} className="text-deep/30" /><span><strong className="text-deep">{property.bedrooms}</strong> Bedrooms</span></span>}
            {property.bathrooms && <span className="flex items-center gap-2"><Bath size={16} className="text-deep/30" /><span><strong className="text-deep">{property.bathrooms}</strong> Bathrooms</span></span>}
            {property.size_sqm  && <span className="flex items-center gap-2"><Maximize size={16} className="text-deep/30" /><span><strong className="text-deep">{property.size_sqm}</strong> sqm</span></span>}
          </div>

          {/* Description */}
          {property.description && (
            <div className="mb-5">
              <h3 className="font-semibold text-deep mb-2 text-sm">About this property</h3>
              <p className="text-deep/60 text-sm leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>
          )}

          {/* Features */}
          {property.features?.length > 0 && (
            <div className="mb-5">
              <h3 className="font-semibold text-deep mb-3 text-sm">Features & Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {property.features.map(f => (
                  <span key={f} className="flex items-center gap-1.5 text-xs bg-cream text-deep/70 px-3 py-2 rounded-full border border-deep/8">
                    <CheckCircle size={11} className="text-sage" /> {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {property.documents?.length > 0 && (
            <div>
              <h3 className="font-semibold text-deep mb-3 text-sm">Available Documents</h3>
              <div className="flex flex-wrap gap-2">
                {property.documents.map(d => (
                  <span key={d} className="flex items-center gap-1.5 text-xs bg-sage/8 text-sage font-semibold px-3 py-1.5 rounded-full">
                    ✓ {d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Map + Amenities ── */}
        <FadeUp delay={0.1} className="mb-5">
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
            <div className="px-5 pt-5 pb-3">
              <h3 className="font-display text-xl font-black text-deep">Location & Nearby</h3>
              <p className="text-deep/40 text-xs mt-0.5">Click the amenity buttons to see what's within 2km</p>
            </div>
            <PropertyMap property={property} height="320px" />
          </div>
        </FadeUp>

        {/* ── Seller info ── */}
        {property.seller && (
          <FadeUp delay={0.15} className="mb-5">
            <div className="bg-white rounded-3xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-terracotta/10 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                {property.seller.avatar_url
                  ? <img src={property.seller.avatar_url} alt="" className="w-full h-full object-cover" />
                  : '🧑🏾'
                }
              </div>
              <div className="flex-1">
                <p className="font-semibold text-deep">{property.seller.full_name}</p>
                <p className="text-xs text-deep/40 mt-0.5">Verified Seller · DealMatch Pro</p>
                <div className="flex items-center gap-1 mt-1">
                  {'★★★★★'.split('').map((s,i) => <span key={i} className="text-gold text-xs">{s}</span>)}
                  <span className="text-xs text-deep/30 ml-1">Trusted seller</span>
                </div>
              </div>
              <button onClick={handleContact}
                className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center hover:bg-[#25D366]/20 transition-colors flex-shrink-0">
                <MessageCircle size={18} className="text-[#25D366]" />
              </button>
            </div>
          </FadeUp>
        )}

        {/* ── Connect with professionals ── */}
        <FadeUp delay={0.2}>
          <Link to="/professionals" className="block p-6 bg-deep rounded-3xl text-white hover:bg-charcoal transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-1">Interested in this property?</p>
                <h3 className="font-display font-black text-lg">Connect with a Surveyor, Inspector, or Lender</h3>
                <p className="text-white/40 text-xs mt-1">Get matched with verified professionals for this deal</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-terracotta/20 flex items-center justify-center group-hover:bg-terracotta transition-colors flex-shrink-0 ml-4">
                <ArrowLeft size={14} className="rotate-180 text-white" />
              </div>
            </div>
          </Link>
        </FadeUp>
      </div>

      {/* ── Fixed bottom actions (mobile) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-deep/8 px-4 py-4 flex gap-3 shadow-[0_-8px_32px_rgba(0,0,0,0.08)]">
        <button onClick={handleShare}
          className="w-12 h-12 rounded-2xl border border-deep/10 flex items-center justify-center text-deep/40 hover:text-deep transition-colors flex-shrink-0">
          <Share2 size={17} />
        </button>
        <button onClick={handleLike}
          className={clsx('w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all flex-shrink-0',
            liked ? 'bg-terracotta border-terracotta' : 'border-deep/10 text-deep/40 hover:border-terracotta hover:text-terracotta'
          )}>
          <Heart size={17} fill={liked ? 'white' : 'none'} className={liked ? 'text-white' : ''} />
        </button>
        <button onClick={handleContact} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-3">
          <Phone size={15} /> Contact Seller
        </button>
      </div>

      {/* ── Desktop top-right action row ── */}
      <div className="hidden md:flex fixed top-24 right-6 z-40 flex-col gap-2">
        <button onClick={handleShare}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-deep/40 hover:text-deep transition-colors border border-deep/8">
          <Share2 size={15} />
        </button>
        <button onClick={handleLike}
          className={clsx('w-10 h-10 rounded-full shadow-sm flex items-center justify-center transition-all border',
            liked ? 'bg-terracotta border-terracotta' : 'bg-white border-deep/8 text-deep/40 hover:border-terracotta hover:text-terracotta'
          )}>
          <Heart size={15} fill={liked ? 'white' : 'none'} className={liked ? 'text-white' : ''} />
        </button>
      </div>
    </div>
  )
}
