'use client'

import Link from 'next/link'
import Script from 'next/script'
import { APP_NAME } from '@/config/saas'

type PaddleWindow = Window & {
  Paddle?: {
    Environment: { set: (environment: 'sandbox') => void }
    Initialize: (options: { token: string }) => void
  }
  __flowcrmPayPaddleInitialized?: boolean
}

export default function PayPage() {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim()
  const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT

  function initializePaddle() {
    if (!token) return
    const paddleWindow = window as PaddleWindow
    if (!paddleWindow.Paddle || paddleWindow.__flowcrmPayPaddleInitialized) return

    if (environment === 'sandbox') {
      paddleWindow.Paddle.Environment.set('sandbox')
    }
    paddleWindow.Paddle.Initialize({ token })
    paddleWindow.__flowcrmPayPaddleInitialized = true
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        strategy="afterInteractive"
        onReady={initializePaddle}
      />
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold">{APP_NAME} secure checkout</h1>
        {token ? (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              Your secure checkout should open automatically. Keep this page open while payment loads.
            </p>
            <div className="mx-auto mt-6 h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </>
        ) : (
          <p className="mt-3 text-sm text-destructive">
            Billing checkout is not configured on this deployment.
          </p>
        )}
        <Link href="/" className="mt-8 inline-block text-sm text-muted-foreground hover:text-foreground">
          Return to {APP_NAME}
        </Link>
      </div>
    </main>
  )
}
