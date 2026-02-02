'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// Decision types
type ReviewDecision = 'APPROVE' | 'APPROVE_WITH_EDITS' | 'REJECT';

interface SubmitReviewData {
  analysisId: string;
  decision: ReviewDecision;
  feedback: string;
}

interface SubmitReviewResult {
  success: boolean;
  error?: string;
  analysisStatus?: string;
}

/**
 * Submit a review decision for an analysis
 * 
 * Decision rules:
 * - APPROVE: feedback is optional
 * - APPROVE_WITH_EDITS: feedback is required (min 20 chars)
 * - REJECT: feedback is required (min 20 chars)
 * 
 * After both reviews are submitted:
 * - Both APPROVE → VERIFIED (auto-promote submitter to CONTRIBUTOR)
 * - Any REJECT → REJECTED
 * - No rejects + at least one APPROVE_WITH_EDITS → NEEDS_REVISION
 */
export async function submitReview(data: SubmitReviewData): Promise<SubmitReviewResult> {
  try {
    // Get the current user session
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'You must be logged in to submit a review' };
    }
    const reviewerId = session.user.id;

    // Validate feedback requirement
    if (data.decision === 'APPROVE_WITH_EDITS' || data.decision === 'REJECT') {
      if (!data.feedback || data.feedback.trim().length < 20) {
        return { 
          success: false, 
          error: `Feedback is required for ${data.decision === 'REJECT' ? 'rejection' : 'edits requested'} (minimum 20 characters)` 
        };
      }
    }

    // Check if review exists for this reviewer
    const existingReview = await prisma.review.findFirst({
      where: {
        analysisId: data.analysisId,
        reviewerId: reviewerId,
      },
    });

    if (!existingReview) {
      return { success: false, error: 'You are not assigned to review this analysis' };
    }

    if (existingReview.decision !== null) {
      return { success: false, error: 'You have already submitted a review for this analysis' };
    }

    // Update the review
    await prisma.review.update({
      where: { id: existingReview.id },
      data: {
        decision: data.decision,
        feedback: data.feedback || null,
        completedAt: new Date(),
      },
    });

    // Check if all reviews are complete
    const allReviews = await prisma.review.findMany({
      where: { analysisId: data.analysisId },
    });

    const completedReviews = allReviews.filter(r => r.decision !== null);

    // Only finalize when both reviews are complete
    if (completedReviews.length >= 2) {
      const decisions = completedReviews.map(r => r.decision as ReviewDecision);
      
      // Get the analysis to find the submitter
      const analysis = await prisma.analysis.findUnique({
        where: { id: data.analysisId },
        select: { createdByUserId: true },
      });

      if (!analysis) {
        return { success: false, error: 'Analysis not found' };
      }

      // Determine final status based on review decisions
      let newStatus: string;

      if (decisions.every(d => d === 'APPROVE')) {
        // Both approve - verified
        newStatus = 'VERIFIED';
        
        // Auto-promote the analysis author to CONTRIBUTOR tier
        await prisma.user.updateMany({
          where: {
            id: analysis.createdByUserId,
            accountTier: 'USER', // Only upgrade if currently USER
          },
          data: {
            accountTier: 'CONTRIBUTOR',
          },
        });
        console.log(`Promoted user ${analysis.createdByUserId} to CONTRIBUTOR tier`);
        
      } else if (decisions.includes('REJECT')) {
        // Any reject - rejected
        newStatus = 'REJECTED';
        
      } else if (decisions.includes('APPROVE_WITH_EDITS')) {
        // No rejects, at least one approve with edits - needs revision
        newStatus = 'NEEDS_REVISION';
        
      } else {
        // Fallback (shouldn't happen with valid decisions)
        newStatus = 'PENDING_REVIEW';
      }

      // Update analysis status
      await prisma.analysis.update({
        where: { id: data.analysisId },
        data: { status: newStatus },
      });

      // Create feedback records for the submitter
      for (const review of completedReviews) {
        await prisma.reviewFeedback.create({
          data: {
            analysisId: data.analysisId,
            submitterId: analysis.createdByUserId,
            reviewerId: review.reviewerId,
            decision: review.decision!,
            feedbackText: review.feedback,
          },
        });
      }

      return { success: true, analysisStatus: newStatus };
    }

    return { success: true, analysisStatus: 'PENDING_REVIEW' };
  } catch (error) {
    console.error('Submit review error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit review',
    };
  }
}

/**
 * Assign reviewers to an analysis
 * Called when a new analysis is submitted
 * 
 * Rules:
 * - Assigns exactly 2 reviewers
 * - Excludes the submitter from being assigned
 * - Prefers reviewers with fewer active assignments (weighted random)
 * - If < 2 eligible reviewers, no assignment occurs
 */
export async function assignReviewers(analysisId: string, submitterId: string | null): Promise<{
  assigned: number;
  message: string;
}> {
  try {
    // Get all approved reviewers with their active review counts
    const eligibleReviewers = await prisma.user.findMany({
      where: {
        role: { in: ['REVIEWER', 'MODERATOR', 'ADMIN'] },
        reviewerStatus: 'APPROVED',
        ...(submitterId && { id: { not: submitterId } }),
      },
      include: {
        assignedReviews: {
          where: {
            decision: null, // Only count incomplete reviews as "active"
          },
        },
      },
    });

    if (eligibleReviewers.length < 2) {
      console.log(`Not enough eligible reviewers (${eligibleReviewers.length}/2 needed). Analysis ${analysisId} will remain pending without assignments.`);
      return {
        assigned: 0,
        message: `Not enough approved reviewers yet (need 2, have ${eligibleReviewers.length})`,
      };
    }

    // Sort by active review count (ascending) and add some randomness
    // Reviewers with fewer active reviews are more likely to be selected
    const reviewersWithWeight = eligibleReviewers.map(r => ({
      ...r,
      activeCount: r.assignedReviews.length,
      // Weight: inverse of active count + 1 (to avoid division by zero)
      weight: 1 / (r.assignedReviews.length + 1),
    }));

    // Select 2 reviewers using weighted random selection
    const selectedReviewers: typeof reviewersWithWeight = [];
    const remaining = [...reviewersWithWeight];

    for (let i = 0; i < 2 && remaining.length > 0; i++) {
      const totalWeight = remaining.reduce((sum, r) => sum + r.weight, 0);
      let random = Math.random() * totalWeight;
      
      for (let j = 0; j < remaining.length; j++) {
        random -= remaining[j].weight;
        if (random <= 0) {
          selectedReviewers.push(remaining[j]);
          remaining.splice(j, 1);
          break;
        }
      }
    }

    // Create review records (without decision - pending)
    for (let i = 0; i < selectedReviewers.length; i++) {
      const reviewer = selectedReviewers[i];
      await prisma.review.create({
        data: {
          analysisId,
          reviewerId: reviewer.id,
          decision: null,
          feedback: null,
          reviewOrder: i + 1,
        },
      });
    }

    console.log(`Assigned ${selectedReviewers.length} reviewers to analysis ${analysisId}`);
    return {
      assigned: selectedReviewers.length,
      message: `Assigned ${selectedReviewers.length} reviewers`,
    };
  } catch (error) {
    console.error('Error assigning reviewers:', error);
    return {
      assigned: 0,
      message: error instanceof Error ? error.message : 'Failed to assign reviewers',
    };
  }
}

/**
 * Assign reviewers to all pending analyses that don't have reviewers yet
 * Called when a new reviewer is approved
 */
export async function assignReviewersToPendingAnalyses(): Promise<void> {
  try {
    // Find all analyses that are pending review and have fewer than 2 assigned reviewers
    const pendingAnalyses = await prisma.analysis.findMany({
      where: {
        status: 'PENDING_REVIEW',
      },
      include: {
        reviews: true,
      },
    });

    for (const analysis of pendingAnalyses) {
      if (analysis.reviews.length < 2) {
        console.log(`Attempting to assign reviewers to analysis ${analysis.id}`);
        await assignReviewers(analysis.id, analysis.createdByUserId);
      }
    }
  } catch (error) {
    console.error('Error assigning reviewers to pending analyses:', error);
  }
}

/**
 * Get review feedback for a submitter's analysis
 */
export async function getReviewFeedback(analysisId: string): Promise<{
  feedback: Array<{
    id: string;
    decision: string;
    feedbackText: string | null;
    reviewerName: string | null;
    createdAt: Date;
    isRead: boolean;
  }>;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { feedback: [] };
  }

  const feedbackRecords = await prisma.reviewFeedback.findMany({
    where: {
      analysisId,
      submitterId: session.user.id,
    },
    include: {
      reviewerUser: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    feedback: feedbackRecords.map(f => ({
      id: f.id,
      decision: f.decision,
      feedbackText: f.feedbackText,
      reviewerName: f.reviewerUser.name,
      createdAt: f.createdAt,
      isRead: f.isRead,
    })),
  };
}

/**
 * Mark feedback as read
 */
export async function markFeedbackAsRead(feedbackId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }

  await prisma.reviewFeedback.updateMany({
    where: {
      id: feedbackId,
      submitterId: session.user.id,
    },
    data: {
      isRead: true,
    },
  });
}
