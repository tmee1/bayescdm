import { Card, CardContent } from '@/components/ui/card';
import { prisma } from '@/lib/db';

async function getAnalyses() {
  try {
    const analyses = await prisma.analysis.findMany({
      where: { status: 'VERIFIED' },
      include: { study: true },
      orderBy: { updatedAt: 'desc' },
    });
    return analyses;
  } catch {
    return [];
  }
}

export default async function BrowsePage() {
  const analyses = await getAnalyses();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Evidence Library</h1>
        <p className="mt-2 text-gray-600">
          Browse verified study analyses.
        </p>
      </div>

      {analyses.length === 0 ? (
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
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
            <p className="text-gray-500">
              No verified analyses are currently available.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {analyses.map((analysis) => (
            <Card key={analysis.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded mb-2">
                      {analysis.category}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {analysis.testName || analysis.intervention || 'Analysis'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {analysis.outcome}
                    </p>
                    {analysis.study && (
                      <p className="text-xs text-gray-500 mt-2">
                        {analysis.study.authors} • {analysis.study.journal}, {analysis.study.year}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
