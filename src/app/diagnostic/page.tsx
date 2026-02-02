import { Card, CardContent } from '@/components/ui/card';
import { prisma } from '@/lib/db';

async function hasVerifiedDiagnosticAnalyses() {
  try {
    const count = await prisma.analysis.count({
      where: { status: 'VERIFIED', category: 'DIAGNOSTIC' },
    });
    return count > 0;
  } catch {
    return false;
  }
}

export default async function DiagnosticPage() {
  const hasAnalyses = await hasVerifiedDiagnosticAnalyses();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Diagnostic Decision Tool</h1>
        <p className="mt-2 text-gray-600">
          Calculate post-test probability using likelihood ratios from verified diagnostic studies.
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
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
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
              Diagnostic decision tool will be available when verified analyses are contributed.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
