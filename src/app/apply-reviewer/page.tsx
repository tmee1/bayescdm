'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ApplicationForm {
  clinicalRole: string;
  specialty: string;
  yearsPractice: string;
  institution: string;
  licenseOrNPI: string;
  qualifications: string;
  justification: string;
}

export default function ApplyReviewerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [form, setForm] = useState<ApplicationForm>({
    clinicalRole: '',
    specialty: '',
    yearsPractice: '',
    institution: '',
    licenseOrNPI: '',
    qualifications: '',
    justification: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check if user already has an application or is already a reviewer
  const userReviewerStatus = session?.user?.reviewerStatus;
  const userRole = session?.user?.role;

  useEffect(() => {
    if (status === 'loading') return;
    
    // If already a reviewer, redirect to review page
    if (userRole === 'REVIEWER' || userRole === 'MODERATOR' || userRole === 'ADMIN') {
      if (userReviewerStatus === 'APPROVED') {
        router.push('/reviewer');
        return;
      }
    }
  }, [status, userRole, userReviewerStatus, router]);

  const handleInputChange = (field: keyof ApplicationForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validation
    if (!form.clinicalRole || !form.specialty || !form.qualifications) {
      setError('Please fill in all required fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/reviewer-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          yearsPractice: form.yearsPractice ? parseInt(form.yearsPractice) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-12rem)] items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-12rem)] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <CardTitle>Sign in Required</CardTitle>
            <CardDescription>
              You need to be signed in to apply for reviewer status.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3">
            <Link href="/login" className="w-full">
              <Button className="w-full">Sign In</Button>
            </Link>
            <Link href="/login?signup=true" className="w-full">
              <Button variant="outline" className="w-full">Create Account</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Already applied - pending
  if (userReviewerStatus === 'APPLIED') {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-12rem)] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <CardTitle>Application Pending</CardTitle>
            <CardDescription>
              Your reviewer application is currently under review. We&apos;ll notify you once a decision has been made.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full">Return Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Previously denied
  if (userReviewerStatus === 'DENIED') {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-12rem)] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <CardTitle>Application Not Approved</CardTitle>
            <CardDescription>
              Your previous reviewer application was not approved. If you believe this was in error, please contact us at thomasmee777@gmail.com.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full">Return Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-12rem)] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <CardTitle>Application Submitted!</CardTitle>
            <CardDescription>
              Thank you for applying to become a verified clinician reviewer. We&apos;ll review your application and get back to you soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-gray-500">
            <p>You will receive an email notification once your application has been reviewed.</p>
          </CardContent>
          <CardFooter>
            <Link href="/" className="w-full">
              <Button className="w-full">Return Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Application form
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Apply to Become a Verified Clinician Reviewer</h1>
          <p className="text-gray-600 mt-2">
            Help ensure the quality of clinical evidence by reviewing submitted study analyses.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reviewer Application</CardTitle>
            <CardDescription>
              Please provide your clinical credentials and experience. All applications are reviewed manually.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Clinical Role */}
              <div className="space-y-2">
                <Label htmlFor="clinicalRole">Clinical Role *</Label>
                <select
                  id="clinicalRole"
                  className="w-full p-2 border rounded-md"
                  value={form.clinicalRole}
                  onChange={(e) => handleInputChange('clinicalRole', e.target.value)}
                  required
                >
                  <option value="">Select your role...</option>
                  <option value="Attending Physician">Attending Physician</option>
                  <option value="Fellow">Fellow</option>
                  <option value="Resident">Resident</option>
                  <option value="Nurse Practitioner">Nurse Practitioner</option>
                  <option value="Physician Assistant">Physician Assistant</option>
                  <option value="Pharmacist">Pharmacist</option>
                  <option value="Clinical Researcher">Clinical Researcher</option>
                  <option value="Medical Student">Medical Student</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Specialty */}
              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty / Area of Practice *</Label>
                <Input
                  id="specialty"
                  placeholder="e.g., Internal Medicine, Critical Care, Emergency Medicine"
                  value={form.specialty}
                  onChange={(e) => handleInputChange('specialty', e.target.value)}
                  required
                />
              </div>

              {/* Years of Practice */}
              <div className="space-y-2">
                <Label htmlFor="yearsPractice">Years of Clinical Practice</Label>
                <Input
                  id="yearsPractice"
                  type="number"
                  min="0"
                  max="60"
                  placeholder="e.g., 5"
                  value={form.yearsPractice}
                  onChange={(e) => handleInputChange('yearsPractice', e.target.value)}
                />
              </div>

              {/* Institution */}
              <div className="space-y-2">
                <Label htmlFor="institution">Institution / Organization</Label>
                <Input
                  id="institution"
                  placeholder="e.g., University Hospital, Private Practice"
                  value={form.institution}
                  onChange={(e) => handleInputChange('institution', e.target.value)}
                />
              </div>

              {/* License/NPI */}
              <div className="space-y-2">
                <Label htmlFor="licenseOrNPI">Medical License or NPI Number (optional)</Label>
                <Input
                  id="licenseOrNPI"
                  placeholder="For verification purposes only"
                  value={form.licenseOrNPI}
                  onChange={(e) => handleInputChange('licenseOrNPI', e.target.value)}
                />
                <p className="text-xs text-gray-500">This information is kept confidential and used only for verification.</p>
              </div>

              {/* Qualifications */}
              <div className="space-y-2">
                <Label htmlFor="qualifications">What qualifies you to review clinical study analyses? *</Label>
                <Textarea
                  id="qualifications"
                  placeholder="Describe your training, experience, or expertise in critical appraisal of clinical literature (e.g., EBM training, research experience, teaching, publications, systematic review experience)..."
                  value={form.qualifications}
                  onChange={(e) => handleInputChange('qualifications', e.target.value)}
                  rows={4}
                  required
                />
              </div>

              {/* Justification */}
              <div className="space-y-2">
                <Label htmlFor="justification">Why do you want to become a reviewer?</Label>
                <Textarea
                  id="justification"
                  placeholder="Tell us about your interest in evidence-based medicine and motivation for contributing to this project (optional)..."
                  value={form.justification}
                  onChange={(e) => handleInputChange('justification', e.target.value)}
                  rows={3}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Link href="/" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Questions? Contact us at{' '}
            <a href="mailto:thomasmee777@gmail.com" className="text-blue-600 hover:underline">
              thomasmee777@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
