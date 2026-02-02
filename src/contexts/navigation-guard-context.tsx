'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface NavigationGuardContextType {
  // Whether navigation should be blocked
  shouldBlockNavigation: boolean;
  setShouldBlockNavigation: (value: boolean) => void;
  
  // Pending navigation URL
  pendingNavigation: string | null;
  setPendingNavigation: (url: string | null) => void;
  
  // Functions to handle navigation
  attemptNavigation: (url: string) => boolean; // Returns true if navigation proceeded, false if blocked
  confirmNavigation: () => void;
  cancelNavigation: () => void;
  
  // Callback when user tries to navigate away
  onNavigationAttempt: (() => void) | null;
  setOnNavigationAttempt: (callback: (() => void) | null) => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextType | null>(null);

export function NavigationGuardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [shouldBlockNavigation, setShouldBlockNavigation] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [onNavigationAttempt, setOnNavigationAttempt] = useState<(() => void) | null>(null);

  // Reset guard when pathname changes (user successfully navigated)
  useEffect(() => {
    setShouldBlockNavigation(false);
    setPendingNavigation(null);
  }, [pathname]);

  const attemptNavigation = useCallback((url: string): boolean => {
    if (shouldBlockNavigation) {
      setPendingNavigation(url);
      if (onNavigationAttempt) {
        onNavigationAttempt();
      }
      return false;
    }
    router.push(url);
    return true;
  }, [shouldBlockNavigation, onNavigationAttempt, router]);

  const confirmNavigation = useCallback(() => {
    if (pendingNavigation) {
      setShouldBlockNavigation(false);
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [pendingNavigation, router]);

  const cancelNavigation = useCallback(() => {
    setPendingNavigation(null);
  }, []);

  const value: NavigationGuardContextType = {
    shouldBlockNavigation,
    setShouldBlockNavigation,
    pendingNavigation,
    setPendingNavigation,
    attemptNavigation,
    confirmNavigation,
    cancelNavigation,
    onNavigationAttempt,
    setOnNavigationAttempt: (cb) => setOnNavigationAttempt(() => cb),
  };

  return (
    <NavigationGuardContext.Provider value={value}>
      {children}
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard() {
  const context = useContext(NavigationGuardContext);
  if (!context) {
    throw new Error('useNavigationGuard must be used within a NavigationGuardProvider');
  }
  return context;
}

// Custom hook for components that want to guard against navigation
export function useNavigationBlock(shouldBlock: boolean, onAttempt?: () => void) {
  const { setShouldBlockNavigation, setOnNavigationAttempt } = useNavigationGuard();

  useEffect(() => {
    setShouldBlockNavigation(shouldBlock);
  }, [shouldBlock, setShouldBlockNavigation]);

  useEffect(() => {
    if (onAttempt) {
      setOnNavigationAttempt(onAttempt);
    }
    return () => setOnNavigationAttempt(null);
  }, [onAttempt, setOnNavigationAttempt]);
}
