'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { GuardedLink } from '@/components/guarded-link';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Diagnostic Decision Tool', href: '/diagnostic' },
  { name: 'Treatment Effect Tool', href: '/treatment' },
  { name: 'Evidence Library', href: '/browse' },
  { name: 'Contribute', href: '/submit' },
  { name: 'My Submissions', href: '/my-submissions', authRequired: true },
];

export function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isReviewer = session?.user?.role === 'REVIEWER' || 
                     session?.user?.role === 'MODERATOR' || 
                     session?.user?.role === 'ADMIN';
  
  const isAdmin = session?.user?.role === 'MODERATOR' || session?.user?.role === 'ADMIN';
  
  const canApplyAsReviewer = session?.user && 
                             session.user.role === 'USER' && 
                             session.user.reviewerStatus === 'NONE';
  
  const hasAppliedAsReviewer = session?.user?.reviewerStatus === 'APPLIED';
  const isApprovedReviewer = session?.user?.reviewerStatus === 'APPROVED' && isReviewer;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <GuardedLink href="/" className="flex items-center space-x-2">
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
          <span className="hidden font-bold text-xl sm:inline-block">Bayes at the Bedside</span>
        </GuardedLink>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navigation.map((item) => {
            // Skip auth-required items if not logged in
            if ('authRequired' in item && item.authRequired && !session?.user) {
              return null;
            }
            return (
              <GuardedLink
                key={item.name}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-blue-600',
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'text-blue-600'
                    : 'text-gray-600'
                )}
              >
                {item.name}
              </GuardedLink>
            );
          })}
          
          {/* Reviewer link */}
          {isReviewer && (
            <GuardedLink
              href="/review"
              className={cn(
                'text-sm font-medium transition-colors hover:text-blue-600',
                pathname === '/review' || pathname.startsWith('/review/')
                  ? 'text-blue-600'
                  : 'text-gray-600'
              )}
            >
              Review Queue
            </GuardedLink>
          )}
          
          {/* Admin link */}
          {isAdmin && (
            <GuardedLink
              href="/admin/reviewer-applications"
              className={cn(
                'text-sm font-medium transition-colors hover:text-blue-600',
                pathname.startsWith('/admin')
                  ? 'text-blue-600'
                  : 'text-gray-600'
              )}
            >
              Admin
            </GuardedLink>
          )}
        </nav>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {status === 'loading' ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          ) : session?.user ? (
            <div className="flex items-center space-x-3">
              {canApplyAsReviewer && (
                <GuardedLink href="/apply-reviewer">
                  <Button variant="outline" size="sm">
                    Become a Reviewer
                  </Button>
                </GuardedLink>
              )}
              {hasAppliedAsReviewer && (
                <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                  Application Pending
                </span>
              )}
              {isApprovedReviewer && (
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                  Verified Reviewer
                </span>
              )}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{session.user.name || session.user.email}</p>
                <p className="text-xs text-gray-500">{session.user.role}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <GuardedLink href="/login">
              <Button size="sm">Sign in</Button>
            </GuardedLink>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
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
          >
            {mobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="container mx-auto px-4 py-4 space-y-2">
            {navigation.map((item) => {
              // Skip auth-required items if not logged in
              if ('authRequired' in item && item.authRequired && !session?.user) {
                return null;
              }
              return (
                <GuardedLink
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'block py-2 text-sm font-medium transition-colors',
                    pathname === item.href || pathname.startsWith(item.href + '/')
                      ? 'text-blue-600'
                      : 'text-gray-600'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </GuardedLink>
              );
            })}
            
            {/* Reviewer link for mobile */}
            {isReviewer && (
              <GuardedLink
                href="/review"
                className={cn(
                  'block py-2 text-sm font-medium transition-colors',
                  pathname === '/review' || pathname.startsWith('/review/')
                    ? 'text-blue-600'
                    : 'text-gray-600'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                Review Queue
              </GuardedLink>
            )}
            
            {/* Admin link for mobile */}
            {isAdmin && (
              <GuardedLink
                href="/admin/reviewer-applications"
                className={cn(
                  'block py-2 text-sm font-medium transition-colors',
                  pathname.startsWith('/admin')
                    ? 'text-blue-600'
                    : 'text-gray-600'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin
              </GuardedLink>
            )}

            {/* Mobile auth */}
            <div className="pt-4 border-t mt-4">
              {session?.user ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Signed in as <strong>{session.user.name || session.user.email}</strong>
                  </p>
                  {canApplyAsReviewer && (
                    <GuardedLink href="/apply-reviewer" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full mb-2">
                        Become a Reviewer
                      </Button>
                    </GuardedLink>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    Sign out
                  </Button>
                </div>
              ) : (
                <GuardedLink href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full">Sign in</Button>
                </GuardedLink>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
