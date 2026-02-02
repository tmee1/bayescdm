import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

async function getUserSubmissions(userId: string) {
  try {
    const analyses = await prisma.analysis.findMany({
      where: {
        createdByUserId: userId,
      },
      include: {
        study: true,
        reviews: true,
        reviewFeedback: {
          where: {
            submitterId: userId,
          },
          orderBy: {
            createdAt: 'desc',
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

function getStatusBadge(status: string) {
  switch (status) {
    case 'VERIFIED':
      return 'bg-green-100 text-green-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    case 'NEEDS_REVISION':
      return 'bg-amber-100 text-amber-800';
    case 'PENDING_REVIEW':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'VERIFIED':
      return 'Verified';
    case 'REJECTED':
      return 'Rejected';
    case 'NEEDS_REVISION':
      return 'Needs Revision';
    case 'PENDING_REVIEW':
      return 'Pending Review';
    default:
      return status;
  }
}

export default async function MySubmissionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?callbackUrl=/my-submissions');
  }

  const submissions = await getUserSubmissions(session.user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
        <p className="mt-2 text-gray-600">
          Track the status of your submitted analyses and view reviewer feedback.
        </p>
      </div>

      {submissions.length === 0 ? (
        <Card>
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Submissions Yet
            </h2>
            <p className="text-gray-600 mb-6">
              You haven&apos;t submitted any analyses yet.
            </p>
            <Link href="/submit">
              <Button>Submit Your First Analysis</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {submissions.map((analysis) => (
            <Card key={analysis.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{analysis.study.title}</CardTitle>
                    <CardDescription>
                      {analysis.category} • {analysis.study.journal} ({analysis.study.year})
                    </CardDescription>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(analysis.status)}`}>
                    {getStatusLabel(analysis.status)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Review Progress */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    Reviews completed: {analysis.reviews.filter(r => r.decision !== null).length}/2
                  </span>
                  <span>•</span>
                  <span>Submitted {new Date(analysis.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Feedback Section */}
                {analysis.reviewFeedback.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Reviewer Feedback</h4>
                    <div className="space-y-3">
                      {analysis.reviewFeedback.map((feedback) => (
                        <div
                          key={feedback.id}
                          className={`p-4 rounded-lg border ${
                            feedback.decision === 'APPROVE'
                              ? 'bg-green-50 border-green-200'
                              : feedback.decision === 'REJECT'
                              ? 'bg-red-50 border-red-200'
                              : 'bg-amber-50 border-amber-200'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-sm font-medium ${
                              feedback.decision === 'APPROVE'
                                ? 'text-green-700'
                                : feedback.decision === 'REJECT'
                                ? 'text-red-700'
                                : 'text-amber-700'
                            }`}>
                              {feedback.decision === 'APPROVE'
                                ? 'Approved'
                                : feedback.decision === 'REJECT'
                                ? 'Rejected'
                                : 'Approved with Edits Required'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(feedback.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {feedback.feedbackText && (
                            <p className="text-sm text-gray-700">{feedback.feedbackText}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <Link href={`/my-submissions/${analysis.id}`}>
                    <Button variant="outline">View Details</Button>
                  </Link>
                  {analysis.status === 'NEEDS_REVISION' && (
                    <Link href={`/submit?revise=${analysis.id}`}>
                      <Button>Revise & Resubmit</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
