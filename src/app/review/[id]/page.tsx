import { redirect, notFound } from 'next/navigation';
import { auth, canReview } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReviewForm } from './review-form';

async function getAnalysisForReview(id: string) {
  try {
    const analysis = await prisma.analysis.findUnique({
      where: { id },
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
            reviewer: true,
          },
        },
        createdBy: true,
      },
    });

    return analysis;
  } catch {
    return null;
  }
}

export default async function ReviewDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/login?callbackUrl=/review/${params.id}`);
  }

  const userCanReview = canReview(session.user.role, session.user.reviewerStatus);

  if (!userCanReview) {
    redirect('/review');
  }

  const analysis = await getAnalysisForReview(params.id);

  if (!analysis) {
    notFound();
  }

  // Check if user has already reviewed
  const existingReview = analysis.reviews.find(r => r.reviewerId === session.user.id);
  const hasReviewed = existingReview?.decision !== null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Review Analysis</h1>
        <p className="mt-2 text-gray-600">
          Evaluate the accuracy and quality of this submission.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Study Details */}
          <Card>
            <CardHeader>
              <CardTitle>{analysis.study.title}</CardTitle>
              <CardDescription>
                {analysis.study.authors} • {analysis.study.journal} ({analysis.study.year})
              </CardDescription>
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
                      {/* Calculate LR */}
                      {(() => {
                        const totalDisease = interval.truePositives + interval.falseNegatives;
                        const totalNonDisease = interval.falsePositives + interval.trueNegatives;
                        if (totalDisease > 0 && totalNonDisease > 0) {
                          const sensitivity = interval.tp / totalDisease;
                          const fpRate = interval.fp / totalNonDisease;
                          const lr = fpRate > 0 ? sensitivity / fpRate : Infinity;
                          return (
                            <div className="mt-3 pt-3 border-t">
                              <span className="text-gray-500">Calculated LR:</span>{' '}
                              <span className="font-medium">
                                {lr === Infinity ? '∞' : lr.toFixed(2)}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
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

          {/* Quality Assessment */}
          {analysis.qualityAssessment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quality Assessment</CardTitle>
                <CardDescription>{analysis.qualityAssessment.assessmentType}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Overall Risk of Bias</p>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded ${
                      analysis.qualityAssessment.overallRisk === 'LOW'
                        ? 'bg-green-100 text-green-800'
                        : analysis.qualityAssessment.overallRisk === 'HIGH'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {analysis.qualityAssessment.overallRisk}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Applicability</p>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded ${
                      analysis.qualityAssessment.applicability === 'LOW_CONCERN'
                        ? 'bg-green-100 text-green-800'
                        : analysis.qualityAssessment.applicability === 'HIGH'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {analysis.qualityAssessment.applicability}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Review Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Review Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Analysis Status</p>
                <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded">
                  {analysis.status}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Reviews</p>
                <p className="text-sm">{analysis.reviews.length} of 2 assigned</p>
              </div>
              {analysis.reviews.length > 0 && (
                <div className="space-y-2">
                  {analysis.reviews.map((review) => (
                    <div key={review.id} className="text-sm p-2 bg-gray-50 rounded">
                      <p className="font-medium">{review.reviewer?.name || review.reviewer?.email}</p>
                      <p className="text-gray-500">
                        {review.decision ? (
                          <span className={`${
                            review.decision === 'APPROVE' ? 'text-green-600' :
                            review.decision === 'REJECT' ? 'text-red-600' :
                            'text-amber-600'
                          }`}>
                            {review.decision === 'APPROVE' ? 'Approved' :
                             review.decision === 'REJECT' ? 'Rejected' :
                             'Approved with Edits'}
                          </span>
                        ) : (
                          'Pending'
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {hasReviewed ? (
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
                  className="mx-auto mb-4 text-green-500"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <p className="font-medium text-gray-900">Review Submitted</p>
                <p className="text-sm text-gray-500 mt-1">
                  Decision: {existingReview?.decision === 'APPROVE' ? 'Approved' :
                    existingReview?.decision === 'REJECT' ? 'Rejected' :
                    'Approved with Edits'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <ReviewForm analysisId={analysis.id} />
          )}
        </div>
      </div>
    </div>
  );
}
