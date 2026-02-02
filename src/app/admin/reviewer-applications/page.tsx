import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth, canModerate } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

async function getApplications() {
  try {
    const applications = await prisma.reviewerApplication.findMany({
      include: {
        user: true,
      },
      orderBy: [
        { status: 'asc' }, // PENDING first
        { createdAt: 'desc' },
      ],
    });
    return applications;
  } catch {
    return [];
  }
}

async function getReviewerCount() {
  try {
    const count = await prisma.user.count({
      where: {
        role: { in: ['REVIEWER', 'MODERATOR', 'ADMIN'] },
        reviewerStatus: 'APPROVED',
      },
    });
    return count;
  } catch {
    return 0;
  }
}

export default async function ReviewerApplicationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin/reviewer-applications');
  }

  if (!canModerate(session.user.role)) {
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
              Administrator Access Required
            </h2>
            <p className="text-gray-600">
              You need administrator privileges to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const applications = await getApplications();
  const reviewerCount = await getReviewerCount();
  const pendingApplications = applications.filter(a => a.status === 'PENDING');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reviewer Applications</h1>
        <p className="mt-2 text-gray-600">
          Review and approve clinical reviewer applications.
        </p>
      </div>

      {/* Status Banner */}
      <div className={`mb-6 p-4 rounded-lg ${
        reviewerCount >= 3 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-amber-50 border border-amber-200'
      }`}>
        <div className="flex items-center gap-3">
          {reviewerCount >= 3 ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-green-600"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-600"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          )}
          <div>
            <p className={`font-medium ${
              reviewerCount >= 3 ? 'text-green-800' : 'text-amber-800'
            }`}>
              {reviewerCount} Approved Reviewer{reviewerCount !== 1 ? 's' : ''}
            </p>
            <p className={`text-sm ${
              reviewerCount >= 3 ? 'text-green-700' : 'text-amber-700'
            }`}>
              {reviewerCount >= 3 
                ? 'Review assignments are active. New submissions will be assigned to reviewers.'
                : `${3 - reviewerCount} more reviewer${3 - reviewerCount !== 1 ? 's' : ''} needed. Submissions will remain pending until 3 reviewers are approved.`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Pending Applications */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Pending Applications ({pendingApplications.length})
        </h2>
        {pendingApplications.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">No pending applications.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingApplications.map((application) => (
              <Card key={application.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {application.user.name || application.user.email}
                      </CardTitle>
                      <CardDescription>
                        {application.clinicalRole} • {application.specialty}
                        {application.institution && ` • ${application.institution}`}
                      </CardDescription>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded">
                      Pending
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Justification:</p>
                    <p className="text-sm">{application.justification}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                      Applied {new Date(application.createdAt).toLocaleDateString()}
                    </p>
                    <Link href={`/admin/reviewer-applications/${application.id}`}>
                      <Button>Review Application</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* All Applications */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          All Applications ({applications.length})
        </h2>
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-gray-500">Applicant</th>
                  <th className="text-left p-4 font-medium text-gray-500">Role</th>
                  <th className="text-left p-4 font-medium text-gray-500">Specialty</th>
                  <th className="text-left p-4 font-medium text-gray-500">Status</th>
                  <th className="text-left p-4 font-medium text-gray-500">Date</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id} className="border-b last:border-0">
                    <td className="p-4">
                      <p className="font-medium">{application.user.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{application.user.email}</p>
                    </td>
                    <td className="p-4 text-sm">{application.clinicalRole}</td>
                    <td className="p-4 text-sm">{application.specialty}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        application.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : application.status === 'DENIED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {application.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <Link href={`/admin/reviewer-applications/${application.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
