'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import type { QUADAS2Data } from '@/components/quality-assessment/quadas2-form';
import { assignReviewers } from '@/app/review/[id]/actions';

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

interface DiagnosticInterval {
  label: string;
  lowerBound: string;
  upperBound: string;
  unit: string;
  truePositives: string;
  falsePositives: string;
  falseNegatives: string;
  trueNegatives: string;
}

interface TreatmentData {
  interventionTotal: string;
  interventionEvents: string;
  controlTotal: string;
  controlEvents: string;
}

interface SubmissionData {
  category: 'DIAGNOSTIC' | 'TREATMENT';
  citation: CitationData;
  pico: PICOData;
  diagnosticMode?: 'single_cutoff' | 'multi_interval' | null;
  diagnosticIntervals?: DiagnosticInterval[];
  treatmentData?: TreatmentData;
  quadas2Data?: QUADAS2Data;
  summary: string;
}

interface SubmissionResult {
  success: boolean;
  analysisId?: string;
  error?: string;
}

export async function submitAnalysis(data: SubmissionData): Promise<SubmissionResult> {
  try {
    // Get the current user session
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'You must be logged in to submit an analysis' };
    }
    const userId = session.user.id;

    // Validate required fields
    if (!data.citation.title || !data.citation.authors || !data.citation.journal || !data.citation.year) {
      return { success: false, error: 'Missing required citation fields' };
    }

    if (!data.pico.population || !data.pico.intervention || !data.pico.outcome) {
      return { success: false, error: 'Missing required PICO fields' };
    }

    // For diagnostic, validate mode selection and data
    if (data.category === 'DIAGNOSTIC') {
      // Validate diagnostic mode is selected
      if (!data.diagnosticMode) {
        return { success: false, error: 'Diagnostic result structure (single cutoff or multiple cutpoints) must be selected' };
      }

      if (!data.diagnosticIntervals || data.diagnosticIntervals.length === 0) {
        return { success: false, error: 'At least one diagnostic result is required' };
      }
      
      // For single_cutoff mode, enforce only one interval
      if (data.diagnosticMode === 'single_cutoff' && data.diagnosticIntervals.length > 1) {
        return { success: false, error: 'Single cutoff mode can only have one result entry' };
      }
      
      const hasValidInterval = data.diagnosticIntervals.some(interval => 
        interval.label && 
        interval.truePositives !== '' && 
        interval.falsePositives !== '' && 
        interval.falseNegatives !== '' && 
        interval.trueNegatives !== ''
      );
      
      if (!hasValidInterval) {
        return { success: false, error: 'Complete 2×2 table data is required' };
      }
    }

    // For treatment, validate arm data
    if (data.category === 'TREATMENT') {
      if (!data.treatmentData) {
        return { success: false, error: 'Treatment arm data is required' };
      }
      
      if (!data.treatmentData.interventionTotal || !data.treatmentData.interventionEvents ||
          !data.treatmentData.controlTotal || !data.treatmentData.controlEvents) {
        return { success: false, error: 'Complete treatment arm data is required' };
      }
    }

    // Check if a study with this DOI or PMID already exists
    let study = null;
    
    if (data.citation.pmid) {
      study = await prisma.study.findUnique({
        where: { pmid: data.citation.pmid },
      });
    }
    
    if (!study && data.citation.doi) {
      study = await prisma.study.findUnique({
        where: { doi: data.citation.doi },
      });
    }
    
    // If study doesn't exist, create it
    if (!study) {
      study = await prisma.study.create({
        data: {
          title: data.citation.title,
          authors: data.citation.authors,
          journal: data.citation.journal,
          year: parseInt(data.citation.year, 10),
          doi: data.citation.doi || null,
          pmid: data.citation.pmid || null,
          clinicalDomains: null, // Could be added later
        },
      });
    }

    // Create the analysis
    const analysis = await prisma.analysis.create({
      data: {
        study: {
          connect: { id: study.id },
        },
        category: data.category,
        status: 'PENDING_REVIEW',
        version: 1,
        createdBy: {
          connect: { id: userId },
        },
        narrativeSummary: data.summary || null,
        population: data.pico.population,
        // Use intervention for treatment, testName for diagnostic
        intervention: data.category === 'TREATMENT' ? data.pico.intervention : null,
        testName: data.category === 'DIAGNOSTIC' ? data.pico.intervention : null,
        comparator: data.pico.comparator || null,
        outcome: data.pico.outcome,
        setting: data.pico.setting || null,
      },
    });

    // Create category-specific details
    if (data.category === 'DIAGNOSTIC' && data.diagnosticIntervals) {
      const diagnosticDetails = await prisma.diagnosticDetails.create({
        data: {
          analysis: {
            connect: { id: analysis.id },
          },
          // Note: testNameCanonical and conditionCanonical relations are optional
          // They can be linked later when canonical terms are implemented
          referenceStandard: data.pico.comparator || 'Not specified',
          hasIntervals: data.diagnosticMode === 'multi_interval',
          diagnosticMode: data.diagnosticMode || 'single_cutoff',
        },
      });

      // Create intervals
      for (const interval of data.diagnosticIntervals) {
        if (interval.label || (interval.truePositives && interval.falsePositives)) {
          await prisma.diagnosticInterval.create({
            data: {
              diagnosticDetails: {
                connect: { id: diagnosticDetails.id },
              },
              label: interval.label || 'Unlabeled',
              lowerBound: interval.lowerBound ? parseFloat(interval.lowerBound) : null,
              upperBound: interval.upperBound ? parseFloat(interval.upperBound) : null,
              unit: interval.unit || null,
              truePositives: parseInt(interval.truePositives, 10) || 0,
              falsePositives: parseInt(interval.falsePositives, 10) || 0,
              falseNegatives: parseInt(interval.falseNegatives, 10) || 0,
              trueNegatives: parseInt(interval.trueNegatives, 10) || 0,
            },
          });
        }
      }

      // Store QUADAS-2 assessment if provided
      if (data.quadas2Data) {
        // Derive overall risk from domain judgments
        const domainRisks = [
          data.quadas2Data.patientSelection.riskOfBias,
          data.quadas2Data.indexTest.riskOfBias,
          data.quadas2Data.referenceStandard.riskOfBias,
          data.quadas2Data.flowAndTiming.riskOfBias,
        ];

        let overallRisk = 'LOW';
        if (domainRisks.includes('HIGH')) {
          overallRisk = 'HIGH';
        } else if (domainRisks.includes('UNCLEAR')) {
          overallRisk = 'SOME_CONCERNS';
        }

        const applicabilityConcerns = [
          data.quadas2Data.patientSelection.applicabilityConcern,
          data.quadas2Data.indexTest.applicabilityConcern,
          data.quadas2Data.referenceStandard.applicabilityConcern,
        ];

        let overallApplicability = 'LOW_CONCERN';
        if (applicabilityConcerns.includes('HIGH')) {
          overallApplicability = 'HIGH';
        } else if (applicabilityConcerns.includes('UNCLEAR')) {
          overallApplicability = 'SOME';
        }

        await prisma.qualityAssessment.create({
          data: {
            analysis: {
              connect: { id: analysis.id },
            },
            assessmentType: 'QUADAS2',
            domains: JSON.stringify(data.quadas2Data),
            overallRisk,
            applicability: overallApplicability,
          },
        });
      }
    }

    if (data.category === 'TREATMENT' && data.treatmentData) {
      const treatmentDetails = await prisma.treatmentDetails.create({
        data: {
          analysis: {
            connect: { id: analysis.id },
          },
          // Note: canonical term relations are optional
          // They can be linked later when canonical terms are implemented
        },
      });

      // Create intervention arm
      await prisma.treatmentArm.create({
        data: {
          treatmentDetails: {
            connect: { id: treatmentDetails.id },
          },
          armType: 'INTERVENTION',
          nTotal: parseInt(data.treatmentData.interventionTotal, 10),
          nEvents: parseInt(data.treatmentData.interventionEvents, 10),
          nHarms: null,
        },
      });

      // Create control arm
      await prisma.treatmentArm.create({
        data: {
          treatmentDetails: {
            connect: { id: treatmentDetails.id },
          },
          armType: 'CONTROL',
          nTotal: parseInt(data.treatmentData.controlTotal, 10),
          nEvents: parseInt(data.treatmentData.controlEvents, 10),
          nHarms: null,
        },
      });
    }

    // Assign reviewers to the analysis (excluding the submitter)
    await assignReviewers(analysis.id, userId);

    return { success: true, analysisId: analysis.id };
  } catch (error) {
    console.error('Submission error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
}
