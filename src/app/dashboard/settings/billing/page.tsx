'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

interface UserData {
  tier: string
  stripeCustomerId: string | null
  subscriptionStatus: string | null
  subscriptionCurrentPeriodEnd: Date | null
  storageUsed: string
  documentCount: number
}

const TIER_LIMITS = {
  FREE: { storage: '100 MB', documents: 10 },
  PERSONAL: { storage: '5 GB', documents: 500 },
  PROFESSIONAL: { storage: '50 GB', documents: 'Unlimited' },
  ENTERPRISE: { storage: 'Unlimited', documents: 'Unlimited' },
}

const TIER_PRICES = {
  PERSONAL: { monthly: 9.99, yearly: 99.99 },
  PROFESSIONAL: { monthly: 29.99, yearly: 299.99 },
  ENTERPRISE: { monthly: 99.99, yearly: 999.99 },
}

export default function BillingPage() {
  const searchParams = useSearchParams()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showCanceled, setShowCanceled] = useState(false)

  useEffect(() => {
    fetchUserData()

    // Check for success/canceled params
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
    }
    if (searchParams.get('canceled') === 'true') {
      setShowCanceled(true)
      setTimeout(() => setShowCanceled(false), 5000)
    }
  }, [searchParams])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/me')
      const data = await response.json()
      setUserData(data.user)
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (tier: 'PERSONAL' | 'PROFESSIONAL' | 'ENTERPRISE') => {
    setUpgrading(tier)
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })

      if (response.ok) {
        const data = await response.json()
        window.location.href = data.url
      } else {
        alert('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Failed to start upgrade process')
    } finally {
      setUpgrading(null)
    }
  }

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        window.location.href = data.url
      } else {
        alert('Failed to open billing portal')
      }
    } catch (error) {
      console.error('Portal error:', error)
      alert('Failed to open billing portal')
    }
  }

  const formatStorageUsed = (bytes: string) => {
    const num = Number(bytes)
    if (num === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(num) / Math.log(k))
    return Math.round((num / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Loading billing information...</p>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Failed to load billing information</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription and billing settings</p>
      </div>

      {showSuccess && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="flex items-center space-x-2 pt-6">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-600">Subscription updated successfully!</p>
          </CardContent>
        </Card>
      )}

      {showCanceled && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="flex items-center space-x-2 pt-6">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-yellow-600">Checkout canceled. No charges were made.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your active subscription details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{userData.tier}</p>
              <p className="text-sm text-muted-foreground">
                {TIER_LIMITS[userData.tier as keyof typeof TIER_LIMITS].storage} storage •{' '}
                {TIER_LIMITS[userData.tier as keyof typeof TIER_LIMITS].documents} documents
              </p>
            </div>
            {userData.tier !== 'FREE' && userData.stripeCustomerId && (
              <Button onClick={handleManageSubscription} variant="outline">
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Subscription
              </Button>
            )}
          </div>

          {userData.subscriptionStatus && (
            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">{userData.subscriptionStatus}</span>
              </div>
              {userData.subscriptionCurrentPeriodEnd && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Renews:</span>
                  <span className="font-medium">
                    {new Date(userData.subscriptionCurrentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Storage Used:</span>
              <span className="font-medium">
                {formatStorageUsed(userData.storageUsed)} /{' '}
                {TIER_LIMITS[userData.tier as keyof typeof TIER_LIMITS].storage}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Documents:</span>
              <span className="font-medium">
                {userData.documentCount} /{' '}
                {TIER_LIMITS[userData.tier as keyof typeof TIER_LIMITS].documents}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {userData.tier === 'FREE' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Upgrade Your Plan</h2>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Personal</CardTitle>
                <CardDescription>For individual users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">$9.99</p>
                  <p className="text-sm text-muted-foreground">per month</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    5 GB storage
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    500 documents
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    AI document analysis
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    PDF packet generation
                  </li>
                </ul>
                <Button
                  className="w-full"
                  onClick={() => handleUpgrade('PERSONAL')}
                  disabled={upgrading !== null}
                >
                  {upgrading === 'PERSONAL' ? 'Processing...' : 'Upgrade to Personal'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Professional</CardTitle>
                  <span className="rounded-full bg-primary px-2 py-1 text-xs text-white">
                    Popular
                  </span>
                </div>
                <CardDescription>For power users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">$29.99</p>
                  <p className="text-sm text-muted-foreground">per month</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    50 GB storage
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Unlimited documents
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Priority AI processing
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Advanced packet templates
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Priority support
                  </li>
                </ul>
                <Button
                  className="w-full"
                  onClick={() => handleUpgrade('PROFESSIONAL')}
                  disabled={upgrading !== null}
                >
                  {upgrading === 'PROFESSIONAL' ? 'Processing...' : 'Upgrade to Professional'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>For organizations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">$99.99</p>
                  <p className="text-sm text-muted-foreground">per month</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Unlimited storage
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Unlimited documents
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Team collaboration
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Custom integrations
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Dedicated support
                  </li>
                </ul>
                <Button
                  className="w-full"
                  onClick={() => handleUpgrade('ENTERPRISE')}
                  disabled={upgrading !== null}
                >
                  {upgrading === 'ENTERPRISE' ? 'Processing...' : 'Upgrade to Enterprise'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
