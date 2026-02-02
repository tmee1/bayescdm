'use client';

import React from 'react';
import { useNavigationGuard } from '@/contexts/navigation-guard-context';

interface GuardedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function GuardedLink({ href, children, className, onClick }: GuardedLinkProps) {
  const { attemptNavigation } = useNavigationGuard();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onClick) {
      onClick();
    }
    attemptNavigation(href);
  };

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
