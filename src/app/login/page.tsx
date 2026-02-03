'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Test accounts for development
const DEV_ACCOUNTS = [
  {
    email: 'user@test.com',
    name: 'Test User',
    description: 'Regular user - can browse tools, submit analyses, apply to be reviewer',
    role: 'USER',
    reviewerStatus: 'NONE',
  },
  {
    email: 'thomasmee777@gmail.com',
    name: 'Thomas Mee',
    description: 'Administrator & Approved Reviewer - full access',
    role: 'ADMIN',
    reviewerStatus: 'APPROVED',
  },
];

type LoginMode = 'select' | 'user' | 'reviewer';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const isSignup = searchParams.get('signup') === 'true';
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const mode = searchParams.get('mode') as LoginMode | null;
  
  const [loginMode, setLoginMode] = useState<LoginMode>(mode || 'select');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  // Development quick login
  const handleDevLogin = async (devEmail: string) => {
    setLoadingEmail(devEmail);
    setError('');

    try {
      const result = await signIn('dev-login', {
        email: devEmail,
        redirect: false,
      });

      if (result?.error) {
        setError('Login failed. Please try again.');
        setLoadingEmail(null);
      } else if (result?.ok) {
        // Manually redirect after successful login
        window.location.href = callbackUrl;
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      setLoadingEmail(null);
    }
  };

  // Email magic link login
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError('Failed to send magic link. Please try again.');
      } else {
        setEmailSent(true);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-12rem)] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-600"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription className="pt-2">
              We sent a magic link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-gray-500">
            <p>Click the link in the email to sign in to your account.</p>
            <p className="mt-2">The link will expire in 24 hours.</p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setEmailSent(false);
                setEmail('');
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Back to sign in
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Mode selection screen
  if (loginMode === 'select') {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-600"
              >
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                <circle cx="20" cy="10" r="2" />
              </svg>
              <span className="font-bold text-2xl">Bayes at the Bedside</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-4">
              {isSignup ? 'Create an Account' : 'Sign In'}
            </h1>
            <p className="text-gray-600 mt-2">
              Choose how you would like to sign in
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* User/Contributor Option */}
            <Card 
              className="cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all"
              onClick={() => setLoginMode('user')}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-600"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <CardTitle className="text-lg">User / Contributor</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Browse clinical decision tools, submit study analyses, and contribute to the evidence database.
                </p>
                <ul className="text-xs text-gray-500 text-left space-y-1">
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"/></svg>
                    Access diagnostic & treatment calculators
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"/></svg>
                    Submit study analyses for review
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"/></svg>
                    Apply to become a verified reviewer
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  Continue as User
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </Button>
              </CardFooter>
            </Card>

            {/* Verified Clinician Reviewer Option */}
            <Card 
              className="cursor-pointer hover:border-green-500 hover:shadow-lg transition-all"
              onClick={() => setLoginMode('reviewer')}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-600"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <CardTitle className="text-lg">Verified Clinician Reviewer</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Review and verify submitted study analyses. Requires approved application.
                </p>
                <ul className="text-xs text-gray-500 text-left space-y-1">
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"/></svg>
                    All user/contributor features
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"/></svg>
                    Review pending study analyses
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"/></svg>
                    Verified clinician badge
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full border-green-500 text-green-700 hover:bg-green-50">
                  Continue as Reviewer
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Not a verified reviewer yet?{' '}
            <Link href="/apply-reviewer" className="text-blue-600 hover:underline">
              Apply to become one
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // User/Contributor login or Reviewer login
  const isReviewerMode = loginMode === 'reviewer';
  const filteredDevAccounts = isReviewerMode 
    ? DEV_ACCOUNTS.filter(a => a.reviewerStatus === 'APPROVED')
    : DEV_ACCOUNTS;

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Back button */}
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => setLoginMode('select')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          Back to options
        </Button>

        {/* Mode indicator */}
        <div className={`p-3 rounded-lg text-center ${isReviewerMode ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
          <div className="flex items-center justify-center gap-2">
            {isReviewerMode ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                <span className="font-medium text-green-800">Signing in as Verified Clinician Reviewer</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span className="font-medium text-blue-800">Signing in as User / Contributor</span>
              </>
            )}
          </div>
        </div>

        {/* Development Quick Login */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amber-600"
              >
                <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
                <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                <path d="M12 2v2" />
                <path d="M12 22v-2" />
                <path d="m17 20.66-1-1.73" />
                <path d="M11 10.27 7 3.34" />
                <path d="m20.66 17-1.73-1" />
                <path d="m3.34 7 1.73 1" />
                <path d="M14 12h8" />
                <path d="M2 12h2" />
                <path d="m20.66 7-1.73 1" />
                <path d="m3.34 17 1.73-1" />
                <path d="m17 3.34-1 1.73" />
                <path d="m11 13.73-4 6.93" />
              </svg>
              <CardTitle className="text-base text-amber-900">Development Login</CardTitle>
            </div>
            <CardDescription className="text-amber-700">
              Quick login for testing (development mode only)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredDevAccounts.map((account) => (
              <button
                key={account.email}
                onClick={() => handleDevLogin(account.email)}
                disabled={loadingEmail !== null}
                className="w-full p-3 text-left border border-amber-200 rounded-lg bg-white hover:bg-amber-100 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{account.name}</p>
                    <p className="text-xs text-gray-500">{account.email}</p>
                    <p className="text-xs text-gray-400 mt-1">{account.description}</p>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-xs px-2 py-1 rounded ${
                      account.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-700'
                        : account.role === 'REVIEWER'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {account.role}
                    </span>
                    {loadingEmail === account.email && (
                      <svg
                        className="animate-spin ml-2 h-4 w-4 text-amber-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or continue with email</span>
          </div>
        </div>

        {/* Email Login */}
        <Card>
          <CardHeader className="text-center">
            <Link href="/" className="mx-auto mb-4 flex items-center space-x-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-600"
              >
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                <circle cx="20" cy="10" r="2" />
              </svg>
              <span className="font-bold text-xl">Bayes at the Bedside</span>
            </Link>
            <CardTitle>{isSignup ? 'Create an account' : 'Welcome back'}</CardTitle>
            <CardDescription>
              {isSignup
                ? 'Enter your email to create an account'
                : 'Enter your email to sign in to your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              
              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Sending magic link...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    {isSignup ? 'Sign up with Email' : 'Sign in with Email'}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-gray-500">
              {isSignup ? (
                <>
                  Already have an account?{' '}
                  <Link href="/login" className="text-blue-600 hover:underline">
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{' '}
                  <Link href="/login?signup=true" className="text-blue-600 hover:underline">
                    Sign up
                  </Link>
                </>
              )}
            </div>
            {!isReviewerMode && (
              <p className="text-center text-xs text-gray-500">
                Want to review study analyses?{' '}
                <Link href="/apply-reviewer" className="text-blue-600 hover:underline">
                  Apply to become a verified reviewer
                </Link>
              </p>
            )}
            <p className="text-center text-xs text-gray-400">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
