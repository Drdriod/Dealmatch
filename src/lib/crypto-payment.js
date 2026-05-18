// DealMatch Crypto Payment System
// Supports USDT + USDC across TRC20, BEP20, ERC20, Polygon
// Fixed USD charges: no Naira rate fluctuation

export const CRYPTO_WALLETS = {
  USDT_TRC20: {
    address:   'YOUR_TRON_WALLET_ADDRESS',
    network:   'TRON (TRC20)',
    label:     'USDT · TRON',
    coin:      'USDT',
    icon:      '🟢',
    color:     '#26A17B',
    fee:       '$0.00 – near zero fees',
    feeFixed:  0,
    confirm:   '~1 min confirmation',
    recommended: true,
  },
  USDC_TRC20: {
    address:   'YOUR_TRON_WALLET_ADDRESS',
    network:   'TRON (TRC20)',
    label:     'USDC · TRON',
    coin:      'USDC',
    icon:      '🔵',
    color:     '#2775CA',
    fee:       '$0.00 – near zero fees',
    feeFixed:  0,
    confirm:   '~1 min confirmation',
    recommended: false,
  },
  USDT_BEP20: {
    address:   'YOUR_BSC_WALLET_ADDRESS',
    network:   'BNB Smart Chain (BEP20)',
    label:     'USDT · BNB Chain',
    coin:      'USDT',
    icon:      '🟡',
    color:     '#F3BA2F',
    fee:       '~$0.10 network fee',
    feeFixed:  0.10,
    confirm:   '~3 min confirmation',
    recommended: false,
  },
  USDC_BEP20: {
    address:   'YOUR_BSC_WALLET_ADDRESS',
    network:   'BNB Smart Chain (BEP20)',
    label:     'USDC · BNB Chain',
    coin:      'USDC',
    icon:      '🔵',
    color:     '#2775CA',
    fee:       '~$0.10 network fee',
    feeFixed:  0.10,
    confirm:   '~3 min confirmation',
    recommended: false,
  },
  USDT_POLYGON: {
    address:   'YOUR_POLYGON_WALLET_ADDRESS',
    network:   'Polygon (Matic)',
    label:     'USDT · Polygon',
    coin:      'USDT',
    icon:      '🟣',
    color:     '#8247E5',
    fee:       '~$0.01 network fee',
    feeFixed:  0.01,
    confirm:   '~2 min confirmation',
    recommended: false,
  },
  USDC_POLYGON: {
    address:   'YOUR_POLYGON_WALLET_ADDRESS',
    network:   'Polygon (Matic)',
    label:     'USDC · Polygon',
    coin:      'USDC',
    icon:      '🔵',
    color:     '#2775CA',
    fee:       '~$0.01 network fee',
    feeFixed:  0.01,
    confirm:   '~2 min confirmation',
    recommended: false,
  },
  USDT_ERC20: {
    address:   'YOUR_ETH_WALLET_ADDRESS',
    network:   'Ethereum (ERC20)',
    label:     'USDT · Ethereum',
    coin:      'USDT',
    icon:      '⚡',
    color:     '#627EEA',
    fee:       '~$2–15 gas fee',
    feeFixed:  5,
    confirm:   '~5 min confirmation',
    recommended: false,
  },
  USDC_ERC20: {
    address:   'YOUR_ETH_WALLET_ADDRESS',
    network:   'Ethereum (ERC20)',
    label:     'USDC · Ethereum',
    coin:      'USDC',
    icon:      '⚡',
    color:     '#2775CA',
    fee:       '~$2–15 gas fee',
    feeFixed:  5,
    confirm:   '~5 min confirmation',
    recommended: false,
  },
}

// Fixed USD charges per service: no Naira rate confusion
export const CRYPTO_CHARGES = {
  professional_surveyor:   15,
  professional_inspector:  21,
  professional_valuer:     18,
  professional_lawyer:     27,
  professional_lender:     45,
  professional_architect:  18,
  professional_agent:      12,
  professional_contractor: 15,
  rental_listing:          9,
  property_listing:        9,
  escrow_small:            3,   // under ₦500k
  escrow_medium:           5,   // ₦500k – ₦2M
  escrow_large:            10,  // above ₦2M
}

// Get escrow charge based on NGN deal size
export const getEscrowCharge = (ngnAmount) => {
  if (ngnAmount < 500000)  return CRYPTO_CHARGES.escrow_small
  if (ngnAmount < 2000000) return CRYPTO_CHARGES.escrow_medium
  return CRYPTO_CHARGES.escrow_large
}

// Total amount user must send = base + network fee
export const getTotalCharge = (baseAmount, networkKey) => {
  const wallet = CRYPTO_WALLETS[networkKey]
  if (!wallet) return baseAmount
  return +(baseAmount + wallet.feeFixed).toFixed(2)
}

export const generateCryptoReference = () =>
  'DM-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 5).toUpperCase()
