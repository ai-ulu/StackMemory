'use client'

import { useState } from 'react'
import { Check, Zap, Users, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PRICING_PLANS, formatPrice, createCheckoutSession, type PlanId } from '@/lib/stripe'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const planIcons = {
  free: Zap,
  pro: Zap,
  team: Users,
  enterprise: Building2
}

const planColors = {
  free: 'default',
  pro: 'default',
  team: 'default',
  enterprise: 'default'
} as const

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<PlanId | null>(null)

  const handleSelectPlan = async (planId: PlanId) => {
    if (planId === 'free') {
      router.push('/signup')
      return
    }

    if (planId === 'enterprise') {
      window.location.href = 'mailto:enterprise@ai-ulu.com?subject=Enterprise Plan Inquiry'
      return
    }

    try {
      setLoading(planId)
      const url = await createCheckoutSession(planId)
      window.location.href = url
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      toast.error('Failed to start checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="outline">
            Pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include our core memory features.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {Object.entries(PRICING_PLANS).map(([key, plan]) => {
            const Icon = planIcons[key as PlanId]
            const isPopular = key === 'pro'

            return (
              <Card
                key={key}
                className={`relative ${
                  isPopular ? 'border-primary shadow-lg scale-105' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle>{plan.name}</CardTitle>
                  </div>
                  <CardDescription>
                    <div className="text-3xl font-bold text-foreground">
                      {formatPrice(plan.price)}
                      {plan.price !== null && (
                        <span className="text-sm font-normal text-muted-foreground">
                          /{plan.interval}
                        </span>
                      )}
                    </div>
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isPopular ? 'default' : 'outline'}
                    onClick={() => handleSelectPlan(key as PlanId)}
                    disabled={loading === key}
                  >
                    {loading === key ? (
                      'Loading...'
                    ) : key === 'free' ? (
                      'Get Started'
                    ) : key === 'enterprise' ? (
                      'Contact Sales'
                    ) : (
                      'Subscribe'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Can I change plans later?
              </h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the difference.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-muted-foreground">
                We accept all major credit cards (Visa, Mastercard, American Express) through Stripe. Enterprise customers can also pay via invoice.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                Is my data secure?
              </h3>
              <p className="text-muted-foreground">
                Absolutely! We use end-to-end encryption (E2EE) with RSA-2048 and AES-256. Your data is encrypted on your device before it reaches our servers. We can't read your memories - only you can.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-muted-foreground">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-muted-foreground">
                We offer a 14-day money-back guarantee. If you're not satisfied, contact us for a full refund.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of users who never forget anything.
          </p>
          <Button size="lg" onClick={() => handleSelectPlan('pro')}>
            Start Free Trial
          </Button>
        </div>
      </div>
    </div>
  )
}
