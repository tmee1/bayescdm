import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth, canReview } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

async function getPendingReviews(userId: string) {
  try {
    // Get reviews assigned to this user
    const assignedReviews = await prisma.review.findMany({
      where: {
        reviewerId: userId,
        decision: null, // Not yet reviewed
      },
      include: {
        analysis: {
          include: {
            study: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return assignedReviews;
  } catch {
    return [];
  }
}

async function getAllPendingAnalyses() {
  try {
    const analyses = await prisma.analysis.findMany({
      where: {
        status: 'PENDING_REVIEW',
      },
      include: {
        study: true,
        reviews: {
          include: {
            reviewer: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return analyses;
  } catch {
    return [];
  }
}

export default async function ReviewPage() {
  const session = await auth();

  // Check authentication
  if (!session?.user) {
    redirect('/login?callbackUrl=/review');
  }

  // Check if user can review
  const userCanReview = canReview(session.user.role, session.user.reviewerStatus);

  if (!userCanReview) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-4 text-gray-300"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Reviewer Access Required
            </h2>
            <p className="text-gray-600 mb-6">
              You need to be an approved reviewer to access this page.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>Current role: <span className="font-medium">{session.user.role}</span></p>
              <p>Reviewer status: <span className="font-medium">{session.user.reviewerStatus}</span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingAnalyses = await getAllPendingAnalyses();
  const myReviews = await getPendingReviews(session.user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Review Queue</h1>
        <p className="mt-2 text-gray-600">
          Review submitted analyses for accuracy and quality.
        </p>
      </div>

      {/* My Assigned Reviews */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Assigned Reviews</h2>
        {myReviews.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">No reviews assigned to you.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {myReviews.map((review) => (
              <Card key={review.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{review.analysis.study.title}</CardTitle>
                  <CardDescription>
                    {review.analysis.category} • {review.analysis.study.journal} ({review.analysis.study.year})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Submitted {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                    <Link href={`/review/${review.analysisId}`}>
                      <Button>Review Now</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* All Pending Analyses */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">All Pending Submissions</h2>
        {pendingAnalyses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">No pending submissions to review.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingAnalyses.map((analysis) => (
              <Card key={analysis.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{analysis.study.title}</CardTitle>
                      <CardDescription>
                        {analysis.category} • {analysis.study.journal} ({analysis.study.year})
                      </CardDescription>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded">
                      Pending Review
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      <p>Reviewers assigned: {analysis.reviews.length}/2</p>
                      {analysis.reviews.length > 0 && (
                        <p className="text-xs mt-1">
                          {analysis.reviews.map(r => r.reviewer?.name || r.reviewer?.email).join(', ')}
                        </p>
                      )}
                    </div>
                    <Link href={`/review/${analysis.id}`}>
                      <Button variant="outline">View Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
