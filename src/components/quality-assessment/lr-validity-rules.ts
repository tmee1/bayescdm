// =============================================================================
// LR VALIDITY COMPUTATION RULES (Separate file for testability)
// =============================================================================

export type YesNoUnclear = 'Yes' | 'No' | 'Unclear' | '';
export type RiskJudgment = 'LOW' | 'HIGH' | 'UNCLEAR' | '';
export type ConcernJudgment = 'LOW' | 'HIGH' | 'UNCLEAR' | '';
export type ValidityLevel = 'high' | 'moderate' | 'low';

export interface Override {
  fieldName: string;
  originalValue: string;
  overrideValue: string;
  rationale: string;
  timestamp: string;
}

// QUADAS-2 Types
export interface QUADAS2Phase1 {
  patientsText: string;
  indexTestsText: string;
  referenceStandardText: string;
}

export interface QUADAS2Phase2 {
  flowDiagramText: string;
  flowDiagramAttachmentIds: string[];
}

export interface QUADAS2Domain1 {
  riskDescribeText: string;
  q1_consecutiveRandom: YesNoUnclear;
  q2_avoidCaseControl: YesNoUnclear;
  q3_avoidInappropriateExclusions: YesNoUnclear;
  riskJudgment: RiskJudgment;
  applicabilityDescribeText: string;
  applicabilityJudgment: ConcernJudgment;
}

export interface QUADAS2Domain2Test {
  indexTestName: string;
  riskDescribeText: string;
  q1_blindedToReference: YesNoUnclear;
  q2_thresholdPrespecified: YesNoUnclear;
  riskJudgment: RiskJudgment;
  applicabilityJudgment: ConcernJudgment;
}

export interface QUADAS2Domain2 {
  tests: QUADAS2Domain2Test[];
}

export interface QUADAS2Domain3 {
  riskDescribeText: string;
  q1_referenceCorrectClassify: YesNoUnclear;
  q2_referenceBlindedToIndex: YesNoUnclear;
  riskJudgment: RiskJudgment;
  applicabilityJudgment: ConcernJudgment;
}

export interface QUADAS2Domain4 {
  missingPatientsDescribeText: string;
  intervalInterventionsDescribeText: string;
  q1_appropriateInterval: YesNoUnclear;
  q2_allReceiveReference: YesNoUnclear;
  q3_sameReference: YesNoUnclear;
  q4_allIncludedAnalysis: YesNoUnclear;
  riskJudgment: RiskJudgment;
}

export interface QUADAS2Data {
  phase1: QUADAS2Phase1;
  phase2: QUADAS2Phase2;
  domain1: QUADAS2Domain1;
  domain2: QUADAS2Domain2;
  domain3: QUADAS2Domain3;
  domain4: QUADAS2Domain4;
}

// LR Modifiers Types
interface LRModifierSection {
  notes: string;
  overrides: Override[];
}

export interface PatientSpectrumModifiers extends LRModifierSection {
  severityRepresentative: YesNoUnclear;
  stageRepresentative: YesNoUnclear;
  phenotypeRestricted: YesNoUnclear;
  symptomProfileTypicality: YesNoUnclear;
  mimickersExcluded: YesNoUnclear;
  maskersPresent: YesNoUnclear;
}

export interface DemographicsModifiers extends LRModifierSection {
  ageRepresentative: YesNoUnclear;
  sexRepresentative: YesNoUnclear;
  comorbidityRepresentative: YesNoUnclear;
  renalHepaticAffectsSignal: YesNoUnclear;
  immunosuppressionAffectsSignal: YesNoUnclear;
  medsAffectSignalList: string;
}

export interface SettingUseModifiers extends LRModifierSection {
  setting: 'screening' | 'ED' | 'ICU' | 'outpatient' | 'specialty' | 'primary_care' | '';
  referralEnrichment: YesNoUnclear;
  intendedUse: 'rule_out' | 'rule_in' | 'triage' | 'diagnosis' | '';
  workflowVerificationConstraints: YesNoUnclear;
}

export interface TimingBiologyModifiers extends LRModifierSection {
  onsetTimingControlled: YesNoUnclear;
  treatmentBeforeTest: YesNoUnclear;
  serialTestingStrategy: YesNoUnclear;
  physiologicStateStandardized: YesNoUnclear;
  intercurrentEventsLikely: YesNoUnclear;
}

export interface TestTechProtocolModifiers extends LRModifierSection {
  platformSpecified: YesNoUnclear;
  platformMatchesUserContext: YesNoUnclear;
  protocolStandardized: YesNoUnclear;
  operatorDependenceHigh: YesNoUnclear;
  interferentsAddressed: YesNoUnclear;
}

export interface PreAnalyticsModifiers extends LRModifierSection {
  specimenStandardized: YesNoUnclear;
  collectionHandlingStandardized: YesNoUnclear;
  transportStorageReported: YesNoUnclear;
  knownInterferentsAddressed: YesNoUnclear;
}

export interface InterpretationHumanModifiers extends LRModifierSection {
  readerExperienceReported: YesNoUnclear;
  interReaderVariabilityReported: YesNoUnclear;
  structuredCriteriaUsed: YesNoUnclear;
  aiAssistanceUsed: YesNoUnclear;
  accessToClinicalInfoDuringRead: YesNoUnclear;
}

export interface ThresholdingResultsModifiers extends LRModifierSection {
  multipleThresholdsReported: YesNoUnclear;
  indeterminateHandledHow: 'included' | 'excluded' | 'separate' | 'not_reported' | '';
  intervalLRsDerivable: YesNoUnclear;
  selectiveCutpointReportingSuspected: YesNoUnclear;
}

export interface ReferenceStandardEffectsModifiers extends LRModifierSection {
  referenceUniform: YesNoUnclear;
  referenceIndependent: YesNoUnclear;
  followupAsReference: YesNoUnclear;
  diseaseDefinitionStable: YesNoUnclear;
}

export interface AnalysisReportingModifiers extends LRModifierSection {
  clusteringHandled: YesNoUnclear;
  missingnessHandled: YesNoUnclear;
  subgroupFishingSuspected: YesNoUnclear;
  dichotomizedContinuous: YesNoUnclear;
  optimismOverfitRisk: YesNoUnclear;
}

export interface PublicationSignalsModifiers extends LRModifierSection {
  preregistered: YesNoUnclear;
  outcomesMatchMethods: YesNoUnclear;
  negativeResultsReported: YesNoUnclear;
}

export interface LRModifiersData {
  patientSpectrum: PatientSpectrumModifiers;
  demographics: DemographicsModifiers;
  settingUse: SettingUseModifiers;
  timingBiology: TimingBiologyModifiers;
  testTechProtocol: TestTechProtocolModifiers;
  preAnalytics: PreAnalyticsModifiers;
  interpretationHuman: InterpretationHumanModifiers;
  thresholdingResults: ThresholdingResultsModifiers;
  referenceStandardEffects: ReferenceStandardEffectsModifiers;
  analysisReporting: AnalysisReportingModifiers;
  publicationSignals: PublicationSignalsModifiers;
}

// LR Validity Profile Types
export interface LRInflationRisks {
  lrPlusInflated: boolean;
  lrMinusInflated: boolean;
  extremenessInflation: boolean;
  timeDependentInstability: boolean;
}

export interface WarningWithSource {
  message: string;
  sources: string[];
}

export interface LRValidityProfileData {
  internalValidity: ValidityLevel;
  transportability: ValidityLevel;
  warnings: WarningWithSource[];
  lrInflationRisks: LRInflationRisks;
  summaryParagraph: string;
  analystNotes: string;
}

// Top-level study quality object
export interface StudyQualityData {
  quadas2: QUADAS2Data;
  lrModifiers: LRModifiersData;
  lrValidityProfile: LRValidityProfileData;
}

// =============================================================================
// LR VALIDITY COMPUTATION
// =============================================================================

export function computeLRValidityProfile(
  quadas2: QUADAS2Data,
  lrModifiers: LRModifiersData
): Omit<LRValidityProfileData, 'analystNotes'> {
  let internalValidity: ValidityLevel = 'high';
  let transportability: ValidityLevel = 'high';
  const warnings: WarningWithSource[] = [];
  const lrInflationRisks: LRInflationRisks = {
    lrPlusInflated: false,
    lrMinusInflated: false,
    extremenessInflation: false,
    timeDependentInstability: false,
  };

  // Helper to downgrade validity
  const downgradeInternal = () => {
    if (internalValidity === 'high') internalValidity = 'moderate';
    else if (internalValidity === 'moderate') internalValidity = 'low';
  };
  const downgradeTransport = () => {
    if (transportability === 'high') transportability = 'moderate';
    else if (transportability === 'moderate') transportability = 'low';
  };

  // Rule 2: Count HIGH risk judgments
  const highRiskDomains = [
    quadas2.domain1.riskJudgment === 'HIGH',
    quadas2.domain2.tests.some(t => t.riskJudgment === 'HIGH'),
    quadas2.domain3.riskJudgment === 'HIGH',
    quadas2.domain4.riskJudgment === 'HIGH',
  ].filter(Boolean).length;

  if (highRiskDomains >= 2) {
    internalValidity = 'low';
  } else if (highRiskDomains === 1) {
    downgradeInternal();
  }

  // Rule 3: Applicability concerns downgrade transportability
  if (quadas2.domain1.applicabilityJudgment === 'HIGH') {
    downgradeTransport();
  }
  if (quadas2.domain2.tests.some(t => t.applicabilityJudgment === 'HIGH')) {
    downgradeTransport();
  }
  if (quadas2.domain3.applicabilityJudgment === 'HIGH') {
    downgradeTransport();
  }

  // Rule 4: Threshold post-hoc or selective cutpoint
  const thresholdNotPrespecified = quadas2.domain2.tests.some(t => t.q2_thresholdPrespecified === 'No');
  if (thresholdNotPrespecified || lrModifiers.thresholdingResults.selectiveCutpointReportingSuspected === 'Yes') {
    lrInflationRisks.extremenessInflation = true;
    warnings.push({
      message: 'Post-hoc or selective thresholding may inflate LR magnitude.',
      sources: thresholdNotPrespecified 
        ? ['QUADAS-2 Domain 2: threshold not pre-specified'] 
        : ['LR Modifiers: selective cutpoint reporting suspected'],
    });
  }

  // Rule 5: Partial verification
  if (quadas2.domain4.q2_allReceiveReference === 'No') {
    lrInflationRisks.lrPlusInflated = true;
    warnings.push({
      message: 'Partial verification may inflate LR+ and distort LR−.',
      sources: ['QUADAS-2 Domain 4: not all patients received reference standard'],
    });
  }

  // Rule 6: Differential verification
  if (quadas2.domain4.q3_sameReference === 'No') {
    lrInflationRisks.lrPlusInflated = true;
    lrInflationRisks.lrMinusInflated = true;
    warnings.push({
      message: 'Differential verification may distort both LR+ and LR−.',
      sources: ['QUADAS-2 Domain 4: patients received different reference standards'],
    });
  }

  // Rule 7: Imperfect reference standard
  if (quadas2.domain3.q1_referenceCorrectClassify === 'No' || 
      quadas2.domain3.q1_referenceCorrectClassify === 'Unclear') {
    warnings.push({
      message: 'Imperfect reference standard may bias LRs toward or away from 1.',
      sources: ['QUADAS-2 Domain 3: reference standard may not correctly classify'],
    });
  }

  // Rule 8: Spectrum issues
  if (lrModifiers.patientSpectrum.severityRepresentative === 'No' ||
      lrModifiers.patientSpectrum.phenotypeRestricted === 'Yes') {
    downgradeTransport();
    warnings.push({
      message: 'Restricted spectrum may make LRs non-transportable.',
      sources: lrModifiers.patientSpectrum.severityRepresentative === 'No'
        ? ['LR Modifiers: disease severity not representative']
        : ['LR Modifiers: phenotype/subtype restricted'],
    });
  }

  // Rule 9: Timing/treatment instability
  if (lrModifiers.timingBiology.treatmentBeforeTest === 'Yes' ||
      lrModifiers.timingBiology.onsetTimingControlled === 'No') {
    lrInflationRisks.timeDependentInstability = true;
    warnings.push({
      message: 'Timing/treatment may change test performance across contexts.',
      sources: lrModifiers.timingBiology.treatmentBeforeTest === 'Yes'
        ? ['LR Modifiers: treatment started before test']
        : ['LR Modifiers: symptom onset timing not controlled'],
    });
  }

  // Rule 10: Reader variability
  if (lrModifiers.interpretationHuman.interReaderVariabilityReported === 'No' &&
      lrModifiers.testTechProtocol.operatorDependenceHigh === 'Yes') {
    warnings.push({
      message: 'Reader/operator variability may widen LR uncertainty.',
      sources: [
        'LR Modifiers: operator dependence high',
        'LR Modifiers: inter-reader variability not reported',
      ],
    });
  }

  // Rule 11: Indeterminate exclusion
  if (lrModifiers.thresholdingResults.indeterminateHandledHow === 'excluded') {
    warnings.push({
      message: 'Excluding indeterminates can inflate apparent accuracy and LRs.',
      sources: ['LR Modifiers: indeterminate results were excluded'],
    });
  }

  // Generate summary paragraph
  const topWarnings = warnings.slice(0, 3).map(w => w.message);
  let summaryParagraph = '';
  
  if (warnings.length === 0 && internalValidity === 'high' && transportability === 'high') {
    summaryParagraph = 'The likelihood ratios from this study appear methodologically sound with good internal validity and transportability. Standard caution in clinical application is still advised.';
  } else {
    summaryParagraph = 'Caution is warranted when using these likelihood ratios. ';
    if (topWarnings.length > 0) {
      summaryParagraph += topWarnings.join(' ') + ' ';
    }
    // Check validity levels and add appropriate message
    const ivLevel = internalValidity as string;
    const tLevel = transportability as string;
    
    if (ivLevel === 'low') {
      summaryParagraph += 'Overall internal validity is LOW, suggesting significant bias risk.';
    } else if (tLevel === 'low') {
      summaryParagraph += 'Transportability to other settings may be limited.';
    } else if (ivLevel === 'moderate') {
      summaryParagraph += 'Internal validity is moderate; consider potential bias sources.';
    } else if (tLevel === 'moderate') {
      summaryParagraph += 'Consider transportability when applying LRs to your clinical context.';
    } else {
      summaryParagraph += 'Consider these factors when applying LRs to clinical decisions.';
    }
  }

  return {
    internalValidity,
    transportability,
    warnings,
    lrInflationRisks,
    summaryParagraph,
  };
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

export function createEmptyDomain2Test(): QUADAS2Domain2Test {
  return {
    indexTestName: '',
    riskDescribeText: '',
    q1_blindedToReference: '',
    q2_thresholdPrespecified: '',
    riskJudgment: '',
    applicabilityJudgment: '',
  };
}

export function createEmptyStudyQualityData(): StudyQualityData {
  return {
    quadas2: {
      phase1: {
        patientsText: '',
        indexTestsText: '',
        referenceStandardText: '',
      },
      phase2: {
        flowDiagramText: '',
        flowDiagramAttachmentIds: [],
      },
      domain1: {
        riskDescribeText: '',
        q1_consecutiveRandom: '',
        q2_avoidCaseControl: '',
        q3_avoidInappropriateExclusions: '',
        riskJudgment: '',
        applicabilityDescribeText: '',
        applicabilityJudgment: '',
      },
      domain2: {
        tests: [createEmptyDomain2Test()],
      },
      domain3: {
        riskDescribeText: '',
        q1_referenceCorrectClassify: '',
        q2_referenceBlindedToIndex: '',
        riskJudgment: '',
        applicabilityJudgment: '',
      },
      domain4: {
        missingPatientsDescribeText: '',
        intervalInterventionsDescribeText: '',
        q1_appropriateInterval: '',
        q2_allReceiveReference: '',
        q3_sameReference: '',
        q4_allIncludedAnalysis: '',
        riskJudgment: '',
      },
    },
    lrModifiers: {
      patientSpectrum: { severityRepresentative: '', stageRepresentative: '', phenotypeRestricted: '', symptomProfileTypicality: '', mimickersExcluded: '', maskersPresent: '', notes: '', overrides: [] },
      demographics: { ageRepresentative: '', sexRepresentative: '', comorbidityRepresentative: '', renalHepaticAffectsSignal: '', immunosuppressionAffectsSignal: '', medsAffectSignalList: '', notes: '', overrides: [] },
      settingUse: { setting: '', referralEnrichment: '', intendedUse: '', workflowVerificationConstraints: '', notes: '', overrides: [] },
      timingBiology: { onsetTimingControlled: '', treatmentBeforeTest: '', serialTestingStrategy: '', physiologicStateStandardized: '', intercurrentEventsLikely: '', notes: '', overrides: [] },
      testTechProtocol: { platformSpecified: '', platformMatchesUserContext: '', protocolStandardized: '', operatorDependenceHigh: '', interferentsAddressed: '', notes: '', overrides: [] },
      preAnalytics: { specimenStandardized: '', collectionHandlingStandardized: '', transportStorageReported: '', knownInterferentsAddressed: '', notes: '', overrides: [] },
      interpretationHuman: { readerExperienceReported: '', interReaderVariabilityReported: '', structuredCriteriaUsed: '', aiAssistanceUsed: '', accessToClinicalInfoDuringRead: '', notes: '', overrides: [] },
      thresholdingResults: { multipleThresholdsReported: '', indeterminateHandledHow: '', intervalLRsDerivable: '', selectiveCutpointReportingSuspected: '', notes: '', overrides: [] },
      referenceStandardEffects: { referenceUniform: '', referenceIndependent: '', followupAsReference: '', diseaseDefinitionStable: '', notes: '', overrides: [] },
      analysisReporting: { clusteringHandled: '', missingnessHandled: '', subgroupFishingSuspected: '', dichotomizedContinuous: '', optimismOverfitRisk: '', notes: '', overrides: [] },
      publicationSignals: { preregistered: '', outcomesMatchMethods: '', negativeResultsReported: '', notes: '', overrides: [] },
    },
    lrValidityProfile: {
      internalValidity: 'high',
      transportability: 'high',
      warnings: [],
      lrInflationRisks: { lrPlusInflated: false, lrMinusInflated: false, extremenessInflation: false, timeDependentInstability: false },
      summaryParagraph: '',
      analystNotes: '',
    },
  };
}
