'use client'

import { useActionState, useTransition } from 'react'
import { loginAction, demoLoginAction } from '@/actions/authActions'
import Link from 'next/link'
import { BookOpen, Loader2 } from 'lucide-react'
import { SmoothInput } from '@/components/ui/SmoothInput'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null)
  const [isDemoPending, startDemoTransition] = useTransition()

  const handleDemoLogin = () => {
    startDemoTransition(async () => {
      await demoLoginAction()
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-sm p-8 space-y-8">
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-2">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-foreground-muted">Sign in to your account to continue</p>
        </div>

        <form action={formAction} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email Address
            </label>
            <SmoothInput
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <SmoothInput
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-foreground-muted">Or continue with</span>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isDemoPending}
            className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 border border-border disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDemoPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isDemoPending ? 'Setting up Demo...' : 'Try Demo Mode'}
          </button>
        </div>

        <div className="text-center text-sm text-foreground-muted">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
