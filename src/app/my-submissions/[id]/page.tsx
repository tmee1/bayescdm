import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

async function getSubmission(id: string, userId: string) {
  try {
    const analysis = await prisma.analysis.findFirst({
      where: {
        id,
        createdByUserId: userId,
      },
      include: {
        study: true,
        diagnosticDetails: {
          include: {
            intervals: true,
          },
        },
        treatmentDetails: {
          include: {
            arms: true,
          },
        },
        qualityAssessment: true,
        reviews: {
          include: {
            reviewer: {
              select: { name: true },
            },
          },
        },
        reviewFeedback: {
          where: {
            submitterId: userId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return analysis;
  } catch {
    return null;
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

export default async function SubmissionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/login?callbackUrl=/my-submissions/${params.id}`);
  }

  const analysis = await getSubmission(params.id, session.user.id);

  if (!analysis) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/my-submissions" className="text-blue-600 hover:underline text-sm">
          ← Back to My Submissions
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Study Details */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{analysis.study.title}</CardTitle>
                  <CardDescription>
                    {analysis.study.authors} • {analysis.study.journal} ({analysis.study.year})
                  </CardDescription>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusBadge(analysis.status)}`}>
                  {getStatusLabel(analysis.status)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.study.doi && (
                <p className="text-sm">
                  <span className="text-gray-500">DOI:</span>{' '}
                  <a
                    href={`https://doi.org/${analysis.study.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {analysis.study.doi}
                  </a>
                </p>
              )}
              {analysis.study.pmid && (
                <p className="text-sm">
                  <span className="text-gray-500">PMID:</span>{' '}
                  <a
                    href={`https://pubmed.ncbi.nlm.nih.gov/${analysis.study.pmid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {analysis.study.pmid}
                  </a>
                </p>
              )}
            </CardContent>
          </Card>

          {/* PICO Elements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">PICO Elements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Population</p>
                <p className="text-sm">{analysis.population || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {analysis.category === 'DIAGNOSTIC' ? 'Diagnostic Test' : 'Intervention'}
                </p>
                <p className="text-sm">
                  {analysis.category === 'DIAGNOSTIC' 
                    ? analysis.testName || 'Not specified'
                    : analysis.intervention || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {analysis.category === 'DIAGNOSTIC' ? 'Reference Standard' : 'Comparator'}
                </p>
                <p className="text-sm">{analysis.comparator || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Outcome</p>
                <p className="text-sm">{analysis.outcome || 'Not specified'}</p>
              </div>
              {analysis.setting && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Setting</p>
                  <p className="text-sm">{analysis.setting}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data */}
          {analysis.category === 'DIAGNOSTIC' && analysis.diagnosticDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Diagnostic Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.diagnosticDetails.intervals.map((interval, index) => (
                    <div key={interval.id} className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-3">
                        Interval {index + 1}: {interval.label}
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">True Positives:</span> {interval.truePositives}
                        </div>
                        <div>
                          <span className="text-gray-500">False Positives:</span> {interval.falsePositives}
                        </div>
                        <div>
                          <span className="text-gray-500">False Negatives:</span> {interval.falseNegatives}
                        </div>
                        <div>
                          <span className="text-gray-500">True Negatives:</span> {interval.trueNegatives}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {analysis.category === 'TREATMENT' && analysis.treatmentDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Treatment Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {analysis.treatmentDetails.arms.map((arm) => (
                    <div key={arm.id} className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-3">
                        {arm.armType === 'INTERVENTION' ? 'Intervention Arm' : 'Control Arm'}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Total:</span> {arm.nTotal}
                        </div>
                        <div>
                          <span className="text-gray-500">Events:</span> {arm.nEvents}
                        </div>
                        <div>
                          <span className="text-gray-500">Event Rate:</span>{' '}
                          {arm.nTotal > 0 ? ((arm.nEvents / arm.nTotal) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submission Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded ${getStatusBadge(analysis.status)}`}>
                  {getStatusLabel(analysis.status)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Reviews</p>
                <p className="text-sm">{analysis.reviews.filter(r => r.decision !== null).length} of 2 completed</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Submitted</p>
                <p className="text-sm">{new Date(analysis.createdAt).toLocaleDateString()}</p>
              </div>
              
              {analysis.status === 'NEEDS_REVISION' && (
                <Link href={`/submit?revise=${analysis.id}`}>
                  <Button className="w-full">Revise & Resubmit</Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Reviewer Feedback Card */}
          {analysis.reviewFeedback.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reviewer Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                          : 'Edits Required'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {feedback.feedbackText && (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{feedback.feedbackText}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* No Feedback Yet */}
          {analysis.reviewFeedback.length === 0 && analysis.status === 'PENDING_REVIEW' && (
            <Card>
              <CardContent className="py-8 text-center">
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
                  className="mx-auto mb-3 text-gray-300"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <p className="text-sm text-gray-500">
                  Awaiting reviewer feedback
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
