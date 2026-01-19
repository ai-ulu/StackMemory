/**
 * AI-ULU Stripe Integration
 * 
 * Payment processing for subscription plans.
 * Pricing:
 *   - Free: 1000 memories, 100 MCP calls
 *   - Pro ($9.99/mo): 100k memories, 10k MCP calls
 *   - Enterprise ($99/mo): Unlimited
 */

// Stripe price IDs (set in Stripe Dashboard)
export const PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
  pro_yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
  enterprise_monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_enterprise_monthly',
};

// Plan configurations
export const PLANS = {
  free: {
    id: 'free',
    name: 'Ücretsiz',
    price: 0,
    priceDisplay: '₺0',
    interval: null,
    features: [
      '1,000 hafıza',
      '100 MCP çağrısı/ay',
      'Temel arama',
      'Web arayüzü',
    ],
    limits: {
      memories: 1000,
      mcpCalls: 100,
      teamMembers: 0,
      apiAccess: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    priceDisplay: '$9.99',
    interval: 'month',
    priceId: PRICE_IDS.pro_monthly,
    features: [
      '100,000 hafıza',
      '10,000 MCP çağrısı/ay',
      'Gelişmiş arama',
      'Chrome Extension',
      'MCP Entegrasyonu',
      'Öncelikli destek',
    ],
    limits: {
      memories: 100000,
      mcpCalls: 10000,
      teamMembers: 5,
      apiAccess: true,
    },
    popular: true,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    priceDisplay: '$99',
    interval: 'month',
    priceId: PRICE_IDS.enterprise_monthly,
    features: [
      'Sınırsız hafıza',
      'Sınırsız MCP çağrısı',
      'Takım hafızaları',
      'Self-hosted seçeneği',
      'Özel MCP entegrasyonu',
      'SLA garantisi',
      '7/24 Destek',
    ],
    limits: {
      memories: Infinity,
      mcpCalls: Infinity,
      teamMembers: Infinity,
      apiAccess: true,
    },
  },
};

/**
 * Check if user has exceeded plan limits
 */
export function checkPlanLimits(plan, usage) {
  const limits = PLANS[plan]?.limits || PLANS.free.limits;
  
  return {
    memoriesExceeded: usage.memories >= limits.memories,
    mcpCallsExceeded: usage.mcpCalls >= limits.mcpCalls,
    canAddTeamMember: usage.teamMembers < limits.teamMembers,
    hasApiAccess: limits.apiAccess,
  };
}

/**
 * Get upgrade recommendation
 */
export function getUpgradeRecommendation(currentPlan, usage) {
  const limits = PLANS[currentPlan]?.limits || PLANS.free.limits;
  
  const memoryUsagePercent = (usage.memories / limits.memories) * 100;
  const mcpUsagePercent = (usage.mcpCalls / limits.mcpCalls) * 100;
  
  if (memoryUsagePercent > 80 || mcpUsagePercent > 80) {
    if (currentPlan === 'free') {
      return {
        shouldUpgrade: true,
        reason: 'Limitinize yaklaşıyorsunuz',
        suggestedPlan: 'pro',
      };
    } else if (currentPlan === 'pro') {
      return {
        shouldUpgrade: true,
        reason: 'Pro limitinize yaklaşıyorsunuz',
        suggestedPlan: 'enterprise',
      };
    }
  }
  
  return { shouldUpgrade: false };
}

/**
 * Initialize Stripe client (browser-side)
 */
export async function getStripe() {
  if (typeof window === 'undefined') return null;
  
  const { loadStripe } = await import('@stripe/stripe-js');
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
}

/**
 * Create checkout session (call from client)
 */
export async function createCheckoutSession(priceId, userId, userEmail) {
  const response = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId, userId, userEmail }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create checkout session');
  }
  
  return response.json();
}

/**
 * Redirect to checkout
 */
export async function redirectToCheckout(priceId, userId, userEmail) {
  const { sessionId } = await createCheckoutSession(priceId, userId, userEmail);
  const stripe = await getStripe();
  
  if (!stripe) {
    throw new Error('Stripe not loaded');
  }
  
  const { error } = await stripe.redirectToCheckout({ sessionId });
  
  if (error) {
    throw error;
  }
}

/**
 * Get customer portal URL
 */
export async function getCustomerPortalUrl() {
  const response = await fetch('/api/stripe/portal', {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error('Failed to get portal URL');
  }
  
  const { url } = await response.json();
  return url;
}

/**
 * Get subscription status
 */
export async function getSubscriptionStatus() {
  const response = await fetch('/api/stripe/subscription');
  
  if (!response.ok) {
    return { plan: 'free', status: 'inactive' };
  }
  
  return response.json();
}

export default {
  PLANS,
  PRICE_IDS,
  checkPlanLimits,
  getUpgradeRecommendation,
  getStripe,
  createCheckoutSession,
  redirectToCheckout,
  getCustomerPortalUrl,
  getSubscriptionStatus,
};
