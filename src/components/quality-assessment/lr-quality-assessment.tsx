'use client';

import { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// =============================================================================
// TYPES
// =============================================================================

type YesNoUnclear = 'yes' | 'no' | 'unclear' | '';
type RiskLevel = 'low' | 'high' | 'unclear' | '';
type ValidityLevel = 'high' | 'moderate' | 'low';

// Section A: Enhanced QUADAS-2 with bias flags
export interface EnhancedQUADAS2Data {
  // Domain A1: Patient Selection
  patientSelection: {
    description: string;
    consecutiveOrRandom: YesNoUnclear;
    caseControlAvoided: YesNoUnclear;
    inappropriateExclusionsAvoided: YesNoUnclear;
    riskOfBias: RiskLevel;
    applicabilityDescription: string;
    applicabilityConcern: RiskLevel;
    // Machine-readable flags
    flags: {
      selectionBiasPresent: boolean;
      twoGateDesign: boolean;
      restrictedSpectrum: boolean;
    };
  };
  // Domain A2: Index Test
  indexTest: {
    description: string;
    blindedToReference: YesNoUnclear;
    thresholdPreSpecified: YesNoUnclear;
    riskOfBias: RiskLevel;
    applicabilityConcern: RiskLevel;
    // Machine-readable flags
    flags: {
      indexTestBlinded: boolean;
      thresholdPrespecified: boolean;
      operatorDependencePresent: boolean;
    };
  };
  // Domain A3: Reference Standard
  referenceStandard: {
    description: string;
    likelyCorrectClassification: YesNoUnclear;
    blindedToIndex: YesNoUnclear;
    riskOfBias: RiskLevel;
    applicabilityConcern: RiskLevel;
    // Machine-readable flags
    flags: {
      referenceStandardImperfect: boolean;
      incorporationBiasPresent: boolean;
    };
  };
  // Domain A4: Flow and Timing
  flowAndTiming: {
    excludedPatientsDescription: string;
    timeIntervalDescription: string;
    appropriateInterval: YesNoUnclear;
    allReceivedReference: YesNoUnclear;
    sameReferenceStandard: YesNoUnclear;
    allIncludedInAnalysis: YesNoUnclear;
    riskOfBias: RiskLevel;
    // Machine-readable flags
    flags: {
      partialVerification: boolean;
      differentialVerification: boolean;
      timingBiasPossible: boolean;
      indeterminateResultsExcluded: boolean;
    };
  };
}

// Section B: LR Modifier Assessment
export interface LRModifierData {
  // B1: Patient Spectrum & Disease Characteristics
  b1_spectrum: {
    diseaseSeverityRepresentative: YesNoUnclear;
    diseaseStageRepresentative: YesNoUnclear;
    phenotypeSubtypeRestricted: YesNoUnclear;
    symptomProfileTypical: YesNoUnclear;
    mimickingConditionsExcluded: YesNoUnclear;
    maskingConditionsPresent: YesNoUnclear;
  };
  // B2: Demographics & Baseline Patient Factors
  b2_demographics: {
    ageDistributionRepresentative: YesNoUnclear;
    sexDistributionRepresentative: YesNoUnclear;
    comorbidityBurdenRepresentative: YesNoUnclear;
    renalHepaticFunctionAffectsTest: YesNoUnclear;
    medicationsAffectSignal: YesNoUnclear;
    medicationsList: string;
  };
  // B3: Clinical Setting & Intended Use
  b3_setting: {
    setting: 'screening' | 'ED' | 'ICU' | 'outpatient' | 'specialty' | '';
    referralEnrichmentPresent: YesNoUnclear;
    testUsedFor: 'rule_out' | 'rule_in' | 'triage' | 'diagnosis' | '';
  };
  // B4: Timing Relative to Biology & Care
  b4_timing: {
    timeFromSymptomOnsetControlled: YesNoUnclear;
    treatmentStartedBeforeTest: YesNoUnclear;
    serialTestingUsed: YesNoUnclear;
    physiologicStateStandardized: YesNoUnclear;
  };
  // B5: Index Test Technology & Protocol
  b5_technology: {
    assayPlatformSpecified: YesNoUnclear;
    platformMatchesUserContext: YesNoUnclear;
    operatorDependenceHigh: YesNoUnclear;
    protocolVariabilityPossible: YesNoUnclear;
  };
  // B6: Pre-Analytic Conditions (Biomarkers)
  b6_preanalytic: {
    specimenTypeStandardized: YesNoUnclear;
    collectionHandlingStandardized: YesNoUnclear;
    transportStorageReported: YesNoUnclear;
    knownInterferentsAddressed: YesNoUnclear;
  };
  // B7: Interpretation & Human Factors
  b7_interpretation: {
    readerExperienceReported: YesNoUnclear;
    interReaderVariabilityReported: YesNoUnclear;
    structuredInterpretationUsed: YesNoUnclear;
    aiAssistanceUsed: YesNoUnclear;
  };
  // B8: Thresholding & Result Definition
  b8_thresholding: {
    thresholdOptimizedPosthoc: YesNoUnclear;
    multipleThresholdsReported: YesNoUnclear;
    indeterminateResultsReported: YesNoUnclear;
  };
  // B9: Reference Standard Effects (LR-Specific)
  b9_referenceEffects: {
    referenceStandardUniform: YesNoUnclear;
    referenceStandardIndependent: YesNoUnclear;
    followupUsedAsReference: YesNoUnclear;
    diseaseDefinitionStable: YesNoUnclear;
  };
  // B10: Analysis & Reporting Choices
  b10_analysis: {
    selectiveCutpointReporting: YesNoUnclear;
    subgroupAnalysisPosthoc: YesNoUnclear;
    continuousDataDichotomized: YesNoUnclear;
    intervalLRsReportedOrDerivable: YesNoUnclear;
  };
  // B11: Publication Effects
  b11_publication: {
    studyPreRegistered: YesNoUnclear;
    negativeResultsReported: YesNoUnclear;
    outcomesMatchMethods: YesNoUnclear;
  };
}

// Computed outputs
export interface LRValidityProfile {
  internalValidity: ValidityLevel;
  transportability: ValidityLevel;
  warnings: string[];
  summary: string;
  flags: {
    lrPlusInflationRisk: boolean;
    lrMinusInflationRisk: boolean;
    intervalLRsPreferred: boolean;
    lrsUnstableAcrossSettings: boolean;
    populationTransportabilityLimited: boolean;
    pretestSpectrumShiftLikely: boolean;
    timeDependentLRInstability: boolean;
    analyticVariabilityAffectsLR: boolean;
    measurementNoiseBiasPossible: boolean;
    readerVariabilityAffectsLR: boolean;
    lrExtremenessInflationRisk: boolean;
    referenceStandardBiasAffectsLR: boolean;
    reportedLRsOveroptimistic: boolean;
    publicationBiasPossible: boolean;
  };
}

export interface LRQualityAssessmentData {
  quadas2: EnhancedQUADAS2Data;
  lrModifiers: LRModifierData;
  computed?: LRValidityProfile;
}

interface LRQualityAssessmentProps {
  value: LRQualityAssessmentData;
  onChange: (data: LRQualityAssessmentData) => void;
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function RadioOption({ 
  name, 
  value, 
  checked, 
  onChange, 
  label, 
  color 
}: { 
  name: string; 
  value: string; 
  checked: boolean; 
  onChange: () => void; 
  label: string;
  color: string;
}) {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4"
      />
      <span className={`text-sm ${color}`}>{label}</span>
    </label>
  );
}

function YesNoUnclearQuestion({
  id,
  question,
  value,
  onChange,
  hint,
}: {
  id: string;
  question: string;
  value: YesNoUnclear;
  onChange: (value: YesNoUnclear) => void;
  hint?: string;
}) {
  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <p className="text-sm text-gray-700 mb-1">{question}</p>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
      <div className="flex space-x-6">
        <RadioOption name={id} value="yes" checked={value === 'yes'} onChange={() => onChange('yes')} label="Yes" color="text-green-600" />
        <RadioOption name={id} value="no" checked={value === 'no'} onChange={() => onChange('no')} label="No" color="text-red-600" />
        <RadioOption name={id} value="unclear" checked={value === 'unclear'} onChange={() => onChange('unclear')} label="Unclear" color="text-amber-600" />
      </div>
    </div>
  );
}

function RiskJudgment({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: RiskLevel;
  onChange: (value: RiskLevel) => void;
}) {
  return (
    <div className="py-3 bg-gray-50 px-3 rounded-md">
      <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
      <div className="flex space-x-6">
        <RadioOption name={id} value="low" checked={value === 'low'} onChange={() => onChange('low')} label="Low" color="text-green-600 font-medium" />
        <RadioOption name={id} value="high" checked={value === 'high'} onChange={() => onChange('high')} label="High" color="text-red-600 font-medium" />
        <RadioOption name={id} value="unclear" checked={value === 'unclear'} onChange={() => onChange('unclear')} label="Unclear" color="text-amber-600 font-medium" />
      </div>
    </div>
  );
}

function SelectOption({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="py-2">
      <Label className="text-sm text-gray-700">{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 p-2 border rounded-md text-sm"
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function SectionCollapsible({ 
  title, 
  description, 
  children, 
  defaultOpen = false 
}: { 
  title: string; 
  description: string; 
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
          <span className="text-gray-400">{isOpen ? '▼' : '▶'}</span>
        </div>
      </CardHeader>
      {isOpen && <CardContent>{children}</CardContent>}
    </Card>
  );
}

// =============================================================================
// COMPUTATION LOGIC
// =============================================================================

function computeLRValidityProfile(
  quadas2: EnhancedQUADAS2Data,
  lrModifiers: LRModifierData
): LRValidityProfile {
  const warnings: string[] = [];
  const flags = {
    lrPlusInflationRisk: false,
    lrMinusInflationRisk: false,
    intervalLRsPreferred: false,
    lrsUnstableAcrossSettings: false,
    populationTransportabilityLimited: false,
    pretestSpectrumShiftLikely: false,
    timeDependentLRInstability: false,
    analyticVariabilityAffectsLR: false,
    measurementNoiseBiasPossible: false,
    readerVariabilityAffectsLR: false,
    lrExtremenessInflationRisk: false,
    referenceStandardBiasAffectsLR: false,
    reportedLRsOveroptimistic: false,
    publicationBiasPossible: false,
  };

  // Analyze QUADAS-2 flags
  if (quadas2.patientSelection.flags.selectionBiasPresent || quadas2.patientSelection.flags.twoGateDesign) {
    flags.lrPlusInflationRisk = true;
    warnings.push('Selection bias may inflate LR+');
  }
  if (quadas2.patientSelection.flags.restrictedSpectrum) {
    flags.lrPlusInflationRisk = true;
    flags.lrMinusInflationRisk = true;
    warnings.push('Restricted disease spectrum may distort LR magnitude');
  }
  if (quadas2.flowAndTiming.flags.partialVerification) {
    flags.lrPlusInflationRisk = true;
    warnings.push('Partial verification bias likely inflates LR+');
  }
  if (quadas2.flowAndTiming.flags.differentialVerification) {
    warnings.push('Differential verification may affect LR estimates unpredictably');
  }
  if (quadas2.referenceStandard.flags.referenceStandardImperfect) {
    flags.referenceStandardBiasAffectsLR = true;
    warnings.push('Imperfect reference standard affects LR validity');
  }

  // Analyze LR Modifiers - B1 Spectrum
  if (lrModifiers.b1_spectrum.diseaseSeverityRepresentative === 'no') {
    flags.lrPlusInflationRisk = true;
    warnings.push('Non-representative disease severity may inflate LR+');
  }
  if (lrModifiers.b1_spectrum.mimickingConditionsExcluded === 'yes') {
    flags.lrPlusInflationRisk = true;
    warnings.push('Exclusion of mimicking conditions inflates LR+');
  }

  // B2 Demographics
  if (lrModifiers.b2_demographics.ageDistributionRepresentative === 'no' ||
      lrModifiers.b2_demographics.comorbidityBurdenRepresentative === 'no') {
    flags.populationTransportabilityLimited = true;
    warnings.push('LRs may not transport to different demographic populations');
  }

  // B3 Setting
  if (lrModifiers.b3_setting.referralEnrichmentPresent === 'yes') {
    flags.pretestSpectrumShiftLikely = true;
    flags.lrPlusInflationRisk = true;
    warnings.push('Referral enrichment shifts pretest probability and inflates apparent LR+');
  }

  // B4 Timing
  if (lrModifiers.b4_timing.treatmentStartedBeforeTest === 'yes') {
    flags.timeDependentLRInstability = true;
    warnings.push('Treatment before testing may alter test performance');
  }
  if (lrModifiers.b4_timing.timeFromSymptomOnsetControlled === 'no') {
    flags.timeDependentLRInstability = true;
    warnings.push('Variable timing from symptom onset affects LR stability');
  }

  // B5 Technology
  if (lrModifiers.b5_technology.platformMatchesUserContext === 'no') {
    flags.analyticVariabilityAffectsLR = true;
    warnings.push('Different assay platform may affect LR transportability');
  }
  if (lrModifiers.b5_technology.operatorDependenceHigh === 'yes') {
    flags.readerVariabilityAffectsLR = true;
    warnings.push('High operator dependence introduces LR variability');
  }

  // B6 Pre-analytic
  if (lrModifiers.b6_preanalytic.specimenTypeStandardized === 'no' ||
      lrModifiers.b6_preanalytic.collectionHandlingStandardized === 'no') {
    flags.measurementNoiseBiasPossible = true;
    warnings.push('Pre-analytic variability may affect LR precision');
  }

  // B7 Interpretation
  if (lrModifiers.b7_interpretation.interReaderVariabilityReported === 'no' && 
      lrModifiers.b5_technology.operatorDependenceHigh === 'yes') {
    flags.readerVariabilityAffectsLR = true;
    warnings.push('Reader variability not reported despite operator-dependent test');
  }

  // B8 Thresholding
  if (lrModifiers.b8_thresholding.thresholdOptimizedPosthoc === 'yes') {
    flags.lrExtremenessInflationRisk = true;
    flags.reportedLRsOveroptimistic = true;
    warnings.push('Post-hoc threshold optimization inflates extreme LR values');
  }
  if (lrModifiers.b8_thresholding.multipleThresholdsReported === 'no') {
    flags.intervalLRsPreferred = true;
    warnings.push('Single threshold reported; interval LRs would provide more clinical utility');
  }

  // B9 Reference effects
  if (lrModifiers.b9_referenceEffects.referenceStandardIndependent === 'no') {
    flags.referenceStandardBiasAffectsLR = true;
    warnings.push('Index test incorporated in reference standard (incorporation bias)');
  }

  // B10 Analysis
  if (lrModifiers.b10_analysis.selectiveCutpointReporting === 'yes') {
    flags.reportedLRsOveroptimistic = true;
    warnings.push('Selective cutpoint reporting suggests overoptimistic LRs');
  }
  if (lrModifiers.b10_analysis.intervalLRsReportedOrDerivable === 'no') {
    flags.intervalLRsPreferred = true;
  }

  // B11 Publication
  if (lrModifiers.b11_publication.studyPreRegistered === 'no') {
    flags.publicationBiasPossible = true;
    warnings.push('Study not pre-registered; publication bias possible');
  }

  // Compute overall validity levels
  const biasCount = [
    quadas2.patientSelection.riskOfBias === 'high',
    quadas2.indexTest.riskOfBias === 'high',
    quadas2.referenceStandard.riskOfBias === 'high',
    quadas2.flowAndTiming.riskOfBias === 'high',
  ].filter(Boolean).length;

  const transportabilityIssues = [
    flags.populationTransportabilityLimited,
    flags.pretestSpectrumShiftLikely,
    flags.analyticVariabilityAffectsLR,
    flags.lrsUnstableAcrossSettings,
  ].filter(Boolean).length;

  let internalValidity: ValidityLevel = 'high';
  if (biasCount >= 2 || flags.reportedLRsOveroptimistic) {
    internalValidity = 'low';
  } else if (biasCount >= 1 || flags.lrExtremenessInflationRisk) {
    internalValidity = 'moderate';
  }

  let transportability: ValidityLevel = 'high';
  if (transportabilityIssues >= 2) {
    transportability = 'low';
  } else if (transportabilityIssues >= 1) {
    transportability = 'moderate';
  }

  // Generate summary
  const summaryParts: string[] = [];
  if (internalValidity !== 'high') {
    const reasons: string[] = [];
    if (flags.lrPlusInflationRisk) reasons.push('selection/spectrum effects');
    if (flags.lrExtremenessInflationRisk) reasons.push('post-hoc threshold optimization');
    if (quadas2.flowAndTiming.flags.partialVerification) reasons.push('partial verification bias');
    if (reasons.length > 0) {
      summaryParts.push(`LRs may be inflated due to ${reasons.join(', ')}`);
    }
  }
  if (transportability !== 'high') {
    summaryParts.push('LRs may not generalize to different clinical settings or populations');
  }
  if (flags.intervalLRsPreferred) {
    summaryParts.push('Interval LRs are preferable to binary LR+/LR−');
  }

  const summary = summaryParts.length > 0 
    ? `Caution: ${summaryParts.join('. ')}.`
    : 'LRs appear methodologically sound with good transportability.';

  return {
    internalValidity,
    transportability,
    warnings,
    summary,
    flags,
  };
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function LRQualityAssessment({ value, onChange }: LRQualityAssessmentProps) {
  const [activeSection, setActiveSection] = useState<'quadas2' | 'modifiers' | 'results'>('quadas2');

  // Update functions for QUADAS-2
  const updatePatientSelection = (field: string, val: any) => {
    onChange({
      ...value,
      quadas2: {
        ...value.quadas2,
        patientSelection: { ...value.quadas2.patientSelection, [field]: val },
      },
    });
  };

  const updatePatientSelectionFlag = (flag: string, val: boolean) => {
    onChange({
      ...value,
      quadas2: {
        ...value.quadas2,
        patientSelection: {
          ...value.quadas2.patientSelection,
          flags: { ...value.quadas2.patientSelection.flags, [flag]: val },
        },
      },
    });
  };

  const updateIndexTest = (field: string, val: any) => {
    onChange({
      ...value,
      quadas2: {
        ...value.quadas2,
        indexTest: { ...value.quadas2.indexTest, [field]: val },
      },
    });
  };

  const updateIndexTestFlag = (flag: string, val: boolean) => {
    onChange({
      ...value,
      quadas2: {
        ...value.quadas2,
        indexTest: {
          ...value.quadas2.indexTest,
          flags: { ...value.quadas2.indexTest.flags, [flag]: val },
        },
      },
    });
  };

  const updateReferenceStandard = (field: string, val: any) => {
    onChange({
      ...value,
      quadas2: {
        ...value.quadas2,
        referenceStandard: { ...value.quadas2.referenceStandard, [field]: val },
      },
    });
  };

  const updateReferenceStandardFlag = (flag: string, val: boolean) => {
    onChange({
      ...value,
      quadas2: {
        ...value.quadas2,
        referenceStandard: {
          ...value.quadas2.referenceStandard,
          flags: { ...value.quadas2.referenceStandard.flags, [flag]: val },
        },
      },
    });
  };

  const updateFlowAndTiming = (field: string, val: any) => {
    onChange({
      ...value,
      quadas2: {
        ...value.quadas2,
        flowAndTiming: { ...value.quadas2.flowAndTiming, [field]: val },
      },
    });
  };

  const updateFlowAndTimingFlag = (flag: string, val: boolean) => {
    onChange({
      ...value,
      quadas2: {
        ...value.quadas2,
        flowAndTiming: {
          ...value.quadas2.flowAndTiming,
          flags: { ...value.quadas2.flowAndTiming.flags, [flag]: val },
        },
      },
    });
  };

  // Update functions for LR Modifiers
  const updateLRModifier = (section: keyof LRModifierData, field: string, val: any) => {
    onChange({
      ...value,
      lrModifiers: {
        ...value.lrModifiers,
        [section]: { ...value.lrModifiers[section], [field]: val },
      },
    });
  };

  // Compute results
  const computedProfile = useMemo(() => {
    return computeLRValidityProfile(value.quadas2, value.lrModifiers);
  }, [value.quadas2, value.lrModifiers]);

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveSection('quadas2')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeSection === 'quadas2'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          A. QUADAS-2 (Bias)
        </button>
        <button
          onClick={() => setActiveSection('modifiers')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeSection === 'modifiers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          B. LR Modifiers
        </button>
        <button
          onClick={() => setActiveSection('results')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeSection === 'results'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Results & Warnings
        </button>
      </div>

      {/* Section A: QUADAS-2 */}
      {activeSection === 'quadas2' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-800">
            <strong>QUADAS-2</strong> assesses risk of bias. Answer signaling questions, then judge overall risk and set specific bias flags for downstream analysis.
          </div>

          {/* Domain A1: Patient Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">A1. Patient Selection</CardTitle>
              <CardDescription>Could the selection of patients have introduced bias?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">Describe methods of patient selection:</Label>
                <Textarea
                  value={value.quadas2.patientSelection.description}
                  onChange={(e) => updatePatientSelection('description', e.target.value)}
                  placeholder="Describe how patients were selected..."
                  rows={2}
                  className="mt-1"
                />
              </div>
              
              <YesNoUnclearQuestion
                id="ps-consecutive"
                question="Was a consecutive or random sample of patients enrolled?"
                value={value.quadas2.patientSelection.consecutiveOrRandom}
                onChange={(v) => updatePatientSelection('consecutiveOrRandom', v)}
              />
              <YesNoUnclearQuestion
                id="ps-case-control"
                question="Was a case-control design avoided?"
                value={value.quadas2.patientSelection.caseControlAvoided}
                onChange={(v) => updatePatientSelection('caseControlAvoided', v)}
              />
              <YesNoUnclearQuestion
                id="ps-exclusions"
                question="Did the study avoid inappropriate exclusions?"
                value={value.quadas2.patientSelection.inappropriateExclusionsAvoided}
                onChange={(v) => updatePatientSelection('inappropriateExclusionsAvoided', v)}
              />

              <RiskJudgment
                id="ps-risk"
                label="Risk of Bias: Patient Selection"
                value={value.quadas2.patientSelection.riskOfBias}
                onChange={(v) => updatePatientSelection('riskOfBias', v)}
              />

              {/* Bias Flags */}
              <div className="p-3 bg-amber-50 rounded-md space-y-2">
                <p className="text-sm font-medium text-amber-900">Specific Bias Flags (for LR analysis):</p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={value.quadas2.patientSelection.flags.selectionBiasPresent}
                    onChange={(e) => updatePatientSelectionFlag('selectionBiasPresent', e.target.checked)}
                    className="rounded"
                  />
                  Selection bias present
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={value.quadas2.patientSelection.flags.twoGateDesign}
                    onChange={(e) => updatePatientSelectionFlag('twoGateDesign', e.target.checked)}
                    className="rounded"
                  />
                  Two-gate (case-control) design used
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={value.quadas2.patientSelection.flags.restrictedSpectrum}
                    onChange={(e) => updatePatientSelectionFlag('restrictedSpectrum', e.target.checked)}
                    className="rounded"
                  />
                  Restricted disease spectrum
                </label>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-sm mb-2">Applicability Concerns</h4>
                <Textarea
                  value={value.quadas2.patientSelection.applicabilityDescription}
                  onChange={(e) => updatePatientSelection('applicabilityDescription', e.target.value)}
                  placeholder="Describe included patients and clinical context..."
                  rows={2}
                />
                <div className="mt-2">
                  <RiskJudgment
                    id="ps-applicability"
                    label="Applicability Concern"
                    value={value.quadas2.patientSelection.applicabilityConcern}
                    onChange={(v) => updatePatientSelection('applicabilityConcern', v)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Domain A2: Index Test */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">A2. Index Test</CardTitle>
              <CardDescription>Could the conduct or interpretation of the index test have introduced bias?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">Describe the index test:</Label>
                <Textarea
                  value={value.quadas2.indexTest.description}
                  onChange={(e) => updateIndexTest('description', e.target.value)}
                  placeholder="Describe the index test methodology..."
                  rows={2}
                  className="mt-1"
                />
              </div>
              
              <YesNoUnclearQuestion
                id="it-blinded"
                question="Were index test results interpreted without knowledge of reference standard results?"
                value={value.quadas2.indexTest.blindedToReference}
                onChange={(v) => updateIndexTest('blindedToReference', v)}
              />
              <YesNoUnclearQuestion
                id="it-threshold"
                question="If a threshold was used, was it pre-specified?"
                value={value.quadas2.indexTest.thresholdPreSpecified}
                onChange={(v) => updateIndexTest('thresholdPreSpecified', v)}
              />

              <RiskJudgment
                id="it-risk"
                label="Risk of Bias: Index Test"
                value={value.quadas2.indexTest.riskOfBias}
                onChange={(v) => updateIndexTest('riskOfBias', v)}
              />

              <div className="p-3 bg-amber-50 rounded-md space-y-2">
                <p className="text-sm font-medium text-amber-900">Specific Bias Flags:</p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={value.quadas2.indexTest.flags.indexTestBlinded}
                    onChange={(e) => updateIndexTestFlag('indexTestBlinded', e.target.checked)}
                    className="rounded"
                  />
                  Index test properly blinded
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={value.quadas2.indexTest.flags.thresholdPrespecified}
                    onChange={(e) => updateIndexTestFlag('thresholdPrespecified', e.target.checked)}
                    className="rounded"
                  />
                  Threshold pre-specified
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={value.quadas2.indexTest.flags.operatorDependencePresent}
                    onChange={(e) => updateIndexTestFlag('operatorDependencePresent', e.target.checked)}
                    className="rounded"
                  />
                  Operator dependence present
                </label>
              </div>

              <RiskJudgment
                id="it-applicability"
                label="Applicability Concern: Index Test"
                value={value.quadas2.indexTest.applicabilityConcern}
                onChange={(v) => updateIndexTest('applicabilityConcern', v)}
              />
            </CardContent>
          </Card>

          {/* Domain A3: Reference Standard */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">A3. Reference Standard</CardTitle>
              <CardDescription>Could the reference standard have introduced bias?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">Describe the reference standard:</Label>
                <Textarea
                  value={value.quadas2.referenceStandard.description}
                  onChange={(e) => updateReferenceStandard('description', e.target.value)}
                  placeholder="Describe the reference standard methodology..."
                  rows={2}
                  className="mt-1"
                />
              </div>
              
              <YesNoUnclearQuestion
                id="rs-correct"
                question="Is the reference standard likely to correctly classify the target condition?"
                value={value.quadas2.referenceStandard.likelyCorrectClassification}
                onChange={(v) => updateReferenceStandard('likelyCorrectClassification', v)}
              />
              <YesNoUnclearQuestion
                id="rs-blinded"
                question="Were reference standard results interpreted without knowledge of index test results?"
                value={value.quadas2.referenceStandard.blindedToIndex}
                onChange={(v) => updateReferenceStandard('blindedToIndex', v)}
              />

              <RiskJudgment
                id="rs-risk"
                label="Risk of Bias: Reference Standard"
                value={value.quadas2.referenceStandard.riskOfBias}
                onChange={(v) => updateReferenceStandard('riskOfBias', v)}
              />

              <div className="p-3 bg-amber-50 rounded-md space-y-2">
                <p className="text-sm font-medium text-amber-900">Specific Bias Flags:</p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={value.quadas2.referenceStandard.flags.referenceStandardImperfect}
                    onChange={(e) => updateReferenceStandardFlag('referenceStandardImperfect', e.target.checked)}
                    className="rounded"
                  />
                  Reference standard imperfect
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={value.quadas2.referenceStandard.flags.incorporationBiasPresent}
                    onChange={(e) => updateReferenceStandardFlag('incorporationBiasPresent', e.target.checked)}
                    className="rounded"
                  />
                  Incorporation bias present
                </label>
              </div>

              <RiskJudgment
                id="rs-applicability"
                label="Applicability Concern: Reference Standard"
                value={value.quadas2.referenceStandard.applicabilityConcern}
                onChange={(v) => updateReferenceStandard('applicabilityConcern', v)}
              />
            </CardContent>
          </Card>

          {/* Domain A4: Flow and Timing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">A4. Flow and Timing</CardTitle>
              <CardDescription>Could the patient flow have introduced bias?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">Describe excluded patients:</Label>
                <Textarea
                  value={value.quadas2.flowAndTiming.excludedPatientsDescription}
                  onChange={(e) => updateFlowAndTiming('excludedPatientsDescription', e.target.value)}
                  placeholder="Describe excluded patients and reasons..."
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Describe time interval between tests:</Label>
                <Textarea
                  value={value.quadas2.flowAndTiming.timeIntervalDescription}
                  onChange={(e) => updateFlowAndTiming('timeIntervalDescription', e.target.value)}
                  placeholder="Describe timing between index test and reference standard..."
                  rows={2}
                  className="mt-1"
                />
              </div>
              
              <YesNoUnclearQuestion
                id="ft-interval"
                question="Was there an appropriate interval between index test and reference standard?"
                value={value.quadas2.flowAndTiming.appropriateInterval}
                onChange={(v) => updateFlowAndTiming('appropriateInterval', v)}
              />
              <YesNoUnclearQuestion
                id="ft-all-received"
                question="Did all patients receive a reference standard?"
                value={value.quadas2.flowAndTiming.allReceivedReference}
                onChange={(v) => updateFlowAndTiming('allReceivedReference', v)}
              />
              <YesNoUnclearQuestion
                id="ft-same-reference"
                question="Did patients receive the same reference standard?"
                value={value.quadas2.flowAndTiming.sameReferenceStandard}
                onChange={(v) => updateFlowAndTiming('sameReferenceStandard', v)}
              />
              <YesNoUnclearQuestion
                id="ft-all-included"
                question="Were all patients included in the analysis?"
                value={value.quadas2.flowAndTiming.allIncludedInAnalysis}
                onChange={(v) => updateFlowAndTiming('allIncludedInAnalysis', v)}
              />

              <RiskJudgment
                id="ft-risk"
                label="Risk of Bias: Flow and Timing"
                value={value.quadas2.flowAndTiming.riskOfBias}
                onChange={(v) => updateFlowAndTiming('riskOfBias', v)}
              />

              <div className="p-3 bg-amber-50 rounded-md space-y-2">
                <p className="text-sm font-medium text-amber-900">Specific Bias Flags:</p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={value.quadas2.flowAndTiming.flags.partialVerification}
                    onChange={(e) => updateFlowAndTimingFlag('partialVerification', e.target.checked)}
                    className="rounded"
                  />
                  Partial verification bias
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={value.quadas2.flowAndTiming.flags.differentialVerification}
                    onChange={(e) => updateFlowAndTimingFlag('differentialVerification', e.target.checked)}
                    className="rounded"
                  />
                  Differential verification bias
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={value.quadas2.flowAndTiming.flags.timingBiasPossible}
                    onChange={(e) => updateFlowAndTimingFlag('timingBiasPossible', e.target.checked)}
                    className="rounded"
                  />
                  Timing bias possible
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={value.quadas2.flowAndTiming.flags.indeterminateResultsExcluded}
                    onChange={(e) => updateFlowAndTimingFlag('indeterminateResultsExcluded', e.target.checked)}
                    className="rounded"
                  />
                  Indeterminate results excluded
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Continue Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={() => setActiveSection('modifiers')}>
              Continue to LR Modifiers →
            </Button>
          </div>
        </div>
      )}

      {/* Section B: LR Modifiers */}
      {activeSection === 'modifiers' && (
        <div className="space-y-4">
          <div className="p-3 bg-purple-50 rounded-md text-sm text-purple-800">
            <strong>LR Modifier Assessment</strong> identifies mechanisms by which likelihood ratios may be distorted or non-transportable. Only answer questions not already captured by QUADAS-2.
          </div>

          {/* B1: Spectrum */}
          <SectionCollapsible
            title="B1. Patient Spectrum & Disease Characteristics"
            description="Does disease presentation affect LR magnitude?"
            defaultOpen={true}
          >
            <div className="space-y-2">
              <YesNoUnclearQuestion
                id="b1-severity"
                question="Is disease severity representative of the target population?"
                value={value.lrModifiers.b1_spectrum.diseaseSeverityRepresentative}
                onChange={(v) => updateLRModifier('b1_spectrum', 'diseaseSeverityRepresentative', v)}
                hint="Severe cases may have more obvious test results"
              />
              <YesNoUnclearQuestion
                id="b1-stage"
                question="Is disease stage representative?"
                value={value.lrModifiers.b1_spectrum.diseaseStageRepresentative}
                onChange={(v) => updateLRModifier('b1_spectrum', 'diseaseStageRepresentative', v)}
              />
              <YesNoUnclearQuestion
                id="b1-phenotype"
                question="Is the study restricted to specific phenotype/subtype?"
                value={value.lrModifiers.b1_spectrum.phenotypeSubtypeRestricted}
                onChange={(v) => updateLRModifier('b1_spectrum', 'phenotypeSubtypeRestricted', v)}
              />
              <YesNoUnclearQuestion
                id="b1-mimicking"
                question="Were mimicking conditions excluded from the study?"
                value={value.lrModifiers.b1_spectrum.mimickingConditionsExcluded}
                onChange={(v) => updateLRModifier('b1_spectrum', 'mimickingConditionsExcluded', v)}
                hint="Exclusion inflates LR+"
              />
              <YesNoUnclearQuestion
                id="b1-masking"
                question="Are conditions present that could mask test signal?"
                value={value.lrModifiers.b1_spectrum.maskingConditionsPresent}
                onChange={(v) => updateLRModifier('b1_spectrum', 'maskingConditionsPresent', v)}
              />
            </div>
          </SectionCollapsible>

          {/* B2: Demographics */}
          <SectionCollapsible
            title="B2. Demographics & Baseline Factors"
            description="Do patient characteristics limit transportability?"
          >
            <div className="space-y-2">
              <YesNoUnclearQuestion
                id="b2-age"
                question="Is age distribution representative of your target population?"
                value={value.lrModifiers.b2_demographics.ageDistributionRepresentative}
                onChange={(v) => updateLRModifier('b2_demographics', 'ageDistributionRepresentative', v)}
              />
              <YesNoUnclearQuestion
                id="b2-sex"
                question="Is sex distribution representative?"
                value={value.lrModifiers.b2_demographics.sexDistributionRepresentative}
                onChange={(v) => updateLRModifier('b2_demographics', 'sexDistributionRepresentative', v)}
              />
              <YesNoUnclearQuestion
                id="b2-comorbidity"
                question="Is comorbidity burden representative?"
                value={value.lrModifiers.b2_demographics.comorbidityBurdenRepresentative}
                onChange={(v) => updateLRModifier('b2_demographics', 'comorbidityBurdenRepresentative', v)}
              />
              <YesNoUnclearQuestion
                id="b2-renal"
                question="Does renal/hepatic function affect test values?"
                value={value.lrModifiers.b2_demographics.renalHepaticFunctionAffectsTest}
                onChange={(v) => updateLRModifier('b2_demographics', 'renalHepaticFunctionAffectsTest', v)}
              />
              <YesNoUnclearQuestion
                id="b2-meds"
                question="Do medications affect test signal?"
                value={value.lrModifiers.b2_demographics.medicationsAffectSignal}
                onChange={(v) => updateLRModifier('b2_demographics', 'medicationsAffectSignal', v)}
              />
            </div>
          </SectionCollapsible>

          {/* B3: Setting */}
          <SectionCollapsible
            title="B3. Clinical Setting & Intended Use"
            description="Does setting affect pretest probability spectrum?"
          >
            <div className="space-y-2">
              <SelectOption
                id="b3-setting"
                label="Clinical setting"
                value={value.lrModifiers.b3_setting.setting}
                onChange={(v) => updateLRModifier('b3_setting', 'setting', v)}
                options={[
                  { value: 'screening', label: 'Screening' },
                  { value: 'ED', label: 'Emergency Department' },
                  { value: 'ICU', label: 'ICU' },
                  { value: 'outpatient', label: 'Outpatient' },
                  { value: 'specialty', label: 'Specialty Clinic' },
                ]}
              />
              <YesNoUnclearQuestion
                id="b3-referral"
                question="Is referral enrichment present?"
                value={value.lrModifiers.b3_setting.referralEnrichmentPresent}
                onChange={(v) => updateLRModifier('b3_setting', 'referralEnrichmentPresent', v)}
                hint="Tertiary centers have higher disease prevalence"
              />
              <SelectOption
                id="b3-use"
                label="Test used for"
                value={value.lrModifiers.b3_setting.testUsedFor}
                onChange={(v) => updateLRModifier('b3_setting', 'testUsedFor', v)}
                options={[
                  { value: 'rule_out', label: 'Rule out' },
                  { value: 'rule_in', label: 'Rule in' },
                  { value: 'triage', label: 'Triage' },
                  { value: 'diagnosis', label: 'Definitive diagnosis' },
                ]}
              />
            </div>
          </SectionCollapsible>

          {/* B4: Timing */}
          <SectionCollapsible
            title="B4. Timing Relative to Biology & Care"
            description="Does timing affect test performance?"
          >
            <div className="space-y-2">
              <YesNoUnclearQuestion
                id="b4-onset"
                question="Was time from symptom onset controlled/reported?"
                value={value.lrModifiers.b4_timing.timeFromSymptomOnsetControlled}
                onChange={(v) => updateLRModifier('b4_timing', 'timeFromSymptomOnsetControlled', v)}
              />
              <YesNoUnclearQuestion
                id="b4-treatment"
                question="Was treatment started before test?"
                value={value.lrModifiers.b4_timing.treatmentStartedBeforeTest}
                onChange={(v) => updateLRModifier('b4_timing', 'treatmentStartedBeforeTest', v)}
                hint="Treatment may alter test results"
              />
              <YesNoUnclearQuestion
                id="b4-serial"
                question="Was serial testing used?"
                value={value.lrModifiers.b4_timing.serialTestingUsed}
                onChange={(v) => updateLRModifier('b4_timing', 'serialTestingUsed', v)}
              />
              <YesNoUnclearQuestion
                id="b4-physio"
                question="Was physiologic state standardized?"
                value={value.lrModifiers.b4_timing.physiologicStateStandardized}
                onChange={(v) => updateLRModifier('b4_timing', 'physiologicStateStandardized', v)}
                hint="Fasting, hydration, activity level"
              />
            </div>
          </SectionCollapsible>

          {/* B5: Technology */}
          <SectionCollapsible
            title="B5. Index Test Technology & Protocol"
            description="Does assay variability affect LR?"
          >
            <div className="space-y-2">
              <YesNoUnclearQuestion
                id="b5-platform"
                question="Is assay platform specified?"
                value={value.lrModifiers.b5_technology.assayPlatformSpecified}
                onChange={(v) => updateLRModifier('b5_technology', 'assayPlatformSpecified', v)}
              />
              <YesNoUnclearQuestion
                id="b5-match"
                question="Does platform match your clinical context?"
                value={value.lrModifiers.b5_technology.platformMatchesUserContext}
                onChange={(v) => updateLRModifier('b5_technology', 'platformMatchesUserContext', v)}
              />
              <YesNoUnclearQuestion
                id="b5-operator"
                question="Is operator dependence high?"
                value={value.lrModifiers.b5_technology.operatorDependenceHigh}
                onChange={(v) => updateLRModifier('b5_technology', 'operatorDependenceHigh', v)}
                hint="Imaging, physical exam, ultrasound"
              />
              <YesNoUnclearQuestion
                id="b5-protocol"
                question="Is protocol variability possible?"
                value={value.lrModifiers.b5_technology.protocolVariabilityPossible}
                onChange={(v) => updateLRModifier('b5_technology', 'protocolVariabilityPossible', v)}
              />
            </div>
          </SectionCollapsible>

          {/* B6: Pre-analytic */}
          <SectionCollapsible
            title="B6. Pre-Analytic Conditions"
            description="For biomarkers: specimen handling effects"
          >
            <div className="space-y-2">
              <YesNoUnclearQuestion
                id="b6-specimen"
                question="Is specimen type standardized?"
                value={value.lrModifiers.b6_preanalytic.specimenTypeStandardized}
                onChange={(v) => updateLRModifier('b6_preanalytic', 'specimenTypeStandardized', v)}
              />
              <YesNoUnclearQuestion
                id="b6-collection"
                question="Is collection/handling standardized?"
                value={value.lrModifiers.b6_preanalytic.collectionHandlingStandardized}
                onChange={(v) => updateLRModifier('b6_preanalytic', 'collectionHandlingStandardized', v)}
              />
              <YesNoUnclearQuestion
                id="b6-transport"
                question="Is transport/storage reported?"
                value={value.lrModifiers.b6_preanalytic.transportStorageReported}
                onChange={(v) => updateLRModifier('b6_preanalytic', 'transportStorageReported', v)}
              />
              <YesNoUnclearQuestion
                id="b6-interferents"
                question="Are known interferents addressed?"
                value={value.lrModifiers.b6_preanalytic.knownInterferentsAddressed}
                onChange={(v) => updateLRModifier('b6_preanalytic', 'knownInterferentsAddressed', v)}
              />
            </div>
          </SectionCollapsible>

          {/* B7: Interpretation */}
          <SectionCollapsible
            title="B7. Interpretation & Human Factors"
            description="Reader variability effects"
          >
            <div className="space-y-2">
              <YesNoUnclearQuestion
                id="b7-experience"
                question="Is reader experience reported?"
                value={value.lrModifiers.b7_interpretation.readerExperienceReported}
                onChange={(v) => updateLRModifier('b7_interpretation', 'readerExperienceReported', v)}
              />
              <YesNoUnclearQuestion
                id="b7-variability"
                question="Is inter-reader variability reported?"
                value={value.lrModifiers.b7_interpretation.interReaderVariabilityReported}
                onChange={(v) => updateLRModifier('b7_interpretation', 'interReaderVariabilityReported', v)}
              />
              <YesNoUnclearQuestion
                id="b7-structured"
                question="Is structured interpretation used?"
                value={value.lrModifiers.b7_interpretation.structuredInterpretationUsed}
                onChange={(v) => updateLRModifier('b7_interpretation', 'structuredInterpretationUsed', v)}
              />
              <YesNoUnclearQuestion
                id="b7-ai"
                question="Is AI assistance used?"
                value={value.lrModifiers.b7_interpretation.aiAssistanceUsed}
                onChange={(v) => updateLRModifier('b7_interpretation', 'aiAssistanceUsed', v)}
              />
            </div>
          </SectionCollapsible>

          {/* B8: Thresholding */}
          <SectionCollapsible
            title="B8. Thresholding & Result Definition"
            description="Cutpoint selection effects on LR"
          >
            <div className="space-y-2">
              <YesNoUnclearQuestion
                id="b8-posthoc"
                question="Was threshold optimized post-hoc?"
                value={value.lrModifiers.b8_thresholding.thresholdOptimizedPosthoc}
                onChange={(v) => updateLRModifier('b8_thresholding', 'thresholdOptimizedPosthoc', v)}
                hint="Data-driven optimization inflates LRs"
              />
              <YesNoUnclearQuestion
                id="b8-multiple"
                question="Were multiple thresholds reported?"
                value={value.lrModifiers.b8_thresholding.multipleThresholdsReported}
                onChange={(v) => updateLRModifier('b8_thresholding', 'multipleThresholdsReported', v)}
              />
              <YesNoUnclearQuestion
                id="b8-indeterminate"
                question="Were indeterminate results reported?"
                value={value.lrModifiers.b8_thresholding.indeterminateResultsReported}
                onChange={(v) => updateLRModifier('b8_thresholding', 'indeterminateResultsReported', v)}
              />
            </div>
          </SectionCollapsible>

          {/* B9: Reference Effects */}
          <SectionCollapsible
            title="B9. Reference Standard Effects (LR-Specific)"
            description="How reference standard affects LR validity"
          >
            <div className="space-y-2">
              <YesNoUnclearQuestion
                id="b9-uniform"
                question="Was reference standard uniform for all patients?"
                value={value.lrModifiers.b9_referenceEffects.referenceStandardUniform}
                onChange={(v) => updateLRModifier('b9_referenceEffects', 'referenceStandardUniform', v)}
              />
              <YesNoUnclearQuestion
                id="b9-independent"
                question="Was reference standard independent of index test?"
                value={value.lrModifiers.b9_referenceEffects.referenceStandardIndependent}
                onChange={(v) => updateLRModifier('b9_referenceEffects', 'referenceStandardIndependent', v)}
                hint="Incorporation bias if index test is part of reference"
              />
              <YesNoUnclearQuestion
                id="b9-followup"
                question="Was clinical follow-up used as reference?"
                value={value.lrModifiers.b9_referenceEffects.followupUsedAsReference}
                onChange={(v) => updateLRModifier('b9_referenceEffects', 'followupUsedAsReference', v)}
              />
              <YesNoUnclearQuestion
                id="b9-definition"
                question="Is disease definition stable/consistent?"
                value={value.lrModifiers.b9_referenceEffects.diseaseDefinitionStable}
                onChange={(v) => updateLRModifier('b9_referenceEffects', 'diseaseDefinitionStable', v)}
              />
            </div>
          </SectionCollapsible>

          {/* B10: Analysis */}
          <SectionCollapsible
            title="B10. Analysis & Reporting Choices"
            description="Analytical decisions affecting reported LRs"
          >
            <div className="space-y-2">
              <YesNoUnclearQuestion
                id="b10-selective"
                question="Is there evidence of selective cutpoint reporting?"
                value={value.lrModifiers.b10_analysis.selectiveCutpointReporting}
                onChange={(v) => updateLRModifier('b10_analysis', 'selectiveCutpointReporting', v)}
                hint="Only 'best' cutpoint shown"
              />
              <YesNoUnclearQuestion
                id="b10-subgroup"
                question="Are subgroup analyses post-hoc?"
                value={value.lrModifiers.b10_analysis.subgroupAnalysisPosthoc}
                onChange={(v) => updateLRModifier('b10_analysis', 'subgroupAnalysisPosthoc', v)}
              />
              <YesNoUnclearQuestion
                id="b10-dichotomized"
                question="Was continuous data dichotomized?"
                value={value.lrModifiers.b10_analysis.continuousDataDichotomized}
                onChange={(v) => updateLRModifier('b10_analysis', 'continuousDataDichotomized', v)}
              />
              <YesNoUnclearQuestion
                id="b10-interval"
                question="Are interval LRs reported or derivable?"
                value={value.lrModifiers.b10_analysis.intervalLRsReportedOrDerivable}
                onChange={(v) => updateLRModifier('b10_analysis', 'intervalLRsReportedOrDerivable', v)}
              />
            </div>
          </SectionCollapsible>

          {/* B11: Publication */}
          <SectionCollapsible
            title="B11. Publication Effects"
            description="Risk of publication bias"
          >
            <div className="space-y-2">
              <YesNoUnclearQuestion
                id="b11-prereg"
                question="Was the study pre-registered?"
                value={value.lrModifiers.b11_publication.studyPreRegistered}
                onChange={(v) => updateLRModifier('b11_publication', 'studyPreRegistered', v)}
              />
              <YesNoUnclearQuestion
                id="b11-negative"
                question="Are negative results reported?"
                value={value.lrModifiers.b11_publication.negativeResultsReported}
                onChange={(v) => updateLRModifier('b11_publication', 'negativeResultsReported', v)}
              />
              <YesNoUnclearQuestion
                id="b11-match"
                question="Do outcomes match methods section?"
                value={value.lrModifiers.b11_publication.outcomesMatchMethods}
                onChange={(v) => updateLRModifier('b11_publication', 'outcomesMatchMethods', v)}
              />
            </div>
          </SectionCollapsible>

          {/* Continue Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={() => setActiveSection('results')}>
              Continue to Results & Warnings →
            </Button>
          </div>
        </div>
      )}

      {/* Section: Results */}
      {activeSection === 'results' && (
        <div className="space-y-4">
          {/* Validity Profile */}
          <Card>
            <CardHeader>
              <CardTitle>LR Validity Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${
                  computedProfile.internalValidity === 'high' ? 'bg-green-50 border-green-200' :
                  computedProfile.internalValidity === 'moderate' ? 'bg-amber-50 border-amber-200' :
                  'bg-red-50 border-red-200'
                } border`}>
                  <p className="text-sm font-medium text-gray-700">Internal Validity</p>
                  <p className={`text-2xl font-bold ${
                    computedProfile.internalValidity === 'high' ? 'text-green-700' :
                    computedProfile.internalValidity === 'moderate' ? 'text-amber-700' :
                    'text-red-700'
                  }`}>
                    {computedProfile.internalValidity.toUpperCase()}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${
                  computedProfile.transportability === 'high' ? 'bg-green-50 border-green-200' :
                  computedProfile.transportability === 'moderate' ? 'bg-amber-50 border-amber-200' :
                  'bg-red-50 border-red-200'
                } border`}>
                  <p className="text-sm font-medium text-gray-700">Transportability</p>
                  <p className={`text-2xl font-bold ${
                    computedProfile.transportability === 'high' ? 'text-green-700' :
                    computedProfile.transportability === 'moderate' ? 'text-amber-700' :
                    'text-red-700'
                  }`}>
                    {computedProfile.transportability.toUpperCase()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Directional Warnings */}
          {computedProfile.warnings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Directional Warnings</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {computedProfile.warnings.map((warning, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-amber-500 mt-0.5">⚠</span>
                      <span className="text-gray-700">{warning}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Key Flags */}
          <Card>
            <CardHeader>
              <CardTitle>Key Flags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {computedProfile.flags.lrPlusInflationRisk && (
                  <div className="flex items-center gap-2 text-red-700">
                    <span>●</span> LR+ likely inflated
                  </div>
                )}
                {computedProfile.flags.lrMinusInflationRisk && (
                  <div className="flex items-center gap-2 text-red-700">
                    <span>●</span> LR− likely inflated
                  </div>
                )}
                {computedProfile.flags.intervalLRsPreferred && (
                  <div className="flex items-center gap-2 text-blue-700">
                    <span>●</span> Interval LRs preferred
                  </div>
                )}
                {computedProfile.flags.lrsUnstableAcrossSettings && (
                  <div className="flex items-center gap-2 text-amber-700">
                    <span>●</span> LRs unstable across settings
                  </div>
                )}
                {computedProfile.flags.populationTransportabilityLimited && (
                  <div className="flex items-center gap-2 text-amber-700">
                    <span>●</span> Population transportability limited
                  </div>
                )}
                {computedProfile.flags.reportedLRsOveroptimistic && (
                  <div className="flex items-center gap-2 text-red-700">
                    <span>●</span> Reported LRs overoptimistic
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 italic">
                {computedProfile.summary}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export function createEmptyLRQualityAssessmentData(): LRQualityAssessmentData {
  return {
    quadas2: {
      patientSelection: {
        description: '',
        consecutiveOrRandom: '',
        caseControlAvoided: '',
        inappropriateExclusionsAvoided: '',
        riskOfBias: '',
        applicabilityDescription: '',
        applicabilityConcern: '',
        flags: {
          selectionBiasPresent: false,
          twoGateDesign: false,
          restrictedSpectrum: false,
        },
      },
      indexTest: {
        description: '',
        blindedToReference: '',
        thresholdPreSpecified: '',
        riskOfBias: '',
        applicabilityConcern: '',
        flags: {
          indexTestBlinded: false,
          thresholdPrespecified: false,
          operatorDependencePresent: false,
        },
      },
      referenceStandard: {
        description: '',
        likelyCorrectClassification: '',
        blindedToIndex: '',
        riskOfBias: '',
        applicabilityConcern: '',
        flags: {
          referenceStandardImperfect: false,
          incorporationBiasPresent: false,
        },
      },
      flowAndTiming: {
        excludedPatientsDescription: '',
        timeIntervalDescription: '',
        appropriateInterval: '',
        allReceivedReference: '',
        sameReferenceStandard: '',
        allIncludedInAnalysis: '',
        riskOfBias: '',
        flags: {
          partialVerification: false,
          differentialVerification: false,
          timingBiasPossible: false,
          indeterminateResultsExcluded: false,
        },
      },
    },
    lrModifiers: {
      b1_spectrum: {
        diseaseSeverityRepresentative: '',
        diseaseStageRepresentative: '',
        phenotypeSubtypeRestricted: '',
        symptomProfileTypical: '',
        mimickingConditionsExcluded: '',
        maskingConditionsPresent: '',
      },
      b2_demographics: {
        ageDistributionRepresentative: '',
        sexDistributionRepresentative: '',
        comorbidityBurdenRepresentative: '',
        renalHepaticFunctionAffectsTest: '',
        medicationsAffectSignal: '',
        medicationsList: '',
      },
      b3_setting: {
        setting: '',
        referralEnrichmentPresent: '',
        testUsedFor: '',
      },
      b4_timing: {
        timeFromSymptomOnsetControlled: '',
        treatmentStartedBeforeTest: '',
        serialTestingUsed: '',
        physiologicStateStandardized: '',
      },
      b5_technology: {
        assayPlatformSpecified: '',
        platformMatchesUserContext: '',
        operatorDependenceHigh: '',
        protocolVariabilityPossible: '',
      },
      b6_preanalytic: {
        specimenTypeStandardized: '',
        collectionHandlingStandardized: '',
        transportStorageReported: '',
        knownInterferentsAddressed: '',
      },
      b7_interpretation: {
        readerExperienceReported: '',
        interReaderVariabilityReported: '',
        structuredInterpretationUsed: '',
        aiAssistanceUsed: '',
      },
      b8_thresholding: {
        thresholdOptimizedPosthoc: '',
        multipleThresholdsReported: '',
        indeterminateResultsReported: '',
      },
      b9_referenceEffects: {
        referenceStandardUniform: '',
        referenceStandardIndependent: '',
        followupUsedAsReference: '',
        diseaseDefinitionStable: '',
      },
      b10_analysis: {
        selectiveCutpointReporting: '',
        subgroupAnalysisPosthoc: '',
        continuousDataDichotomized: '',
        intervalLRsReportedOrDerivable: '',
      },
      b11_publication: {
        studyPreRegistered: '',
        negativeResultsReported: '',
        outcomesMatchMethods: '',
      },
    },
  };
}

export type { LRQualityAssessmentData, LRValidityProfile };
