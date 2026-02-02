import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

async function getStats() {
  try {
    const [
      verifiedDiagnosticCount,
      verifiedTreatmentCount,
      approvedReviewerCount,
    ] = await Promise.all([
      prisma.analysis.count({
        where: { status: 'VERIFIED', category: 'DIAGNOSTIC' },
      }),
      prisma.analysis.count({
        where: { status: 'VERIFIED', category: 'TREATMENT' },
      }),
      prisma.user.count({
        where: { reviewerStatus: 'APPROVED', role: { in: ['REVIEWER', 'MODERATOR', 'ADMIN'] } },
      }),
    ]);

    return {
      verifiedDiagnosticCount,
      verifiedTreatmentCount,
      totalVerified: verifiedDiagnosticCount + verifiedTreatmentCount,
      approvedReviewerCount,
      hasDiagnosticAnalyses: verifiedDiagnosticCount > 0,
      hasTreatmentAnalyses: verifiedTreatmentCount > 0,
    };
  } catch {
    return {
      verifiedDiagnosticCount: 0,
      verifiedTreatmentCount: 0,
      totalVerified: 0,
      approvedReviewerCount: 0,
      hasDiagnosticAnalyses: false,
      hasTreatmentAnalyses: false,
    };
  }
}

export default async function HomePage() {
  const [stats, session] = await Promise.all([
    getStats(),
    auth(),
  ]);

  // Check if user can apply as reviewer (not already a reviewer or has pending application)
  const canApplyAsReviewer = !session?.user || (
    session.user.role === 'USER' && 
    session.user.reviewerStatus === 'NONE'
  );

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-600"
              >
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                <circle cx="20" cy="10" r="2" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Bayes at the Bedside
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
              Interpret diagnostic and treatment evidence with explicit uncertainty quantification, 
              transparent quality assessment, and grounded Bayesian reasoning.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {stats.hasDiagnosticAnalyses ? (
                <Link href="/diagnostic">
                  <Button size="lg" className="w-full sm:w-auto min-w-[220px]">
                    Diagnostic Decision Tool
                  </Button>
                </Link>
              ) : (
                <Button size="lg" className="w-full sm:w-auto min-w-[220px]" disabled>
                  Diagnostic Decision Tool
                </Button>
              )}
              {stats.hasTreatmentAnalyses ? (
                <Link href="/treatment">
                  <Button size="lg" className="w-full sm:w-auto min-w-[220px]">
                    Treatment Effect Tool
                  </Button>
                </Link>
              ) : (
                <Button size="lg" className="w-full sm:w-auto min-w-[220px]" disabled>
                  Treatment Effect Tool
                </Button>
              )}
            </div>
            {!stats.hasDiagnosticAnalyses && !stats.hasTreatmentAnalyses && (
              <p className="mt-4 text-sm text-gray-500">
                No verified analyses are currently available.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="border-y bg-gray-50 py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.totalVerified}</p>
              <p className="text-sm text-gray-600">Verified Analyses</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.verifiedDiagnosticCount}</p>
              <p className="text-sm text-gray-600">Diagnostic Tests</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.verifiedTreatmentCount}</p>
              <p className="text-sm text-gray-600">Treatment Studies</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.approvedReviewerCount}</p>
              <p className="text-sm text-gray-600">Clinical Reviewers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary Actions */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
            <Link href="/browse">
              <Card className="h-full transition-all hover:shadow-md hover:border-blue-300 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Evidence Library</CardTitle>
                  <CardDescription>Browse verified study analyses</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/submit">
              <Card className="h-full transition-all hover:shadow-md hover:border-blue-300 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Contribute</CardTitle>
                  <CardDescription>Submit a structured study analysis</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Become a Reviewer Section - only show if user can apply */}
      {canApplyAsReviewer && (
        <section className="py-12 bg-gradient-to-b from-white to-green-50">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <Link href="/apply-reviewer">
                <Card className="transition-all hover:shadow-lg hover:border-green-400 cursor-pointer border-green-200 bg-white">
                  <CardHeader className="text-center py-8">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-green-600"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </div>
                    <CardTitle className="text-xl text-green-900">Become a Verified Clinician Reviewer</CardTitle>
                    <CardDescription className="text-base mt-2 max-w-md mx-auto">
                      Help ensure the quality of clinical evidence by reviewing submitted study analyses. 
                      Apply to join our team of verified clinical reviewers.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
