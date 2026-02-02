'use client';

import { SessionProvider } from 'next-auth/react';
import { NavigationGuardProvider } from '@/contexts/navigation-guard-context';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <NavigationGuardProvider>
        {children}
      </NavigationGuardProvider>
    </SessionProvider>
  );
}
