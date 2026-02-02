import { redirect, notFound } from 'next/navigation';
import { auth, canModerate } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApplicationDecisionForm } from './decision-form';

async function getApplication(id: string) {
  try {
    const application = await prisma.reviewerApplication.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
    return application;
  } catch {
    return null;
  }
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/login?callbackUrl=/admin/reviewer-applications/${params.id}`);
  }

  if (!canModerate(session.user.role)) {
    redirect('/');
  }

  const application = await getApplication(params.id);

  if (!application) {
    notFound();
  }

  const isPending = application.status === 'PENDING';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reviewer Application</h1>
        <p className="mt-2 text-gray-600">
          Review the details below and make a decision.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Application Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant Info */}
          <Card>
            <CardHeader>
              <CardTitle>Applicant Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-sm">{application.user.name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm">{application.user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Account Created</p>
                  <p className="text-sm">
                    {new Date(application.user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Current Role</p>
                  <p className="text-sm">{application.user.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credentials */}
          <Card>
            <CardHeader>
              <CardTitle>Clinical Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Clinical Role</p>
                  <p className="text-sm">{application.clinicalRole}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Specialty</p>
                  <p className="text-sm">{application.specialty}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Institution</p>
                  <p className="text-sm">{application.institution || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Years of Experience</p>
                  <p className="text-sm">
                    {application.yearsPractice !== null 
                      ? `${application.yearsPractice} years` 
                      : 'Not provided'}
                  </p>
                </div>
              </div>
              {application.licenseOrNPI && (
                <div>
                  <p className="text-sm font-medium text-gray-500">License/NPI</p>
                  <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                    {application.licenseOrNPI}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Justification */}
          <Card>
            <CardHeader>
              <CardTitle>Justification</CardTitle>
              <CardDescription>Why they want to become a reviewer</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{application.justification}</p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Decision */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded ${
                  application.status === 'APPROVED'
                    ? 'bg-green-100 text-green-800'
                    : application.status === 'DENIED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {application.status}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Submitted</p>
                <p className="text-sm">
                  {new Date(application.createdAt).toLocaleString()}
                </p>
              </div>
              {application.reviewerNotes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Admin Notes</p>
                  <p className="text-sm">{application.reviewerNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {isPending ? (
            <ApplicationDecisionForm 
              applicationId={application.id}
              userId={application.userId}
            />
          ) : (
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
                  className={`mx-auto mb-4 ${
                    application.status === 'APPROVED' ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {application.status === 'APPROVED' ? (
                    <path d="M20 6 9 17l-5-5" />
                  ) : (
                    <>
                      <circle cx="12" cy="12" r="10" />
                      <path d="m15 9-6 6" />
                      <path d="m9 9 6 6" />
                    </>
                  )}
                </svg>
                <p className="font-medium text-gray-900">
                  Application {application.status.toLowerCase()}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
