import Link from 'next/link'
import { ArrowRight, Bot, Check, MessageCircle, UsersRound, Workflow } from 'lucide-react'
import { APP_NAME, APP_TAGLINE, SAAS_PLANS } from '@/config/saas'

const highlights = [
  {
    icon: MessageCircle,
    title: 'Shared WhatsApp inbox',
    text: 'Give your team one place to handle customer conversations through the official WhatsApp Business Platform.',
  },
  {
    icon: UsersRound,
    title: 'Contacts and sales pipelines',
    text: 'Turn chats into organized contacts, follow-ups, deals, and pipeline stages instead of losing leads in a phone inbox.',
  },
  {
    icon: Workflow,
    title: 'Automations and broadcasts',
    text: 'Build repeatable follow-up workflows and send approved WhatsApp template campaigns with plan-aware limits.',
  },
  {
    icon: Bot,
    title: 'AI-assisted replies',
    text: 'Business and Pro workspaces can use their own supported AI provider key for drafts, auto-replies, and knowledge grounding.',
  },
]

export default function RootPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-lg font-bold tracking-tight">
            {APP_NAME}
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Start free
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-24 text-center sm:pt-32">
        <div className="mx-auto max-w-3xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            WhatsApp CRM for growing teams
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Turn WhatsApp conversations into customers.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            {APP_TAGLINE} Share one inbox, manage contacts and deals, automate follow-ups,
            and keep your sales workflow connected to WhatsApp.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Start 14-day trial <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-semibold"
            >
              Open dashboard
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No software subscription charge during the trial. WhatsApp platform charges are separate.
          </p>
        </div>
      </section>

      <section className="border-y border-border/70 bg-muted/20">
        <div className="mx-auto grid max-w-6xl gap-5 px-6 py-16 md:grid-cols-2">
          {highlights.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 inline-flex rounded-lg border border-border bg-background p-2">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Simple global pricing</h2>
          <p className="mt-3 text-muted-foreground">
            Start with the workflow you need and move plans as your team grows.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {Object.values(SAAS_PLANS).map((plan) => (
            <article key={plan.id} className="flex rounded-2xl border border-border bg-card p-6">
              <div className="flex w-full flex-col">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.monthlyPriceUsd}</span>
                  <span className="text-muted-foreground"> / month</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" /> {plan.seats} team seats</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" /> {plan.broadcastsPerMonth} broadcasts per month</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" /> {plan.automations} automations</li>
                  {plan.aiAssistant ? <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" /> AI assistant</li> : null}
                  {plan.apiAccess ? <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" /> Public API access</li> : null}
                </ul>
                <Link
                  href="/signup"
                  className="mt-7 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Start free trial
                </Link>
              </div>
            </article>
          ))}
        </div>
        <p className="mx-auto mt-5 max-w-3xl text-center text-xs text-muted-foreground">
          Prices shown in USD. Checkout may present supported local currencies and applicable taxes. Meta WhatsApp messaging charges are not included.
        </p>
      </section>

      <section className="border-t border-border/70 bg-muted/20">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-6 py-12 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="text-xl font-semibold">Ready to organize your WhatsApp sales workflow?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Create a workspace and use the included 14-day trial.</p>
          </div>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Create workspace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} {APP_NAME}</span>
        <span>WhatsApp is a trademark of Meta Platforms, Inc. {APP_NAME} is not endorsed by or affiliated with Meta.</span>
      </footer>
    </main>
  )
}
