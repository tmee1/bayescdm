'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { StudyQualityAssessment, createEmptyStudyQualityData, type StudyQualityData } from '@/components/quality-assessment/study-quality-assessment';
import { DiagnosticDataWorkflow, type DiagnosticDataOutput, type Directionality } from '@/components/diagnostic-data-workflow';
import { TreatmentDataWorkflow } from '@/components/treatment-data-workflow';
import { 
  TreatmentQualityAssessment, 
  createEmptyTreatmentQualityAssessmentData,
  type TreatmentQualityAssessmentData,
  type TreatmentDataEntry,
  createEmptyTreatmentDataEntry,
} from '@/components/treatment-quality-assessment';
import { useNavigationGuard } from '@/contexts/navigation-guard-context';
import { submitAnalysis } from './actions';

type Category = 'DIAGNOSTIC' | 'TREATMENT' | null;

// Storage key for saved drafts
const DRAFT_STORAGE_KEY = 'bayes-study-draft';

interface CitationData {
  title: string;
  authors: string;
  journal: string;
  year: string;
  doi: string;
  pmid: string;
}

interface PICOData {
  population: string;
  intervention: string;
  comparator: string;
  outcome: string;
  setting: string;
}

// Legacy treatment data interface (for backward compatibility with old drafts)
interface LegacyTreatmentData {
  interventionTotal: string;
  interventionEvents: string;
  controlTotal: string;
  controlEvents: string;
}

// Interface for saved draft
interface SavedDraft {
  step: number;
  category: Category;
  citation: CitationData;
  pico: PICOData;
  directionality: Directionality;
  diagnosticDataOutput: DiagnosticDataOutput | null;
  treatmentData: LegacyTreatmentData; // Legacy data
  treatmentDataEntry: TreatmentDataEntry | null; // New treatment data
  treatmentQualityData: TreatmentQualityAssessmentData | null; // New treatment quality
  qualityData: StudyQualityData;
  summary: string;
  savedAt: string;
}

export default function SubmitPage() {
  const router = useRouter();
  const { 
    pendingNavigation, 
    setShouldBlockNavigation, 
    setOnNavigationAttempt,
    confirmNavigation,
    cancelNavigation 
  } = useNavigationGuard();
  
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<Category>(null);
  
  // Citation state (Step 2)
  const [citation, setCitation] = useState<CitationData>({
    title: '',
    authors: '',
    journal: '',
    year: '',
    doi: '',
    pmid: '',
  });

  // PICO state (Step 3)
  const [pico, setPico] = useState<PICOData>({
    population: '',
    intervention: '',
    comparator: '',
    outcome: '',
    setting: '',
  });

  // Test directionality (for diagnostic tests)
  const [directionality, setDirectionality] = useState<Directionality>('higher_more_positive');

  // Diagnostic data state (Step 4) - using new workflow component
  const [diagnosticDataOutput, setDiagnosticDataOutput] = useState<DiagnosticDataOutput | null>(null);

  // Treatment data state (Step 4) - Legacy for backward compatibility
  const [treatmentData, setTreatmentData] = useState<LegacyTreatmentData>({
    interventionTotal: '',
    interventionEvents: '',
    controlTotal: '',
    controlEvents: '',
  });

  // NEW: Treatment data entry using the new workflow
  const [treatmentDataEntry, setTreatmentDataEntry] = useState<TreatmentDataEntry | null>(null);

  // Quality assessment state (Step 5) - for diagnostic studies
  const [qualityData, setQualityData] = useState<StudyQualityData>(createEmptyStudyQualityData());

  // NEW: Treatment quality assessment state (Step 5) - for treatment studies
  const [treatmentQualityData, setTreatmentQualityData] = useState<TreatmentQualityAssessmentData | null>(null);

  // Summary state (Step 6)
  const [summary, setSummary] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedAnalysisId, setSubmittedAnalysisId] = useState<string | null>(null);

  // Exit warning dialog state
  const [showExitWarning, setShowExitWarning] = useState(false);
  
  // Flag to allow navigation without beforeunload warning
  const [allowNavigation, setAllowNavigation] = useState(false);
  
  // Save notification state
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [savedDraftInfo, setSavedDraftInfo] = useState<{ savedAt: string; step: number } | null>(null);

  // Helper functions
  const updateCitation = (field: keyof CitationData, value: string) => {
    setCitation(prev => ({ ...prev, [field]: value }));
  };

  const updatePico = (field: keyof PICOData, value: string) => {
    setPico(prev => ({ ...prev, [field]: value }));
  };

  const updateTreatmentData = (field: keyof LegacyTreatmentData, value: string) => {
    setTreatmentData(prev => ({ ...prev, [field]: value }));
  };

  // Check if user has made progress (has any data entered)
  const hasProgress = useCallback(() => {
    return (
      category !== null ||
      citation.title !== '' ||
      citation.authors !== '' ||
      pico.population !== '' ||
      summary !== ''
    );
  }, [category, citation.title, citation.authors, pico.population, summary]);

  // Save draft to localStorage
  const saveDraft = useCallback(() => {
    const draft: SavedDraft = {
      step,
      category,
      citation,
      pico,
      directionality,
      diagnosticDataOutput,
      treatmentData,
      treatmentDataEntry,
      treatmentQualityData,
      qualityData,
      summary,
      savedAt: new Date().toISOString(),
    };
    
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      setHasSavedDraft(true);
      setShowSaveNotification(true);
      setTimeout(() => setShowSaveNotification(false), 3000);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [step, category, citation, pico, directionality, diagnosticDataOutput, treatmentData, treatmentDataEntry, treatmentQualityData, qualityData, summary]);

  // Load draft from localStorage
  const loadDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const draft: SavedDraft = JSON.parse(saved);
        setStep(draft.step);
        setCategory(draft.category);
        setCitation(draft.citation);
        setPico(draft.pico);
        setDirectionality(draft.directionality);
        setDiagnosticDataOutput(draft.diagnosticDataOutput);
        setTreatmentData(draft.treatmentData);
        // Load new treatment data if available
        if (draft.treatmentDataEntry) {
          setTreatmentDataEntry(draft.treatmentDataEntry);
        }
        if (draft.treatmentQualityData) {
          setTreatmentQualityData(draft.treatmentQualityData);
        }
        setQualityData(draft.qualityData);
        setSummary(draft.summary);
        setShowRestorePrompt(false);
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }, []);

  // Clear saved draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasSavedDraft(false);
      setShowRestorePrompt(false);
      setSavedDraftInfo(null);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, []);

  // Check for saved draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const draft: SavedDraft = JSON.parse(saved);
        setHasSavedDraft(true);
        setSavedDraftInfo({
          savedAt: draft.savedAt,
          step: draft.step,
        });
        // Only show restore prompt if not already in progress
        if (!hasProgress()) {
          setShowRestorePrompt(true);
        }
      }
    } catch (error) {
      console.error('Failed to check for saved draft:', error);
    }
  }, []);

  // Set up navigation blocking based on progress
  useEffect(() => {
    const shouldBlock = hasProgress() && !submitSuccess;
    setShouldBlockNavigation(shouldBlock);
  }, [hasProgress, submitSuccess, setShouldBlockNavigation]);

  // Set up callback when navigation is attempted
  useEffect(() => {
    setOnNavigationAttempt(() => setShowExitWarning(true));
    return () => setOnNavigationAttempt(null);
  }, [setOnNavigationAttempt]);

  // Warn user before leaving the page (browser close/refresh)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Skip warning if navigation was intentionally allowed
      if (allowNavigation) return;
      
      if (hasProgress() && !submitSuccess) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasProgress, submitSuccess, allowNavigation]);

  // Keyboard shortcut for saving (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasProgress()) {
          saveDraft();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasProgress, saveDraft]);

  // Track if exit was triggered by the Exit button (vs header navigation)
  const [exitButtonTriggered, setExitButtonTriggered] = useState(false);

  // Helper function to navigate safely
  const navigateTo = (url: string) => {
    setAllowNavigation(true);
    setShouldBlockNavigation(false);
    // Use setTimeout to ensure state updates before navigation
    setTimeout(() => {
      window.location.assign(url);
    }, 50);
  };

  // Confirm exit navigation (exit without saving)
  const confirmExit = () => {
    setShowExitWarning(false);
    
    if (exitButtonTriggered) {
      setExitButtonTriggered(false);
      navigateTo('/');
    } else if (pendingNavigation) {
      const targetUrl = pendingNavigation;
      cancelNavigation();
      navigateTo(targetUrl);
    } else {
      navigateTo('/');
    }
  };

  // Cancel exit navigation
  const cancelExit = () => {
    cancelNavigation();
    setShowExitWarning(false);
    setExitButtonTriggered(false);
  };

  // Save and exit (from dialog)
  const saveAndExit = () => {
    saveDraft();
    setShowExitWarning(false);
    
    if (exitButtonTriggered) {
      setExitButtonTriggered(false);
      navigateTo('/');
    } else if (pendingNavigation) {
      const targetUrl = pendingNavigation;
      cancelNavigation();
      navigateTo(targetUrl);
    } else {
      navigateTo('/');
    }
  };

  // Handle local navigation with warning (for the Exit button in header)
  const handleExitClick = () => {
    if (hasProgress() && !submitSuccess) {
      setExitButtonTriggered(true);
      setShowExitWarning(true);
    } else {
      navigateTo('/');
    }
  };

  // Save draft and navigate home (used by step-level Save & Exit buttons)
  const handleSaveAndExit = () => {
    saveDraft();
    navigateTo('/');
  };

  const handleSubmit = async () => {
    if (!category) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const result = await submitAnalysis({
      category,
      citation,
      pico,
      diagnosticDataOutput: category === 'DIAGNOSTIC' ? diagnosticDataOutput : undefined,
      treatmentData: category === 'TREATMENT' ? treatmentData : undefined,
      qualityData: category === 'DIAGNOSTIC' ? qualityData : undefined,
      summary,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSubmitSuccess(true);
      setSubmittedAnalysisId(result.analysisId || null);
      clearDraft(); // Clear draft on successful submission
    } else {
      setSubmitError(result.error || 'An unexpected error occurred');
    }
  };

  // Show success state after submission
  if (submitSuccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
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
                  className="text-green-600"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Submission Received
              </h2>
              <p className="text-gray-600 mb-6">
                Your analysis has been submitted for peer review. You will be notified
                when reviewers provide feedback.
              </p>
              <div className="p-4 bg-gray-50 rounded-lg mb-6 text-left">
                <h4 className="font-medium text-gray-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Two verified clinical reviewers will be assigned</li>
                  <li>• Reviewers will evaluate data accuracy and quality assessment</li>
                  <li>• You may be asked to provide modifications</li>
                  <li>• Once approved, the analysis will appear in the evidence library</li>
                </ul>
              </div>
              <div className="flex gap-4 justify-center">
                <Link href="/browse">
                  <Button variant="outline">View Evidence Library</Button>
                </Link>
                <Link href="/submit">
                  <Button onClick={() => window.location.reload()}>
                    Submit Another Analysis
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Exit Warning Dialog */}
      <Dialog open={showExitWarning} onOpenChange={setShowExitWarning}>
        <DialogHeader>
          <DialogTitle>Leave this page?</DialogTitle>
          <DialogDescription>
            You have unsaved progress on your study analysis. If you leave now, your work may be lost.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={cancelExit}>
            Stay
          </Button>
          <Button variant="outline" onClick={saveAndExit}>
            Save & Exit
          </Button>
          <Button onClick={confirmExit} className="bg-red-600 hover:bg-red-700 text-white">
            Exit Without Saving
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Restore Draft Prompt */}
      <Dialog open={showRestorePrompt} onOpenChange={setShowRestorePrompt}>
        <DialogHeader>
          <DialogTitle>Resume your previous work?</DialogTitle>
          <DialogDescription>
            You have a saved draft from{' '}
            {savedDraftInfo?.savedAt 
              ? new Date(savedDraftInfo.savedAt).toLocaleString() 
              : 'a previous session'
            }
            {savedDraftInfo?.step && ` (Step ${savedDraftInfo.step} of 6)`}.
            Would you like to continue where you left off?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => { clearDraft(); setShowRestorePrompt(false); }}>
            Start Fresh
          </Button>
          <Button onClick={loadDraft}>
            Resume Draft
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Save Notification Toast */}
      {showSaveNotification && (
        <div className="fixed bottom-4 right-4 z-50 bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Draft saved successfully!
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Submit Study Analysis</h1>
            <p className="mt-2 text-gray-600">
              Contribute a structured analysis of a peer-reviewed clinical study.
            </p>
          </div>
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {hasProgress() && (
              <Button variant="outline" onClick={saveDraft} className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                Save Draft
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleExitClick}
              className="flex items-center gap-2 text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"/>
                <path d="m6 6 12 12"/>
              </svg>
              Exit
            </Button>
          </div>
        </div>
        {hasSavedDraft && !showRestorePrompt && (
          <p className="mt-2 text-sm text-gray-500">
            You have a saved draft.{' '}
            <button 
              onClick={() => setShowRestorePrompt(true)}
              className="text-blue-600 hover:underline"
            >
              Load it
            </button>
            {' or '}
            <button 
              onClick={clearDraft}
              className="text-red-600 hover:underline"
            >
              discard it
            </button>
            .
          </p>
        )}
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-2xl">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s === step
                    ? 'bg-blue-600 text-white'
                    : s < step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s < 6 && (
                <div
                  className={`w-12 h-0.5 ${
                    s < step ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between max-w-2xl mt-2 text-xs text-gray-500">
          <span>Category</span>
          <span>Citation</span>
          <span>PICO</span>
          <span>Data</span>
          <span>Quality</span>
          <span>Review</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-2xl">
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Analysis Category</CardTitle>
              <CardDescription>
                Choose the type of clinical evidence you are analyzing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onClick={() => setCategory('DIAGNOSTIC')}
                onDoubleClick={() => {
                  setCategory('DIAGNOSTIC');
                  setStep(2);
                }}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  category === 'DIAGNOSTIC'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-semibold text-gray-900">Diagnostic Test</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Evaluate diagnostic accuracy with likelihood ratios
                </p>
              </div>
              <div
                onClick={() => setCategory('TREATMENT')}
                onDoubleClick={() => {
                  setCategory('TREATMENT');
                  setStep(2);
                }}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  category === 'TREATMENT'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-semibold text-gray-900">Treatment / Intervention</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Evaluate treatment effects with risk reduction and NNT
                </p>
              </div>
              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleSaveAndExit}
                  disabled={!category}
                  className="flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  Save & Exit
                </Button>
                <Button onClick={() => setStep(2)} disabled={!category}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Study Citation</CardTitle>
              <CardDescription>
                Enter the citation details for the study you are analyzing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Study Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter the full study title"
                  value={citation.title}
                  onChange={(e) => updateCitation('title', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="authors">Authors *</Label>
                <Input
                  id="authors"
                  placeholder="e.g., Smith J, Jones B, et al."
                  value={citation.authors}
                  onChange={(e) => updateCitation('authors', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="journal">Journal *</Label>
                  <Input
                    id="journal"
                    placeholder="e.g., JAMA"
                    value={citation.journal}
                    onChange={(e) => updateCitation('journal', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    min={1900}
                    max={new Date().getFullYear()}
                    placeholder={`e.g., ${new Date().getFullYear()}`}
                    value={citation.year}
                    onChange={(e) => updateCitation('year', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="doi">DOI (optional)</Label>
                  <Input
                    id="doi"
                    placeholder="e.g., 10.1001/jama.2024.1234"
                    value={citation.doi}
                    onChange={(e) => updateCitation('doi', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="pmid">PMID (optional)</Label>
                  <Input
                    id="pmid"
                    placeholder="e.g., 12345678"
                    value={citation.pmid}
                    onChange={(e) => updateCitation('pmid', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleSaveAndExit}
                    className="flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                      <polyline points="17 21 17 13 7 13 7 21"/>
                      <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Save & Exit
                  </Button>
                  <Button 
                    onClick={() => setStep(3)}
                    disabled={
                      !citation.title || 
                      !citation.authors || 
                      !citation.journal || 
                      !citation.year ||
                      parseInt(citation.year) < 1900 ||
                      parseInt(citation.year) > new Date().getFullYear()
                    }
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>PICO Elements</CardTitle>
              <CardDescription>
                Define the population, intervention/test, comparator, and outcome.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="population">Population *</Label>
                <Textarea
                  id="population"
                  placeholder="Describe the study population (e.g., Adults presenting to the ED with suspected PE)"
                  rows={2}
                  value={pico.population}
                  onChange={(e) => updatePico('population', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="intervention">
                  {category === 'DIAGNOSTIC' ? 'Diagnostic Test *' : 'Intervention *'}
                </Label>
                <Input
                  id="intervention"
                  placeholder={
                    category === 'DIAGNOSTIC'
                      ? 'e.g., D-dimer assay'
                      : 'e.g., Aspirin 81mg daily'
                  }
                  value={pico.intervention}
                  onChange={(e) => updatePico('intervention', e.target.value)}
                />
              </div>
              {category === 'DIAGNOSTIC' && (
                <div>
                  <Label>Test Directionality *</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Which direction indicates a more positive (abnormal) test result?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDirectionality('higher_more_positive')}
                      className={`p-3 text-left border rounded-lg transition-all ${
                        directionality === 'higher_more_positive'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium text-sm">Higher → More Positive</span>
                      <p className="text-xs text-gray-500 mt-1">e.g., D-dimer, troponin, CRP</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirectionality('lower_more_positive')}
                      className={`p-3 text-left border rounded-lg transition-all ${
                        directionality === 'lower_more_positive'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium text-sm">Lower → More Positive</span>
                      <p className="text-xs text-gray-500 mt-1">e.g., eGFR, pH, albumin</p>
                    </button>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="comparator">
                  {category === 'DIAGNOSTIC' ? 'Reference Standard *' : 'Comparator *'}
                </Label>
                <Input
                  id="comparator"
                  placeholder={
                    category === 'DIAGNOSTIC'
                      ? 'e.g., CT pulmonary angiography'
                      : 'e.g., Placebo'
                  }
                  value={pico.comparator}
                  onChange={(e) => updatePico('comparator', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="outcome">Outcome *</Label>
                <Input
                  id="outcome"
                  placeholder={
                    category === 'DIAGNOSTIC'
                      ? 'e.g., Pulmonary embolism'
                      : 'e.g., Major adverse cardiovascular events'
                  }
                  value={pico.outcome}
                  onChange={(e) => updatePico('outcome', e.target.value)}
                />
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleSaveAndExit}
                    className="flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                      <polyline points="17 21 17 13 7 13 7 21"/>
                      <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Save & Exit
                  </Button>
                  <Button 
                    onClick={() => setStep(4)}
                    disabled={!pico.population || !pico.intervention || !pico.comparator || !pico.outcome}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <>
            {category === 'DIAGNOSTIC' ? (
              /* New Diagnostic Data Workflow */
              <div className="space-y-6">
                <DiagnosticDataWorkflow
                  value={diagnosticDataOutput}
                  directionality={directionality}
                  onChange={(data) => {
                    setDiagnosticDataOutput(data);
                    setStep(5); // Auto-advance when user clicks "Save Results & Continue"
                  }}
                />
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    Back
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleSaveAndExit}
                    className="flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                      <polyline points="17 21 17 13 7 13 7 21"/>
                      <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Save & Exit
                  </Button>
                </div>
              </div>
            ) : (
              /* Treatment Data Entry Form - Using new workflow */
              <div className="space-y-6">
                <TreatmentDataWorkflow
                  value={treatmentDataEntry}
                  onChange={setTreatmentDataEntry}
                />
                
                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    Back
                  </Button>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={handleSaveAndExit}
                      className="flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/>
                        <polyline points="7 3 7 8 15 8"/>
                      </svg>
                      Save & Exit
                    </Button>
                    <Button 
                      onClick={() => setStep(5)}
                      disabled={!treatmentDataEntry}
                    >
                      Continue to Quality Assessment
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quality Assessment</CardTitle>
                <CardDescription>
                  {category === 'DIAGNOSTIC'
                    ? 'Assess study quality and likelihood ratio validity using QUADAS-2 and LR-specific modifiers.'
                    : 'Complete the risk of bias assessment (RoB 2 for RCTs, ROBINS-I for observational).'}
                </CardDescription>
              </CardHeader>
            </Card>

            {category === 'DIAGNOSTIC' ? (
              <StudyQualityAssessment value={qualityData} onChange={setQualityData} />
            ) : (
              <TreatmentQualityAssessment 
                value={treatmentQualityData}
                dataEntry={treatmentDataEntry || undefined}
                onChange={setTreatmentQualityData}
                onContinue={() => setStep(6)}
              />
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(4)}>
                Back
              </Button>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleSaveAndExit}
                  className="flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  Save & Exit
                </Button>
                <Button onClick={() => setStep(6)}>Continue</Button>
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Submit</CardTitle>
              <CardDescription>
                Review your submission before sending it for peer review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary of entered data */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">Submission Summary</h4>
                <div className="text-sm space-y-2">
                  <p><span className="text-gray-500">Category:</span> {category}</p>
                  <p><span className="text-gray-500">Title:</span> {citation.title || '(not entered)'}</p>
                  <p><span className="text-gray-500">Authors:</span> {citation.authors || '(not entered)'}</p>
                  <p><span className="text-gray-500">Journal:</span> {citation.journal} {citation.year}</p>
                  <p><span className="text-gray-500">Population:</span> {pico.population || '(not entered)'}</p>
                  <p><span className="text-gray-500">{category === 'DIAGNOSTIC' ? 'Test' : 'Intervention'}:</span> {pico.intervention || '(not entered)'}</p>
                  <p><span className="text-gray-500">Outcome:</span> {pico.outcome || '(not entered)'}</p>
                  {category === 'DIAGNOSTIC' && diagnosticDataOutput && (
                    <>
                      <p><span className="text-gray-500">Data Source:</span> {
                        diagnosticDataOutput.sourceType === '2x2_table' ? '2×2 Table' :
                        diagnosticDataOutput.sourceType === 'sensitivity_specificity_single_cutoff' ? 'Sensitivity & Specificity' :
                        diagnosticDataOutput.sourceType === 'roc_or_multiple_cutoffs_table' ? 'ROC / Multiple Cutoffs' :
                        diagnosticDataOutput.sourceType === 'per_bin_counts_table' ? 'Per-Bin Counts' :
                        'Digitized ROC'
                      }</p>
                      <p><span className="text-gray-500">Test:</span> {diagnosticDataOutput.metadata.indexTestName || '(not entered)'}</p>
                      <p><span className="text-gray-500">Disease:</span> {diagnosticDataOutput.metadata.diseaseDefinition || '(not entered)'}</p>
                      <p><span className="text-gray-500">Results:</span> {diagnosticDataOutput.results.length} likelihood ratio(s) computed</p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="summary">Narrative Summary (optional)</Label>
                <Textarea
                  id="summary"
                  placeholder="Brief summary of key findings and clinical implications (max 500 characters)"
                  rows={3}
                  maxLength={500}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">{summary.length}/500 characters</p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Submission Review Process</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your submission will be reviewed by 2 verified clinical reviewers</li>
                  <li>• Reviewers may request modifications before approval</li>
                  <li>• Approved analyses will appear in the evidence library</li>
                  <li>• Reviewer names will be publicly visible on the analysis</li>
                </ul>
              </div>

              {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Error:</strong> {submitError}
                  </p>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(5)} disabled={isSubmitting}>
                  Back
                </Button>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleSaveAndExit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                      <polyline points="17 21 17 13 7 13 7 21"/>
                      <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Save & Exit
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
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
                        Submitting...
                      </>
                    ) : (
                      'Submit for Review'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
