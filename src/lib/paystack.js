// Paystack: Nigerian payment gateway
// Handles professional listing subscription fees + student hostel listing fees

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY

// ─── Professional Plans ────────────────────────────────────
export const PROFESSIONAL_PLANS = {
  surveyor: {
    name: 'Land Surveyor',
    monthlyFee: 25000,
    annualFee:  240000,
    currency: 'NGN',
    features: [
      'Appear on matched land deals',
      'Buyer profile preview before contact',
      'Verified badge on your profile',
      'Up to 30 matched deal introductions/month',
      'Direct messaging with matched buyers',
    ],
  },
  inspector: {
    name: 'Property Inspector',
    monthlyFee: 35000,
    annualFee:  336000,
    currency: 'NGN',
    features: [
      'Priority placement on all property types',
      'Direct chat with matched buyers',
      'Inspection report template kit',
      'Unlimited matched deal introductions',
      'Featured profile listing',
    ],
  },
  lender: {
    name: 'Mortgage Lender',
    monthlyFee: 75000,
    annualFee:  720000,
    currency: 'NGN',
    features: [
      'Filter leads by loan amount range',
      'Buyer financial profile access',
      'Pre-qualification flow integration',
      'Co-branded deal flow reports',
      'Priority support & onboarding',
    ],
  },
}

// ─── Hostel Listing Plans (paid by hostel owners, free for students) ────────
export const HOSTEL_LISTING_PLANS = {
  semester: {
    name:     'Semester Plan',
    price:    5000,
    duration: '~6 months',
    badge:    'Popular',
    saving:   null,
    features: [
      'Listed on student hostels page',
      'Visible to all verified students near your school',
      'Enquiries via WhatsApp and in-app',
      'Edit or pause your listing anytime',
      'Verified badge after inspection',
    ],
  },
  annual: {
    name:     'Annual Plan',
    price:    8500,
    duration: '12 months',
    badge:    'Best Value',
    saving:   'Save ₦1,500 vs two semesters',
    features: [
      'Everything in Semester Plan',
      'Priority placement in search results',
      'Listed for the full academic year',
      'Renewal reminder before expiry',
    ],
  },
}

// ─── Load Paystack script once ─────────────────────────────
let paystackLoaded = false
function loadPaystackScript() {
  return new Promise((resolve) => {
    if (paystackLoaded || window.PaystackPop) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.onload = () => { paystackLoaded = true; resolve() }
    script.onerror = () => resolve() // fail silently
    document.head.appendChild(script)
  })
}

// ─── Open payment popup ────────────────────────────────────
export const initializePaystackPayment = async ({
  email,
  amount,
  metadata = {},
  onSuccess,
  onClose,
  reference,
}) => {
  if (!PAYSTACK_PUBLIC_KEY) {
    console.warn('[DealMatch] VITE_PAYSTACK_PUBLIC_KEY is not set — payment skipped')
    return
  }
  await loadPaystackScript()
  if (!window.PaystackPop) { return }

  const handler = window.PaystackPop.setup({
    key:      PAYSTACK_PUBLIC_KEY,
    email,
    amount:   amount * 100, // kobo
    currency: 'NGN',
    ref:      reference || generateReference(),
    metadata: { ...metadata, platform: 'DealMatch' },
    callback: (response) => onSuccess?.(response),
    onClose:  () => onClose?.(),
  })
  handler.openIframe()
}

// ─── Subscribe professional ────────────────────────────────
export const subscribeProfessional = async ({
  professional,
  planType = 'monthly',
  onSuccess,
  onClose,
}) => {
  const plan   = PROFESSIONAL_PLANS[professional.professional_type]
  if (!plan) return
  const amount = planType === 'annual' ? plan.annualFee : plan.monthlyFee

  await initializePaystackPayment({
    email:    professional.email,
    amount,
    metadata: {
      professional_id:   professional.id,
      professional_type: professional.professional_type,
      plan_type:         planType,
      plan_name:         plan.name,
    },
    onSuccess: async (response) => {
      await verifyPayment(response.reference)
      onSuccess?.(response)
    },
    onClose,
  })
}

// ─── Pay hostel listing fee ────────────────────────────────
// Called from ListHostelPage after saving the hostel draft.
// On success, marks listing_paid = true in student_hostels table.
export const payHostelListingFee = async ({
  email,
  hostelId,
  plan = 'semester',   // 'semester' | 'annual'
  ownerName = '',
  onSuccess,
  onClose,
}) => {
  const planMeta = HOSTEL_LISTING_PLANS[plan]
  if (!planMeta) return

  const reference = generateReference()

  await initializePaystackPayment({
    email,
    amount:    planMeta.price,
    reference,
    metadata: {
      hostel_id:    hostelId,
      plan,
      listing_type: 'student_hostel',
      owner_name:   ownerName,
    },
    onSuccess,
    onClose,
  })
}

// ─── Verify on server ──────────────────────────────────────
export const verifyPayment = async (reference) => {
  try {
    const res = await fetch('/api/payments/verify', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ reference }),
    })
    if (!res.ok) throw new Error('Verification failed')
    return await res.json()
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ─── Utils ────────────────────────────────────────────────
export const generateReference = () =>
  'dm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)

export const formatNaira = (amount) => {
  if (!amount && amount !== 0) return '₦0'
  return new Intl.NumberFormat('en-NG', {
    style:    'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

}
