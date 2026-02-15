import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
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

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.AUTH_DEBUG === 'true';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  // Always include adapter - required for EmailProvider
  // Cast to any to avoid type mismatch with custom User fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // Credentials provider for development testing (must be first for dev)
    ...(isDevelopment ? [
      CredentialsProvider({
        id: 'dev-login',
        name: 'Development Login',
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
    ] : []),
    // Email provider for production using Resend HTTP API
    ...(process.env.RESEND_API_KEY ? [
      {
        id: 'resend',
        name: 'Email',
        type: 'email' as const,
        maxAge: 24 * 60 * 60, // 24 hours
        sendVerificationRequest: async ({ identifier: email, url }: { identifier: string; url: string }) => {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM || 'Bayes at the Bedside <onboarding@resend.dev>',
              to: email,
              subject: 'Sign in to Bayes at the Bedside',
              html: `
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                  <h1 style="color: #1e40af; margin-bottom: 20px;">Bayes at the Bedside</h1>
                  <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                    Click the button below to sign in to your account. This link will expire in 24 hours.
                  </p>
                  <a href="${url}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px;">
                    Sign in to Bayes at the Bedside
                  </a>
                  <p style="font-size: 14px; color: #666; margin-top: 20px;">
                    If you didn't request this email, you can safely ignore it.
                  </p>
                  <p style="font-size: 12px; color: #999; margin-top: 30px;">
                    If the button doesn't work, copy and paste this link into your browser:<br/>
                    <a href="${url}" style="color: #2563eb;">${url}</a>
                  </p>
                </div>
              `,
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            console.error('Failed to send verification email:', error);
            throw new Error('Failed to send verification email');
          }
        },
      },
    ] : []),
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
