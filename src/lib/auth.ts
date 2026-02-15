import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';

// Define types (using strings since SQLite doesn't support enums)
type UserRole = 'USER' | 'REVIEWER' | 'MODERATOR' | 'ADMIN';
type AccountTier = 'USER' | 'CONTRIBUTOR';
type ReviewerStatus = 'NONE' | 'APPLIED' | 'APPROVED' | 'DENIED';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      accountTier: AccountTier;
      reviewerStatus: ReviewerStatus;
    };
  }

  interface User {
    role: UserRole;
    accountTier: AccountTier;
    reviewerStatus: ReviewerStatus;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  // No adapter needed for CredentialsProvider - we handle users manually
  providers: [
    // Simple credentials provider - works in all environments
    CredentialsProvider({
      id: 'credentials',
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        const email = credentials.email as string;
        
        // Find or create the user
        let user = await prisma.user.findUnique({
          where: { email },
        });
        
        if (!user) {
          // Create user with default role
          user = await prisma.user.create({
            data: {
              email,
              name: email.split('@')[0],
              role: 'USER',
              accountTier: 'USER',
              reviewerStatus: 'NONE',
            },
          });
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          accountTier: user.accountTier as AccountTier,
          reviewerStatus: user.reviewerStatus as ReviewerStatus,
        };
      },
    }),
  ],
  session: {
    // Use JWT for credentials provider (required for CredentialsProvider)
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    verifyRequest: '/login/verify',
    error: '/login/error',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On initial sign in, store user data in token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accountTier = user.accountTier;
        token.reviewerStatus = user.reviewerStatus;
      }
      
      // Refresh user data from database on each request to catch role changes
      // (e.g., when a reviewer application is approved)
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, accountTier: true, reviewerStatus: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.accountTier = dbUser.accountTier;
            token.reviewerStatus = dbUser.reviewerStatus;
          }
        } catch (error) {
          // If database lookup fails, keep existing token data
          console.error('Failed to refresh user data:', error);
        }
      }
      
      return token;
    },
    async session({ session, token, user }) {
      if (session.user) {
        // For JWT strategy (dev)
        if (token) {
          session.user.id = token.id as string;
          session.user.role = token.role as UserRole;
          session.user.accountTier = token.accountTier as AccountTier;
          session.user.reviewerStatus = token.reviewerStatus as ReviewerStatus;
        }
        // For database strategy (production)
        if (user) {
          session.user.id = user.id;
          session.user.role = user.role;
          session.user.accountTier = user.accountTier;
          session.user.reviewerStatus = user.reviewerStatus;
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      console.log(`New user created: ${user.email}`);
    },
  },
});

/**
 * Get the current session on the server side
 */
export async function getServerSession() {
  return await auth();
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session;
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Check if user is admin
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'ADMIN';
}

/**
 * Check if user can access moderator features
 */
export function canModerate(role: UserRole): boolean {
  return role === 'MODERATOR' || role === 'ADMIN';
}

/**
 * Check if user can review
 */
export function canReview(role: UserRole, reviewerStatus: ReviewerStatus): boolean {
  return (role === 'REVIEWER' || role === 'MODERATOR' || role === 'ADMIN') && 
         reviewerStatus === 'APPROVED';
}
