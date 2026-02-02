'use server';

import { prisma } from '@/lib/db';

interface ProcessApplicationData {
  applicationId: string;
  userId: string;
  decision: 'APPROVED' | 'DENIED';
  notes: string | null;
}

interface ProcessApplicationResult {
  success: boolean;
  error?: string;
}

export async function processApplication(data: ProcessApplicationData): Promise<ProcessApplicationResult> {
  try {
    // Update the application
    await prisma.reviewerApplication.update({
      where: { id: data.applicationId },
      data: {
        status: data.decision,
        reviewerNotes: data.notes,
      },
    });

    // Update the user's reviewer status and role
    if (data.decision === 'APPROVED') {
      await prisma.user.update({
        where: { id: data.userId },
        data: {
          reviewerStatus: 'APPROVED',
          role: 'REVIEWER',
        },
      });

      // Check if we now have enough reviewers to start assigning
      const reviewerCount = await prisma.user.count({
        where: {
          role: { in: ['REVIEWER', 'MODERATOR', 'ADMIN'] },
          reviewerStatus: 'APPROVED',
        },
      });

      if (reviewerCount >= 3) {
        // Assign reviewers to any pending analyses that don't have reviewers yet
        await assignReviewersToPendingAnalyses();
      }
    } else {
      await prisma.user.update({
        where: { id: data.userId },
        data: {
          reviewerStatus: 'DENIED',
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Process application error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process application',
    };
  }
}

/**
 * Assign reviewers to pending analyses that don't have any assigned yet
 */
async function assignReviewersToPendingAnalyses(): Promise<void> {
  try {
    // Get all pending analyses without any reviews
    const pendingAnalyses = await prisma.analysis.findMany({
      where: {
        status: 'PENDING_REVIEW',
        reviews: {
          none: {},
        },
      },
    });

    if (pendingAnalyses.length === 0) {
      return;
    }

    // Get all approved reviewers
    const eligibleReviewers = await prisma.user.findMany({
      where: {
        role: { in: ['REVIEWER', 'MODERATOR', 'ADMIN'] },
        reviewerStatus: 'APPROVED',
      },
    });

    if (eligibleReviewers.length < 2) {
      return;
    }

    console.log(`Assigning reviewers to ${pendingAnalyses.length} pending analyses`);

    for (const analysis of pendingAnalyses) {
      // Filter out the submitter
      const availableReviewers = eligibleReviewers.filter(
        r => r.id !== analysis.createdByUserId
      );

      if (availableReviewers.length < 2) {
        continue;
      }

      // Shuffle and pick 2
      const shuffled = availableReviewers.sort(() => Math.random() - 0.5);
      const selectedReviewers = shuffled.slice(0, 2);

      // Create review records
      for (const reviewer of selectedReviewers) {
        await prisma.review.create({
          data: {
            analysisId: analysis.id,
            reviewerId: reviewer.id,
            decision: null,
            structuredFlags: null,
            comments: null,
          },
        });
      }

      console.log(`Assigned reviewers to analysis ${analysis.id}`);
    }
  } catch (error) {
    console.error('Error assigning reviewers to pending analyses:', error);
  }
}
