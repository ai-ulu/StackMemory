/**
 * Stripe Billing Integration
 */

export const PRICING_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'month',
    memories: 100,
    searches_per_day: 10,
    features: [
      '100 memories',
      '10 searches per day',
      'Basic features',
      'Community support'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 9,
    currency: 'USD',
    interval: 'month',
    price_id: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_pro',
    memories: -1, // unlimited
    searches_per_day: 1000,
    features: [
      'Unlimited memories',
      '1,000 searches per day',
      'Memory Graph visualization',
      'H(x,ψ) algorithm',
      'Priority support',
      'API access',
      'Export/Import'
    ]
  },
  team: {
    id: 'team',
    name: 'Team',
    price: 29,
    currency: 'USD',
    interval: 'month',
    price_id: process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID || 'price_team',
    memories: -1,
    searches_per_day: -1, // unlimited
    features: [
      'Everything in Pro',
      'Unlimited searches',
      'Shared workspaces',
      'Team collaboration',
      'Admin dashboard',
      'SSO (Google, GitHub)',
      'Role-based access',
      'Audit logs'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: null, // Custom pricing
    currency: 'USD',
    interval: 'month',
    memories: -1,
    searches_per_day: -1,
    features: [
      'Everything in Team',
      'Custom deployment',
      'SLA (99.9% uptime)',
      'Dedicated support',
      'SAML SSO',
      'Custom integrations',
      'On-premise option',
      'Training & onboarding'
    ]
  }
} as const

export type PlanId = keyof typeof PRICING_PLANS

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(planId: PlanId): Promise<string> {
  const plan = PRICING_PLANS[planId]
  const priceId = 'price_id' in plan ? plan.price_id : undefined
  
  if (!priceId) {
    throw new Error(`Plan ${planId} does not have a price ID`)
  }

  const response = await fetch('/api/billing/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan_id: planId })
  })

  if (!response.ok) {
    throw new Error('Failed to create checkout session')
  }

  const { url } = await response.json()
  return url
}

/**
 * Create Stripe customer portal session
 */
export async function createPortalSession(): Promise<string> {
  const response = await fetch('/api/billing/create-portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })

  if (!response.ok) {
    throw new Error('Failed to create portal session')
  }

  const { url } = await response.json()
  return url
}

/**
 * Get current subscription
 */
export async function getCurrentSubscription() {
  const response = await fetch('/api/billing/subscription')

  if (!response.ok) {
    throw new Error('Failed to get subscription')
  }

  return response.json()
}

/**
 * Get usage stats
 */
export async function getUsageStats() {
  const response = await fetch('/api/billing/usage')

  if (!response.ok) {
    throw new Error('Failed to get usage stats')
  }

  return response.json()
}

/**
 * Check if user has quota for action
 */
export async function checkQuota(action: 'store_memory' | 'search'): Promise<boolean> {
  const response = await fetch(`/api/billing/quota?action=${action}`)

  if (!response.ok) {
    return false
  }

  const { has_quota } = await response.json()
  return has_quota
}

/**
 * Format price for display
 */
export function formatPrice(price: number | null, currency: string = 'USD'): string {
  if (price === null) {
    return 'Custom'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0
  }).format(price)
}

/**
 * Get plan by ID
 */
export function getPlan(planId: PlanId) {
  return PRICING_PLANS[planId]
}

/**
 * Get all plans
 */
export function getAllPlans() {
  return Object.values(PRICING_PLANS)
}
