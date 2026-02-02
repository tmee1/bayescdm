// =============================================================================
// TREATMENT VALIDITY COMPUTATION RULES (Separate file for testability)
// =============================================================================

export type YesNoUnclear = 'Yes' | 'No' | 'Unclear' | '';
export type ValidityLevel = 'high' | 'moderate' | 'low';

// =============================================================================
// DATA ENTRY TYPES
// =============================================================================

export type InputSourceType =
  | 'raw_2x2'
  | 'risk_rates'
  | 'effect_only'
  | 'hr'
  | 'km_digitized'
  | 'rates_person_time'
  | 'continuous_means'
  | 'adjusted_md'
  | 'noninferiority'
  | 'multiarm';

export type RepresentationType = 'A_binary' | 'B_time_to_event' | 'C_rates' | 'D_continuous' | 'E_categorical';
export type Directionality = 'higher_better' | 'lower_better';
export type BenefitOrHarm = 'benefit' | 'harm';
export type DesignType = 'RCT' | 'observational' | 'quasi_experimental';
export type OutcomeType = 'binary' | 'time_to_event' | 'continuous' | 'rate' | 'categorical';
export type OutcomePriority = 'primary' | 'secondary';

// Study-level metadata (not including PICO elements which are captured separately)
export interface TreatmentMetadata {
  designType: DesignType;
  settingText: string;
  timeHorizon: string;
  followUp: string;
}

// Individual outcome definition
export interface OutcomeDefinition {
  id: string;
  name: string;
  outcomeType: OutcomeType;
  directionality: Directionality;
  benefitOrHarm: BenefitOrHarm;
  priority: OutcomePriority;
  // For categorical outcomes
  categories?: string[];
}

export interface NormalizedData {
  repType: RepresentationType;
  // Rep A: Binary
  n_treat?: number;
  events_treat?: number;
  n_control?: number;
  events_control?: number;
  // Rep B: Time-to-event
  logHR?: number;
  SE_logHR?: number;
  baseline_control_risk_or_survival?: number;
  // Rep C: Rates (person-time)
  events_treat_rate?: number;
  pt_treat?: number;
  events_control_rate?: number;
  pt_control?: number;
  logRateRatio?: number;
  SE_logRateRatio?: number;
  // Rep D: Continuous
  mean_treat?: number;
  sd_treat?: number;
  n_treat_continuous?: number;
  mean_control?: number;
  sd_control?: number;
  n_control_continuous?: number;
  md?: number;
  SE_md?: number;
  // Rep E: Categorical (ordinal or nominal)
  categories?: string[];
  counts_treat?: number[];
  counts_control?: number[];
  ordinal_direction?: 'higher_better' | 'lower_better';
  // Common
  effect_measure_reported?: string;
  estimate?: number;
  ci_low?: number;
  ci_high?: number;
  se?: number;
  adjusted_covariates?: string;
  notes?: string;
}

// Data for a single outcome (links outcome definition to its data)
export interface OutcomeData {
  outcomeId: string; // Links to OutcomeDefinition.id
  inputSourceType: InputSourceType;
  normalized: NormalizedData;
  baselineRisk: BaselineRiskData;
}

export type BaselineRiskSource = 'study_control' | 'external' | 'other';
export type BaselineValueType = 'risk' | 'survival';
export type UncertaintyType = 'beta' | 'ci' | 'none';

export interface BaselineRiskData {
  requiredForAbsolute: boolean;
  source: BaselineRiskSource;
  valueType: BaselineValueType;
  valueAtHorizon: number | null;
  uncertaintyOptional: {
    type: UncertaintyType;
    paramsOrBounds?: {
      alpha?: number;
      beta?: number;
      low?: number;
      high?: number;
    };
  };
  notes: string;
}

export interface TreatmentDataEntry {
  metadata: TreatmentMetadata;
  // Outcome definitions (can have multiple primary and secondary)
  outcomes: OutcomeDefinition[];
  // Data for each outcome (keyed by outcome ID)
  outcomeData: OutcomeData[];
  // Currently selected outcome for display/editing
  activeOutcomeId: string | null;
}

// =============================================================================
// QUALITY ASSESSMENT TYPES - RoB 2 / ROBINS-I
// =============================================================================

export type RoB2Judgment = 'low' | 'some_concerns' | 'high' | '';
export type ROBINSIJudgment = 'low' | 'moderate' | 'serious' | 'critical' | 'no_information' | '';
export type ToolUsed = 'RoB2' | 'ROBINS-I';
export type OverallRiskOfBias = 'low' | 'some_concerns' | 'high' | 'critical' | 'unclear' | '';

export interface Override {
  fieldName: string;
  originalValue: string;
  overrideValue: string;
  rationale: string;
  timestamp: string;
}

// RoB 2 Domain Interfaces
export interface RoB2Domain1 {
  // Randomization process
  describeText: string;
  q1_1_randomSequence: YesNoUnclear;
  q1_2_allocationConcealed: YesNoUnclear;
  q1_3_baselineDifferences: YesNoUnclear;
  judgment: RoB2Judgment;
}

export interface RoB2Domain2 {
  // Deviations from intended interventions
  describeText: string;
  q2_1_participantsAware: YesNoUnclear;
  q2_2_carersAware: YesNoUnclear;
  q2_3_deviationsDueToContext: YesNoUnclear;
  q2_4_deviationsBalanced: YesNoUnclear;
  q2_5_appropriateAnalysis: YesNoUnclear;
  judgment: RoB2Judgment;
}

export interface RoB2Domain3 {
  // Missing outcome data
  describeText: string;
  q3_1_outcomeDataAvailable: YesNoUnclear;
  q3_2_evidenceNotMissing: YesNoUnclear;
  q3_3_missingnessCouldDepend: YesNoUnclear;
  judgment: RoB2Judgment;
}

export interface RoB2Domain4 {
  // Measurement of outcome
  describeText: string;
  q4_1_outcomeAppropriate: YesNoUnclear;
  q4_2_assessorsAware: YesNoUnclear;
  q4_3_assessmentInfluenced: YesNoUnclear;
  judgment: RoB2Judgment;
}

export interface RoB2Domain5 {
  // Selection of reported result
  describeText: string;
  q5_1_resultFromPrespecified: YesNoUnclear;
  q5_2_multipleOutcomeMeasurements: YesNoUnclear;
  q5_3_multipleAnalyses: YesNoUnclear;
  judgment: RoB2Judgment;
}

export interface RoB2Domains {
  domain1: RoB2Domain1;
  domain2: RoB2Domain2;
  domain3: RoB2Domain3;
  domain4: RoB2Domain4;
  domain5: RoB2Domain5;
}

// ROBINS-I Domain Interfaces
export interface ROBINSIDomain1 {
  // Confounding
  describeText: string;
  q1_1_confoundersControlled: YesNoUnclear;
  q1_2_measurementValid: YesNoUnclear;
  q1_3_adjustmentAppropriate: YesNoUnclear;
  judgment: ROBINSIJudgment;
}

export interface ROBINSIDomain2 {
  // Selection of participants
  describeText: string;
  q2_1_selectionBasedOnCharacteristics: YesNoUnclear;
  q2_2_startOfFollowupCoincides: YesNoUnclear;
  q2_3_adjustmentForSelection: YesNoUnclear;
  judgment: ROBINSIJudgment;
}

export interface ROBINSIDomain3 {
  // Classification of interventions
  describeText: string;
  q3_1_interventionWellDefined: YesNoUnclear;
  q3_2_informationUsedSame: YesNoUnclear;
  q3_3_classificationAffectedByOutcome: YesNoUnclear;
  judgment: ROBINSIJudgment;
}

export interface ROBINSIDomain4 {
  // Deviations from intended interventions
  describeText: string;
  q4_1_deviationsUnbalanced: YesNoUnclear;
  q4_2_importantCointerventions: YesNoUnclear;
  q4_3_appropriateAnalysis: YesNoUnclear;
  judgment: ROBINSIJudgment;
}

export interface ROBINSIDomain5 {
  // Missing data
  describeText: string;
  q5_1_dataReasonablyComplete: YesNoUnclear;
  q5_2_missingnessRelated: YesNoUnclear;
  q5_3_appropriateMethods: YesNoUnclear;
  judgment: ROBINSIJudgment;
}

export interface ROBINSIDomain6 {
  // Measurement of outcomes
  describeText: string;
  q6_1_outcomeWellDefined: YesNoUnclear;
  q6_2_assessorsAware: YesNoUnclear;
  q6_3_methodsComparable: YesNoUnclear;
  q6_4_errorsSystematic: YesNoUnclear;
  judgment: ROBINSIJudgment;
}

export interface ROBINSIDomain7 {
  // Selection of reported result
  describeText: string;
  q7_1_multipleOutcomeMeasurements: YesNoUnclear;
  q7_2_multipleAnalyses: YesNoUnclear;
  q7_3_resultLikelySelected: YesNoUnclear;
  judgment: ROBINSIJudgment;
}

export interface ROBINSIDomains {
  domain1: ROBINSIDomain1;
  domain2: ROBINSIDomain2;
  domain3: ROBINSIDomain3;
  domain4: ROBINSIDomain4;
  domain5: ROBINSIDomain5;
  domain6: ROBINSIDomain6;
  domain7: ROBINSIDomain7;
}

export interface InstrumentData {
  toolUsed: ToolUsed;
  rob2Domains?: RoB2Domains;
  robinsiDomains?: ROBINSIDomains;
  overallRiskOfBias: OverallRiskOfBias;
  freeTextJustifications: {
    overall: string;
    notes: string;
  };
}

// =============================================================================
// TREATMENT MODIFIERS TYPES
// =============================================================================

interface TreatmentModifierSection {
  notes: string;
  overrides: Override[];
}

export interface PopulationSpectrumModifiers extends TreatmentModifierSection {
  baselineRiskComparable: YesNoUnclear;
  severityComparable: YesNoUnclear;
  comorbidityComparable: YesNoUnclear;
  priorTreatmentComparable: YesNoUnclear;
  subgroupOnly: YesNoUnclear;
}

export interface SettingAndCareModifiers extends TreatmentModifierSection {
  settingComparable: YesNoUnclear;
  coInterventionsLikely: YesNoUnclear;
  adherenceDifferentFromPractice: YesNoUnclear;
  monitoringIntensityDifferent: YesNoUnclear;
  crossoverContaminationLikely: YesNoUnclear;
}

export interface TimingAndFollowupModifiers extends TreatmentModifierSection {
  followupAdequateForOutcome: YesNoUnclear;
  differentialFollowupLikely: YesNoUnclear;
  timeVaryingEffectsLikely: YesNoUnclear;
  competingRisksLikely: YesNoUnclear;
}

export interface InterventionFidelityModifiers extends TreatmentModifierSection {
  interventionStandardized: YesNoUnclear;
  doseIntensityComparable: YesNoUnclear;
  deliveryExpertiseComparable: YesNoUnclear;
  contaminationSpillover: YesNoUnclear;
  implementationQualityVariable: YesNoUnclear;
}

export interface OutcomeAscertainmentModifiers extends TreatmentModifierSection {
  outcomeDefinitionMatchesPractice: YesNoUnclear;
  outcomeAssessmentBlinded: YesNoUnclear;
  measurementInstrumentValid: YesNoUnclear;
  missingOutcomeDataProblem: YesNoUnclear;
  outcomeSwitchingSuspected: YesNoUnclear;
}

export interface AnalysisReportingModifiers extends TreatmentModifierSection {
  ITT_used: YesNoUnclear;
  perProtocol_used: YesNoUnclear;
  adjustedModelBasedEstimate: YesNoUnclear;
  selectiveReportingSuspected: YesNoUnclear;
  multiplicityManaged: YesNoUnclear;
  clusteringHandled: YesNoUnclear;
}

export interface ExternalValidityModifiers extends TreatmentModifierSection {
  baselineRiskSourceMatchesUserContext: YesNoUnclear;
  effectHeterogeneityLikely: YesNoUnclear;
  transportabilityLimited: YesNoUnclear;
}

export interface TreatmentModifiersData {
  populationSpectrum: PopulationSpectrumModifiers;
  settingAndCare: SettingAndCareModifiers;
  timingAndFollowup: TimingAndFollowupModifiers;
  interventionFidelity: InterventionFidelityModifiers;
  outcomeAscertainment: OutcomeAscertainmentModifiers;
  analysisReporting: AnalysisReportingModifiers;
  externalValidity: ExternalValidityModifiers;
}

// =============================================================================
// BAYESIAN VALIDITY PROFILE TYPES
// =============================================================================

export interface EffectDistortionRisks {
  benefitInflation: boolean;
  harmUnderestimate: boolean;
  timeHorizonMismatch: boolean;
  adherenceBias: boolean;
  crossoverDilution: boolean;
  selectiveReporting: boolean;
}

export interface WarningWithSource {
  message: string;
  sources: string[];
}

export interface BayesianValidityProfileData {
  internalValidity: ValidityLevel;
  transportability: ValidityLevel;
  warnings: WarningWithSource[];
  effectDistortionRisks: EffectDistortionRisks;
  derivedFlags: Record<string, boolean>;
  summaryParagraph: string;
  analystNotes: string;
}

// =============================================================================
// TOP-LEVEL TREATMENT STUDY OBJECT
// =============================================================================

export interface TreatmentQualityAssessmentData {
  instrument: InstrumentData;
  treatmentModifiers: TreatmentModifiersData;
  bayesianValidityProfile: BayesianValidityProfileData;
}

export interface TreatmentStudyData {
  dataEntry: TreatmentDataEntry;
  qualityAssessment: TreatmentQualityAssessmentData;
}

// =============================================================================
// BAYESIAN VALIDITY COMPUTATION
// =============================================================================

export function computeTreatmentValidityProfile(
  instrument: InstrumentData,
  modifiers: TreatmentModifiersData,
  dataEntry?: TreatmentDataEntry
): Omit<BayesianValidityProfileData, 'analystNotes'> {
  let internalValidity: ValidityLevel = 'high';
  let transportability: ValidityLevel = 'high';
  const warnings: WarningWithSource[] = [];
  const effectDistortionRisks: EffectDistortionRisks = {
    benefitInflation: false,
    harmUnderestimate: false,
    timeHorizonMismatch: false,
    adherenceBias: false,
    crossoverDilution: false,
    selectiveReporting: false,
  };
  const derivedFlags: Record<string, boolean> = {};

  // Helper to downgrade validity
  const downgradeInternal = () => {
    if (internalValidity === 'high') internalValidity = 'moderate';
    else if (internalValidity === 'moderate') internalValidity = 'low';
  };
  const downgradeTransport = () => {
    if (transportability === 'high') transportability = 'moderate';
    else if (transportability === 'moderate') transportability = 'low';
  };

  // RULE: Map instrument overall judgment to internal validity
  if (instrument.toolUsed === 'RoB2') {
    if (instrument.overallRiskOfBias === 'high') {
      internalValidity = 'low';
    } else if (instrument.overallRiskOfBias === 'some_concerns') {
      internalValidity = 'moderate';
    }
    // 'low' risk -> 'high' validity (default)
  } else if (instrument.toolUsed === 'ROBINS-I') {
    if (instrument.overallRiskOfBias === 'critical' || instrument.overallRiskOfBias === 'high') {
      internalValidity = 'low';
    } else if (instrument.overallRiskOfBias === 'some_concerns') {
      internalValidity = 'moderate';
    }
  }

  // RULE 1: Confounding / selection issues (ROBINS-I)
  if (instrument.toolUsed === 'ROBINS-I' && instrument.robinsiDomains) {
    const confoundingHigh = instrument.robinsiDomains.domain1.judgment === 'serious' || 
                            instrument.robinsiDomains.domain1.judgment === 'critical';
    const selectionHigh = instrument.robinsiDomains.domain2.judgment === 'serious' || 
                          instrument.robinsiDomains.domain2.judgment === 'critical';
    
    if (confoundingHigh || selectionHigh) {
      warnings.push({
        message: 'Confounding may bias effect estimate away from or toward null.',
        sources: confoundingHigh 
          ? ['ROBINS-I Domain 1: Confounding'] 
          : ['ROBINS-I Domain 2: Selection of participants'],
      });
      downgradeInternal();
      derivedFlags.confoundingOrSelectionIssue = true;
    }
  }

  // RULE 2: Deviations / adherence / contamination
  if (modifiers.settingAndCare.crossoverContaminationLikely === 'Yes' ||
      modifiers.settingAndCare.adherenceDifferentFromPractice === 'Yes') {
    effectDistortionRisks.crossoverDilution = true;
    effectDistortionRisks.adherenceBias = true;
    warnings.push({
      message: 'Crossover/nonadherence may dilute true effect (bias toward null).',
      sources: modifiers.settingAndCare.crossoverContaminationLikely === 'Yes'
        ? ['Treatment Modifiers: crossover/contamination likely']
        : ['Treatment Modifiers: adherence different from practice'],
    });
  }

  // RULE 3: Co-interventions / monitoring intensity
  if (modifiers.settingAndCare.coInterventionsLikely === 'Yes' ||
      modifiers.settingAndCare.monitoringIntensityDifferent === 'Yes') {
    downgradeTransport();
    warnings.push({
      message: 'Co-interventions/monitoring differ; effect may not transport.',
      sources: modifiers.settingAndCare.coInterventionsLikely === 'Yes'
        ? ['Treatment Modifiers: co-interventions likely']
        : ['Treatment Modifiers: monitoring intensity different'],
    });
  }

  // RULE 4: Time horizon mismatch
  if (modifiers.timingAndFollowup.followupAdequateForOutcome === 'No') {
    effectDistortionRisks.timeHorizonMismatch = true;
    warnings.push({
      message: 'Follow-up/time horizon mismatch; ARR/NNT at your horizon requires assumptions.',
      sources: ['Treatment Modifiers: follow-up not adequate for outcome'],
    });
  }

  // RULE 5: Outcome ascertainment differences
  if (modifiers.outcomeAscertainment.outcomeDefinitionMatchesPractice === 'No' ||
      modifiers.outcomeAscertainment.measurementInstrumentValid === 'No') {
    downgradeTransport();
    warnings.push({
      message: 'Outcome definition/measurement differs from practice context.',
      sources: modifiers.outcomeAscertainment.outcomeDefinitionMatchesPractice === 'No'
        ? ['Treatment Modifiers: outcome definition doesn\'t match practice']
        : ['Treatment Modifiers: measurement instrument not valid'],
    });
  }

  // RULE 6: Missing outcome data
  if (modifiers.outcomeAscertainment.missingOutcomeDataProblem === 'Yes') {
    downgradeInternal();
    warnings.push({
      message: 'Missing outcome data may bias absolute and relative effects.',
      sources: ['Treatment Modifiers: missing outcome data problem'],
    });
  }

  // RULE 7: Selective reporting / multiplicity
  if (modifiers.analysisReporting.selectiveReportingSuspected === 'Yes' ||
      modifiers.outcomeAscertainment.outcomeSwitchingSuspected === 'Yes') {
    effectDistortionRisks.selectiveReporting = true;
    effectDistortionRisks.benefitInflation = true;
    downgradeInternal();
    warnings.push({
      message: 'Selective reporting may inflate apparent benefit.',
      sources: modifiers.analysisReporting.selectiveReportingSuspected === 'Yes'
        ? ['Treatment Modifiers: selective reporting suspected']
        : ['Treatment Modifiers: outcome switching suspected'],
    });
  }

  // Get the active outcome data (or first primary outcome)
  const getActiveOutcomeData = (): OutcomeData | undefined => {
    if (!dataEntry) return undefined;
    if (dataEntry.activeOutcomeId) {
      return dataEntry.outcomeData.find(od => od.outcomeId === dataEntry.activeOutcomeId);
    }
    // Fall back to first outcome
    return dataEntry.outcomeData[0];
  };

  const activeOutcomeData = getActiveOutcomeData();

  // RULE 8: Baseline risk external
  if (activeOutcomeData && activeOutcomeData.baselineRisk.source !== 'study_control') {
    warnings.push({
      message: 'Absolute effects (ARR/NNT) depend on external baseline risk; uncertainty increases.',
      sources: ['Data Entry: baseline risk from external source'],
    });
    // Check if external source matches context
    if (modifiers.externalValidity.baselineRiskSourceMatchesUserContext === 'No') {
      downgradeTransport();
    }
  }

  // RULE 9: HR → absolute conversion assumption
  if (activeOutcomeData && activeOutcomeData.normalized.repType === 'B_time_to_event') {
    warnings.push({
      message: 'HR-to-absolute risk conversion assumes proportional hazards; check plausibility.',
      sources: ['Data Entry: time-to-event representation used'],
    });
  }

  // RULE 10: OR → risk conversion
  if (activeOutcomeData && activeOutcomeData.normalized.effect_measure_reported === 'OR') {
    warnings.push({
      message: 'OR-to-absolute risk conversion depends strongly on baseline risk; interpret ARR/NNT cautiously.',
      sources: ['Data Entry: odds ratio reported'],
    });
  }

  // Generate summary paragraph
  const topWarnings = warnings.slice(0, 3).map(w => w.message);
  let summaryParagraph = '';

  if (warnings.length === 0 && internalValidity === 'high' && transportability === 'high') {
    summaryParagraph = 'The treatment effect estimates from this study appear methodologically sound with good internal validity and transportability. Standard caution in clinical application is still advised.';
  } else {
    // Sentence 1: overall validity/transportability statement
    if (internalValidity === 'low') {
      summaryParagraph = 'Internal validity is LOW, indicating significant bias risk. ';
    } else if (internalValidity === 'moderate') {
      summaryParagraph = 'Internal validity is MODERATE; some bias concerns exist. ';
    } else {
      summaryParagraph = 'Internal validity is acceptable. ';
    }

    // Transportability
    if (transportability === 'low') {
      summaryParagraph += 'Transportability to other settings is LIMITED. ';
    } else if (transportability === 'moderate') {
      summaryParagraph += 'Transportability may be limited. ';
    }

    // Sentence 2-3: key reasons
    if (topWarnings.length > 0) {
      summaryParagraph += topWarnings.join(' ') + ' ';
    }

    // Sentence 4: consequence for ARR/NNT interpretation
    if (effectDistortionRisks.benefitInflation || effectDistortionRisks.selectiveReporting) {
      summaryParagraph += 'ARR and NNT estimates may overestimate true benefit.';
    } else if (effectDistortionRisks.crossoverDilution || effectDistortionRisks.adherenceBias) {
      summaryParagraph += 'ARR and NNT may underestimate true effect if adherence in practice differs.';
    } else if (effectDistortionRisks.timeHorizonMismatch) {
      summaryParagraph += 'Extrapolating to different time horizons requires caution.';
    } else {
      summaryParagraph += 'Consider these factors when interpreting ARR/NNT.';
    }
  }

  return {
    internalValidity,
    transportability,
    warnings,
    effectDistortionRisks,
    derivedFlags,
    summaryParagraph,
  };
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

export function createEmptyRoB2Domain1(): RoB2Domain1 {
  return {
    describeText: '',
    q1_1_randomSequence: '',
    q1_2_allocationConcealed: '',
    q1_3_baselineDifferences: '',
    judgment: '',
  };
}

export function createEmptyRoB2Domain2(): RoB2Domain2 {
  return {
    describeText: '',
    q2_1_participantsAware: '',
    q2_2_carersAware: '',
    q2_3_deviationsDueToContext: '',
    q2_4_deviationsBalanced: '',
    q2_5_appropriateAnalysis: '',
    judgment: '',
  };
}

export function createEmptyRoB2Domain3(): RoB2Domain3 {
  return {
    describeText: '',
    q3_1_outcomeDataAvailable: '',
    q3_2_evidenceNotMissing: '',
    q3_3_missingnessCouldDepend: '',
    judgment: '',
  };
}

export function createEmptyRoB2Domain4(): RoB2Domain4 {
  return {
    describeText: '',
    q4_1_outcomeAppropriate: '',
    q4_2_assessorsAware: '',
    q4_3_assessmentInfluenced: '',
    judgment: '',
  };
}

export function createEmptyRoB2Domain5(): RoB2Domain5 {
  return {
    describeText: '',
    q5_1_resultFromPrespecified: '',
    q5_2_multipleOutcomeMeasurements: '',
    q5_3_multipleAnalyses: '',
    judgment: '',
  };
}

export function createEmptyRoB2Domains(): RoB2Domains {
  return {
    domain1: createEmptyRoB2Domain1(),
    domain2: createEmptyRoB2Domain2(),
    domain3: createEmptyRoB2Domain3(),
    domain4: createEmptyRoB2Domain4(),
    domain5: createEmptyRoB2Domain5(),
  };
}

export function createEmptyROBINSIDomain1(): ROBINSIDomain1 {
  return {
    describeText: '',
    q1_1_confoundersControlled: '',
    q1_2_measurementValid: '',
    q1_3_adjustmentAppropriate: '',
    judgment: '',
  };
}

export function createEmptyROBINSIDomain2(): ROBINSIDomain2 {
  return {
    describeText: '',
    q2_1_selectionBasedOnCharacteristics: '',
    q2_2_startOfFollowupCoincides: '',
    q2_3_adjustmentForSelection: '',
    judgment: '',
  };
}

export function createEmptyROBINSIDomain3(): ROBINSIDomain3 {
  return {
    describeText: '',
    q3_1_interventionWellDefined: '',
    q3_2_informationUsedSame: '',
    q3_3_classificationAffectedByOutcome: '',
    judgment: '',
  };
}

export function createEmptyROBINSIDomain4(): ROBINSIDomain4 {
  return {
    describeText: '',
    q4_1_deviationsUnbalanced: '',
    q4_2_importantCointerventions: '',
    q4_3_appropriateAnalysis: '',
    judgment: '',
  };
}

export function createEmptyROBINSIDomain5(): ROBINSIDomain5 {
  return {
    describeText: '',
    q5_1_dataReasonablyComplete: '',
    q5_2_missingnessRelated: '',
    q5_3_appropriateMethods: '',
    judgment: '',
  };
}

export function createEmptyROBINSIDomain6(): ROBINSIDomain6 {
  return {
    describeText: '',
    q6_1_outcomeWellDefined: '',
    q6_2_assessorsAware: '',
    q6_3_methodsComparable: '',
    q6_4_errorsSystematic: '',
    judgment: '',
  };
}

export function createEmptyROBINSIDomain7(): ROBINSIDomain7 {
  return {
    describeText: '',
    q7_1_multipleOutcomeMeasurements: '',
    q7_2_multipleAnalyses: '',
    q7_3_resultLikelySelected: '',
    judgment: '',
  };
}

export function createEmptyROBINSIDomains(): ROBINSIDomains {
  return {
    domain1: createEmptyROBINSIDomain1(),
    domain2: createEmptyROBINSIDomain2(),
    domain3: createEmptyROBINSIDomain3(),
    domain4: createEmptyROBINSIDomain4(),
    domain5: createEmptyROBINSIDomain5(),
    domain6: createEmptyROBINSIDomain6(),
    domain7: createEmptyROBINSIDomain7(),
  };
}

export function createEmptyInstrumentData(): InstrumentData {
  return {
    toolUsed: 'RoB2',
    rob2Domains: createEmptyRoB2Domains(),
    robinsiDomains: undefined,
    overallRiskOfBias: '',
    freeTextJustifications: {
      overall: '',
      notes: '',
    },
  };
}

export function createEmptyTreatmentModifiersData(): TreatmentModifiersData {
  return {
    populationSpectrum: {
      baselineRiskComparable: '',
      severityComparable: '',
      comorbidityComparable: '',
      priorTreatmentComparable: '',
      subgroupOnly: '',
      notes: '',
      overrides: [],
    },
    settingAndCare: {
      settingComparable: '',
      coInterventionsLikely: '',
      adherenceDifferentFromPractice: '',
      monitoringIntensityDifferent: '',
      crossoverContaminationLikely: '',
      notes: '',
      overrides: [],
    },
    timingAndFollowup: {
      followupAdequateForOutcome: '',
      differentialFollowupLikely: '',
      timeVaryingEffectsLikely: '',
      competingRisksLikely: '',
      notes: '',
      overrides: [],
    },
    interventionFidelity: {
      interventionStandardized: '',
      doseIntensityComparable: '',
      deliveryExpertiseComparable: '',
      contaminationSpillover: '',
      implementationQualityVariable: '',
      notes: '',
      overrides: [],
    },
    outcomeAscertainment: {
      outcomeDefinitionMatchesPractice: '',
      outcomeAssessmentBlinded: '',
      measurementInstrumentValid: '',
      missingOutcomeDataProblem: '',
      outcomeSwitchingSuspected: '',
      notes: '',
      overrides: [],
    },
    analysisReporting: {
      ITT_used: '',
      perProtocol_used: '',
      adjustedModelBasedEstimate: '',
      selectiveReportingSuspected: '',
      multiplicityManaged: '',
      clusteringHandled: '',
      notes: '',
      overrides: [],
    },
    externalValidity: {
      baselineRiskSourceMatchesUserContext: '',
      effectHeterogeneityLikely: '',
      transportabilityLimited: '',
      notes: '',
      overrides: [],
    },
  };
}

export function createEmptyBayesianValidityProfile(): BayesianValidityProfileData {
  return {
    internalValidity: 'high',
    transportability: 'high',
    warnings: [],
    effectDistortionRisks: {
      benefitInflation: false,
      harmUnderestimate: false,
      timeHorizonMismatch: false,
      adherenceBias: false,
      crossoverDilution: false,
      selectiveReporting: false,
    },
    derivedFlags: {},
    summaryParagraph: '',
    analystNotes: '',
  };
}

export function createEmptyOutcomeDefinition(priority: OutcomePriority = 'primary'): OutcomeDefinition {
  return {
    id: `outcome-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    outcomeType: 'binary',
    directionality: 'lower_better',
    benefitOrHarm: 'benefit',
    priority,
  };
}

export function createEmptyBaselineRisk(): BaselineRiskData {
  return {
    requiredForAbsolute: true,
    source: 'study_control',
    valueType: 'risk',
    valueAtHorizon: null,
    uncertaintyOptional: {
      type: 'none',
    },
    notes: '',
  };
}

export function createEmptyOutcomeData(outcomeId: string): OutcomeData {
  return {
    outcomeId,
    inputSourceType: 'raw_2x2',
    normalized: {
      repType: 'A_binary',
    },
    baselineRisk: createEmptyBaselineRisk(),
  };
}

export function createEmptyTreatmentDataEntry(): TreatmentDataEntry {
  const primaryOutcome = createEmptyOutcomeDefinition('primary');
  return {
    metadata: {
      designType: 'RCT',
      settingText: '',
      timeHorizon: '',
      followUp: '',
    },
    outcomes: [primaryOutcome],
    outcomeData: [createEmptyOutcomeData(primaryOutcome.id)],
    activeOutcomeId: primaryOutcome.id,
  };
}

export function createEmptyTreatmentQualityAssessmentData(): TreatmentQualityAssessmentData {
  return {
    instrument: createEmptyInstrumentData(),
    treatmentModifiers: createEmptyTreatmentModifiersData(),
    bayesianValidityProfile: createEmptyBayesianValidityProfile(),
  };
}

export function createEmptyTreatmentStudyData(): TreatmentStudyData {
  return {
    dataEntry: createEmptyTreatmentDataEntry(),
    qualityAssessment: createEmptyTreatmentQualityAssessmentData(),
  };
}
