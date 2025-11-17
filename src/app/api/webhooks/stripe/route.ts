import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import { getTierFromPriceId } from '@/lib/stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const priceId = subscription.items.data[0]?.price.id

  if (!priceId) {
    console.error('No price ID found in subscription')
    return
  }

  const tier = getTierFromPriceId(priceId)

  // Find user by Stripe customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  })

  if (!user) {
    console.error(`User not found for Stripe customer: ${customerId}`)
    return
  }

  // Update user tier and subscription info
  await prisma.user.update({
    where: { id: user.id },
    data: {
      tier,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  })

  // Log tier change
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'TIER_CHANGED',
      resource: user.id,
      metadata: {
        oldTier: user.tier,
        newTier: tier,
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
      },
    },
  })

  console.log(`Updated user ${user.email} to tier ${tier}`)
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  })

  if (!user) {
    console.error(`User not found for Stripe customer: ${customerId}`)
    return
  }

  // Downgrade to FREE tier
  await prisma.user.update({
    where: { id: user.id },
    data: {
      tier: 'FREE',
      stripeSubscriptionId: null,
      subscriptionStatus: 'canceled',
      subscriptionCurrentPeriodEnd: null,
    },
  })

  // Log cancellation
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'SUBSCRIPTION_CANCELED',
      resource: user.id,
      metadata: {
        subscriptionId: subscription.id,
      },
    },
  })

  console.log(`Downgraded user ${user.email} to FREE tier`)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  })

  if (!user) {
    return
  }

  // Log successful payment
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'PAYMENT_SUCCEEDED',
      resource: user.id,
      metadata: {
        invoiceId: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
      },
    },
  })

  console.log(`Payment succeeded for user ${user.email}: ${invoice.amount_paid} ${invoice.currency}`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  })

  if (!user) {
    return
  }

  // Log failed payment
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'PAYMENT_FAILED',
      resource: user.id,
      metadata: {
        invoiceId: invoice.id,
        amount: invoice.amount_due,
        currency: invoice.currency,
      },
    },
  })

  console.log(`Payment failed for user ${user.email}`)
}
