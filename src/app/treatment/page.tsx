import { Card, CardContent } from '@/components/ui/card';
import { prisma } from '@/lib/db';

async function hasVerifiedTreatmentAnalyses() {
  try {
    const count = await prisma.analysis.count({
      where: { status: 'VERIFIED', category: 'TREATMENT' },
    });
    return count > 0;
  } catch {
    return false;
  }
}

export default async function TreatmentPage() {
  const hasAnalyses = await hasVerifiedTreatmentAnalyses();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Treatment Effect Tool</h1>
        <p className="mt-2 text-gray-600">
          Calculate treatment effects including absolute risk reduction, relative risk, and number needed to treat.
        </p>
      </div>

      {!hasAnalyses ? (
        <Card>
          <CardContent className="py-16 text-center">
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
              <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
              <path d="m8.5 8.5 7 7" />
            </svg>
            <p className="text-gray-500">
              No verified analyses are currently available.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-600">
              Treatment effect tool will be available when verified analyses are contributed.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
