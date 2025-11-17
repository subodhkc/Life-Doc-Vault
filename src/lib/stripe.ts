import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})

// Stripe Price IDs for each tier (configure these in Stripe Dashboard)
export const STRIPE_PRICES = {
  PERSONAL: process.env.STRIPE_PRICE_PERSONAL || 'price_personal',
  PROFESSIONAL: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional',
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise',
}

// Map Stripe product IDs to tier names
export function getTierFromPriceId(priceId: string): 'FREE' | 'PERSONAL' | 'PROFESSIONAL' | 'ENTERPRISE' {
  switch (priceId) {
    case STRIPE_PRICES.PERSONAL:
      return 'PERSONAL'
    case STRIPE_PRICES.PROFESSIONAL:
      return 'PROFESSIONAL'
    case STRIPE_PRICES.ENTERPRISE:
      return 'ENTERPRISE'
    default:
      return 'FREE'
  }
}

// Get price ID from tier
export function getPriceIdFromTier(tier: 'PERSONAL' | 'PROFESSIONAL' | 'ENTERPRISE'): string {
  return STRIPE_PRICES[tier]
}
