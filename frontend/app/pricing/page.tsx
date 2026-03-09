// @ts-nocheck
'use client'

import { useState } from 'react'
import { Check, Zap, Users, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PRICING_PLANS, formatPrice, createCheckoutSession, type PlanId } from '@/lib/billing'
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
      window.location.href = 'mailto:enterprise@stackmemory.dev?subject=Enterprise Plan Inquiry'
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
            Pricing for shared AI memory
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            For developers, AI power users, and teams that need one memory layer across tools and workflows.
          </p>
          <p className="mt-4 text-sm text-muted-foreground max-w-2xl mx-auto">
            Typical usage includes shared project rules across Claude Code and Cursor, reusable coding preferences, persistent architecture decisions, and memory infrastructure for custom AI apps.
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

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Best for tool users</CardTitle>
              <CardDescription>Claude Code, Cursor, Codex, Replit, Bolt and Lovable workflows.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Use Pro when you need one personal memory layer across multiple AI coding surfaces.</p>
              <p>Focus is persistent project context, coding preferences, and reusable agent instructions.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Best for small teams</CardTitle>
              <CardDescription>Shared memory for project rules, decisions, and active handoffs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Team should win when multiple developers or operators need the same project memory.</p>
              <p>Use it for shared context instead of repeating the same setup across every AI session.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Best for builders</CardTitle>
              <CardDescription>Custom AI apps, internal copilots, MCP clients, and n8n pipelines.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Enterprise is the path when you need embedded memory infrastructure and controlled deployment.</p>
              <p>That includes API access, bridge integration, custom security requirements, and platform support.</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>How to choose</CardTitle>
              <CardDescription>Pick the plan based on workflow shape, not just memory volume.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Free</p>
                <p>Use it to start one personal project memory and validate your workflow.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Pro</p>
                <p>Best when one developer moves across Claude Code, Cursor, Codex, Replit, Bolt or Lovable and wants the same context everywhere.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Team</p>
                <p>Best when multiple developers or operators need shared project rules, active tasks and handoff context.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Enterprise</p>
                <p>Best when you are embedding StackMemory into internal copilots, custom apps, MCP deployments, or n8n-style automation pipelines.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Builder track</CardTitle>
              <CardDescription>For custom AI apps, bridge integrations, and automation workflows.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>If you need API access, deployment control, security review, or a memory backend for your own product, use the builder path.</p>
              <p>Start with the bridge quick start, then move to Enterprise when you need production support.</p>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 sm:flex-row">
              <Button className="w-full sm:w-auto" variant="outline" onClick={() => router.push('/signup?workflow=custom_app')}>
                Start builder onboarding
              </Button>
              <Button className="w-full sm:w-auto" onClick={() => window.location.href = 'mailto:enterprise@stackmemory.dev?subject=Builder Plan Inquiry'}>
                Contact builder sales
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Who is this for?
              </h3>
              <p className="text-muted-foreground">
                Developers using tools like Claude Code, Claude Desktop, Cursor, VS Code AI workflows, internal coding agents, and custom AI applications that need persistent project context.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                Can I embed this into my own AI app?
              </h3>
              <p className="text-muted-foreground">
                Yes. StackMemory is designed to work as both a user-facing memory workspace and a memory backend through API, bridge, MCP, and SDK surfaces.
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
                Which tools can this work with?
              </h3>
              <p className="text-muted-foreground">
                MCP-compatible tools, coding agents, internal copilots, and apps that can call an API or memory bridge. Coverage depends on the integration surface each platform exposes.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-muted-foreground">
                Yes. You can cancel at any time and keep access through the end of your billing period.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to stop repeating project context?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Use StackMemory as your own shared memory layer or embed it into the AI workflows you build.
          </p>
          <Button size="lg" onClick={() => handleSelectPlan('pro')}>
            Start Free Trial
          </Button>
        </div>
      </div>
    </div>
  )
}
