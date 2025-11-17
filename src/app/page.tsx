import Link from 'next/link'
import { ArrowRight, Shield, FileText, Zap, Lock } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Life-Doc-Vault</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary">
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center space-y-6 py-24 text-center md:py-32">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Secure Your Life,
            <br />
            <span className="text-primary">Document by Document</span>
          </h1>
          <p className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl">
            Manage personal documents securely. Extract insights with AI. Generate professional evidence packets for legal, medical, and insurance needs.
          </p>
        </div>
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Start Free Trial
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/docs"
            className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container space-y-12 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            Everything You Need
          </h2>
          <p className="mt-4 text-muted-foreground">
            Powerful features to manage and protect your personal documents
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<Shield className="h-10 w-10 text-primary" />}
            title="Military-Grade Security"
            description="End-to-end encryption keeps your documents safe and private"
          />
          <FeatureCard
            icon={<FileText className="h-10 w-10 text-primary" />}
            title="Smart Organization"
            description="AI automatically categorizes and extracts key information"
          />
          <FeatureCard
            icon={<Zap className="h-10 w-10 text-primary" />}
            title="Evidence Packets"
            description="Generate professional PDFs for legal, medical, or insurance use"
          />
          <FeatureCard
            icon={<Lock className="h-10 w-10 text-primary" />}
            title="Privacy First"
            description="Your data, your control. Automatic retention policies included"
          />
        </div>
      </section>

      {/* Pricing Section */}
      <section className="border-t bg-muted/50 py-16">
        <div className="container space-y-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-muted-foreground">
              Start free, upgrade when you need more
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <PricingCard
              name="Free"
              price="$0"
              period="forever"
              features={[
                '100 MB storage',
                '10 documents',
                'Basic organization',
                'Community support',
              ]}
            />
            <PricingCard
              name="Personal"
              price="$9"
              period="per month"
              features={[
                '5 GB storage',
                '500 documents',
                'AI extraction',
                'Timeline generation',
                'Email support',
              ]}
              highlighted
            />
            <PricingCard
              name="Professional"
              price="$29"
              period="per month"
              features={[
                '50 GB storage',
                'Unlimited documents',
                'Everything in Personal',
                'Evidence packet generation',
                'Priority support',
              ]}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Life-Doc-Vault</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Life-Doc-Vault. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center space-y-3 text-center">
      <div className="rounded-lg bg-primary/10 p-3">{icon}</div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function PricingCard({
  name,
  price,
  period,
  features,
  highlighted = false,
}: {
  name: string
  price: string
  period: string
  features: string[]
  highlighted?: boolean
}) {
  return (
    <div className={`flex flex-col rounded-lg border p-6 ${highlighted ? 'border-primary shadow-lg' : ''}`}>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold">{name}</h3>
        <div className="flex items-baseline space-x-1">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-muted-foreground">/{period}</span>
        </div>
      </div>
      <ul className="mt-6 space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center space-x-2 text-sm">
            <ArrowRight className="h-4 w-4 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/register"
        className={`mt-8 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium ${
          highlighted
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
        }`}
      >
        Get Started
      </Link>
    </div>
  )
}
