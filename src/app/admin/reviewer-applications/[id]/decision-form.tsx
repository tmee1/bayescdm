'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { processApplication } from './actions';

interface DecisionFormProps {
  applicationId: string;
  userId: string;
}

export function ApplicationDecisionForm({ applicationId, userId }: DecisionFormProps) {
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDecision = async (decision: 'APPROVED' | 'DENIED') => {
    setIsSubmitting(true);
    setError(null);

    const result = await processApplication({
      applicationId,
      userId,
      decision,
      notes: notes || null,
    });

    setIsSubmitting(false);

    if (result.success) {
      router.push('/admin/reviewer-applications');
      router.refresh();
    } else {
      setError(result.error || 'Failed to process application');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Make Decision</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notes">Admin Notes (optional)</Label>
          <Textarea
            id="notes"
            placeholder="Internal notes about this decision..."
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <Button
            onClick={() => handleDecision('APPROVED')}
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Approve
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => handleDecision('DENIED')}
            disabled={isSubmitting}
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6" />
              <path d="m9 9 6 6" />
            </svg>
            Deny
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Approving will grant reviewer privileges immediately.
        </p>
      </CardContent>
    </Card>
  );
}
