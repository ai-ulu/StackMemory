# 🚀 Stripe & Email Onboarding Setup Guide

**Status:** Ready to implement  
**Time:** ~2 hours  
**Difficulty:** Medium

---

## 📋 Prerequisites

- Stripe account (free)
- Supabase project
- Domain with email (for sending emails)

---

## 1️⃣ Stripe Setup (45 minutes)

### Step 1: Create Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Sign up for free
3. Complete business verification

### Step 2: Create Products & Prices

```bash
# In Stripe Dashboard → Products

# Product 1: StackMemory Pro
- Name: StackMemory Pro
- Description: Unlimited messages, advanced memory, all models
- Pricing:
  - Monthly: $29/month (recurring)
  - Yearly: $290/year (recurring, save $58)

# Product 2: StackMemory Team
- Name: StackMemory Team
- Description: Pro features + team workspaces + admin panel
- Pricing:
  - Monthly: $79/month (recurring)
  - Yearly: $790/year (recurring, save $158)
```

### Step 3: Get API Keys

```bash
# Stripe Dashboard → Developers → API Keys

# Test Mode (for development)
STRIPE_SECRET_KEY=sk_test_xxx...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx...

# Live Mode (for production)
STRIPE_SECRET_KEY=sk_live_xxx...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx...
```

### Step 4: Get Price IDs

```bash
# Stripe Dashboard → Products → Click product → Copy Price ID

NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx...
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=price_xxx...
NEXT_PUBLIC_STRIPE_TEAM_MONTHLY_PRICE_ID=price_xxx...
NEXT_PUBLIC_STRIPE_TEAM_YEARLY_PRICE_ID=price_xxx...
```

### Step 5: Setup Webhook

```bash
# Stripe Dashboard → Developers → Webhooks → Add endpoint

# Endpoint URL (production)
https://your-stackmemory-domain.com/api/stripe/webhook

# Events to listen:
- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed

# Copy webhook signing secret
STRIPE_WEBHOOK_SECRET=whsec_xxx...
```

### Step 6: Test Webhook Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test webhook
stripe trigger checkout.session.completed
```

---

## 2️⃣ Supabase Database Setup (15 minutes)

### Add Stripe columns to profiles table

```sql
-- Run in Supabase SQL Editor

ALTER TABLE profiles
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN subscription_id TEXT,
ADD COLUMN current_period_end TIMESTAMP;

-- Create index for faster lookups
CREATE INDEX idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX idx_profiles_subscription_status ON profiles(subscription_status);
```

---

## 3️⃣ Email Setup (30 minutes)

### Option A: Supabase Edge Function (Recommended)

```bash
# Create edge function
supabase functions new send-email

# Install dependencies
cd supabase/functions/send-email
npm install @sendgrid/mail
```

```typescript
// supabase/functions/send-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(Deno.env.get('SENDGRID_API_KEY') || '');

serve(async (req) => {
  const { to, subject, html } = await req.json();

  try {
    await sgMail.send({
      to,
      from: 'noreply@your-stackmemory-domain.com',
      subject,
      html,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

```bash
# Deploy
supabase functions deploy send-email --no-verify-jwt

# Set secrets
supabase secrets set SENDGRID_API_KEY=SG.xxx...
```

### Option B: SendGrid Direct

```bash
# Get SendGrid API key
# sendgrid.com → Settings → API Keys

SENDGRID_API_KEY=SG.xxx...
SENDGRID_FROM_EMAIL=noreply@your-stackmemory-domain.com
```

### Option C: Resend (Modern alternative)

```bash
# Get Resend API key
# resend.com → API Keys

RESEND_API_KEY=re_xxx...
```

---

## 4️⃣ Environment Variables (10 minutes)

### Update `.env`

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_xxx...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx...
STRIPE_WEBHOOK_SECRET=whsec_xxx...
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx...
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=price_xxx...
NEXT_PUBLIC_STRIPE_TEAM_MONTHLY_PRICE_ID=price_xxx...
NEXT_PUBLIC_STRIPE_TEAM_YEARLY_PRICE_ID=price_xxx...

# Email (choose one)
SENDGRID_API_KEY=SG.xxx...
# OR
RESEND_API_KEY=re_xxx...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Development
# NEXT_PUBLIC_APP_URL=https://your-stackmemory-domain.com  # Production
```

---

## 5️⃣ Frontend Integration (20 minutes)

### Install Stripe.js

```bash
cd frontend
npm install @stripe/stripe-js
```

### Create Pricing Page Component

```typescript
// frontend/app/pricing/page.js
'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function PricingPage() {
  const handleCheckout = async (priceId, plan) => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, plan }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  return (
    <div>
      <h1>Pricing</h1>
      <Button onClick={() => handleCheckout('price_xxx...', 'Pro')}>
        Subscribe to Pro
      </Button>
    </div>
  );
}
```

---

## 6️⃣ Testing (15 minutes)

### Test Stripe Checkout

```bash
# Use test card
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

### Test Webhook

```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Terminal 3: Trigger test event
stripe trigger checkout.session.completed
```

### Test Email

```bash
# Send test welcome email
curl -X POST http://localhost:3000/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

---

## 7️⃣ Production Deployment (10 minutes)

### Update Environment Variables

```bash
# Vercel
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add SENDGRID_API_KEY

# Or Railway
railway variables set STRIPE_SECRET_KEY=sk_live_xxx...
```

### Update Stripe Webhook URL

```bash
# Stripe Dashboard → Webhooks → Update endpoint
https://ai-ulu.com/api/stripe/webhook
```

### Test Production

1. Make real payment (will be refunded)
2. Check webhook logs in Stripe Dashboard
3. Verify email delivery
4. Check Supabase database updates

---

## 8️⃣ Monitoring (5 minutes)

### Stripe Dashboard

- Monitor payments
- View failed payments
- Check webhook logs
- Manage subscriptions

### Email Delivery

- SendGrid: Dashboard → Activity
- Resend: Dashboard → Logs

### Database

```sql
-- Check subscription status
SELECT 
  email,
  subscription_status,
  current_period_end
FROM profiles
WHERE subscription_status = 'active';
```

---

## 🎯 Success Checklist

- [ ] Stripe account created
- [ ] Products & prices configured
- [ ] API keys added to `.env`
- [ ] Webhook endpoint configured
- [ ] Database schema updated
- [ ] Email service configured
- [ ] Frontend integration complete
- [ ] Test payment successful
- [ ] Webhook events received
- [ ] Welcome email sent
- [ ] Production deployment done

---

## 📚 Resources

- [Stripe Docs](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [SendGrid Docs](https://docs.sendgrid.com)
- [Resend Docs](https://resend.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**Ready to accept payments!** 💰
