'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { submitReview } from './actions';

interface ReviewFormProps {
  analysisId: string;
}

type Decision = 'APPROVE' | 'APPROVE_WITH_EDITS' | 'REJECT';

const MIN_FEEDBACK_LENGTH = 20;

export function ReviewForm({ analysisId }: ReviewFormProps) {
  const router = useRouter();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const feedbackRequired = decision === 'APPROVE_WITH_EDITS' || decision === 'REJECT';
  const feedbackValid = !feedbackRequired || feedback.trim().length >= MIN_FEEDBACK_LENGTH;

  const handleSubmit = async () => {
    if (!decision) {
      setError('Please select a decision');
      return;
    }

    if (feedbackRequired && feedback.trim().length < MIN_FEEDBACK_LENGTH) {
      setError(`Feedback is required (minimum ${MIN_FEEDBACK_LENGTH} characters)`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await submitReview({
      analysisId,
      decision,
      feedback,
    });

    setIsSubmitting(false);

    if (result.success) {
      router.push('/review');
      router.refresh();
    } else {
      setError(result.error || 'Failed to submit review');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Submit Your Review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Decision */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Decision *</Label>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setDecision('APPROVE')}
              className={`w-full p-4 text-left border rounded-lg transition-all ${
                decision === 'APPROVE'
                  ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  decision === 'APPROVE' ? 'border-green-500' : 'border-gray-300'
                }`}>
                  {decision === 'APPROVE' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  )}
                </div>
                <div>
                  <span className="font-medium text-green-700">Approve</span>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Data is accurate and quality assessment is complete. Ready for publication.
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDecision('APPROVE_WITH_EDITS')}
              className={`w-full p-4 text-left border rounded-lg transition-all ${
                decision === 'APPROVE_WITH_EDITS'
                  ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  decision === 'APPROVE_WITH_EDITS' ? 'border-amber-500' : 'border-gray-300'
                }`}>
                  {decision === 'APPROVE_WITH_EDITS' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  )}
                </div>
                <div>
                  <span className="font-medium text-amber-700">Approve with Edits</span>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Minor corrections needed. Submitter can revise and resubmit.
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDecision('REJECT')}
              className={`w-full p-4 text-left border rounded-lg transition-all ${
                decision === 'REJECT'
                  ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  decision === 'REJECT' ? 'border-red-500' : 'border-gray-300'
                }`}>
                  {decision === 'REJECT' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  )}
                </div>
                <div>
                  <span className="font-medium text-red-700">Reject</span>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Fundamental issues with data accuracy or methodology. Cannot be published.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Feedback */}
        <div className="space-y-2">
          <Label htmlFor="feedback" className="text-base font-medium">
            Feedback {feedbackRequired ? '*' : '(optional)'}
          </Label>
          {feedbackRequired && (
            <p className="text-sm text-amber-600">
              Please explain why edits are needed or why you're rejecting this submission.
            </p>
          )}
          <Textarea
            id="feedback"
            placeholder={
              feedbackRequired
                ? "Describe the specific issues and what changes are needed..."
                : "Optional: provide additional comments or suggestions..."
            }
            rows={5}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className={feedbackRequired && !feedbackValid ? 'border-red-300' : ''}
          />
          {feedbackRequired && (
            <p className={`text-xs ${feedback.length >= MIN_FEEDBACK_LENGTH ? 'text-green-600' : 'text-gray-500'}`}>
              {feedback.length} / {MIN_FEEDBACK_LENGTH} characters minimum
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!decision || (feedbackRequired && !feedbackValid) || isSubmitting}
          className="w-full"
          size="lg"
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
              Submitting Review...
            </>
          ) : (
            'Submit Review'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
