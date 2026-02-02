// =============================================================================
// UNIT TESTS FOR TREATMENT VALIDITY RULE ENGINE
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  computeTreatmentValidityProfile,
  createEmptyInstrumentData,
  createEmptyTreatmentModifiersData,
  createEmptyTreatmentDataEntry,
  createEmptyRoB2Domains,
  createEmptyROBINSIDomains,
  createEmptyOutcomeData,
  type InstrumentData,
  type TreatmentModifiersData,
  type TreatmentDataEntry,
} from './treatment-validity-rules';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function createInstrumentWithRoB2(
  overallRisk: 'low' | 'some_concerns' | 'high',
  domains?: Partial<{
    domain1Judgment: 'low' | 'some_concerns' | 'high';
    domain2Judgment: 'low' | 'some_concerns' | 'high';
    domain3Judgment: 'low' | 'some_concerns' | 'high';
    domain4Judgment: 'low' | 'some_concerns' | 'high';
    domain5Judgment: 'low' | 'some_concerns' | 'high';
  }>
): InstrumentData {
  const instrument = createEmptyInstrumentData();
  instrument.toolUsed = 'RoB2';
  instrument.overallRiskOfBias = overallRisk;
  instrument.rob2Domains = createEmptyRoB2Domains();
  
  if (domains?.domain1Judgment) {
    instrument.rob2Domains.domain1.judgment = domains.domain1Judgment;
  }
  if (domains?.domain2Judgment) {
    instrument.rob2Domains.domain2.judgment = domains.domain2Judgment;
  }
  if (domains?.domain3Judgment) {
    instrument.rob2Domains.domain3.judgment = domains.domain3Judgment;
  }
  if (domains?.domain4Judgment) {
    instrument.rob2Domains.domain4.judgment = domains.domain4Judgment;
  }
  if (domains?.domain5Judgment) {
    instrument.rob2Domains.domain5.judgment = domains.domain5Judgment;
  }
  
  return instrument;
}

function createInstrumentWithROBINSI(
  overallRisk: 'low' | 'some_concerns' | 'high' | 'critical',
  domains?: Partial<{
    domain1Judgment: 'low' | 'moderate' | 'serious' | 'critical';
    domain2Judgment: 'low' | 'moderate' | 'serious' | 'critical';
  }>
): InstrumentData {
  const instrument = createEmptyInstrumentData();
  instrument.toolUsed = 'ROBINS-I';
  instrument.overallRiskOfBias = overallRisk;
  instrument.rob2Domains = undefined;
  instrument.robinsiDomains = createEmptyROBINSIDomains();
  
  if (domains?.domain1Judgment) {
    instrument.robinsiDomains.domain1.judgment = domains.domain1Judgment;
  }
  if (domains?.domain2Judgment) {
    instrument.robinsiDomains.domain2.judgment = domains.domain2Judgment;
  }
  
  return instrument;
}

// =============================================================================
// TESTS: INTERNAL VALIDITY FROM INSTRUMENT
// =============================================================================

describe('Treatment Validity Rules - Internal Validity from Instrument', () => {
  it('should return high internal validity for RoB2 low risk', () => {
    const instrument = createInstrumentWithRoB2('low');
    const modifiers = createEmptyTreatmentModifiersData();
    
    const result = computeTreatmentValidityProfile(instrument, modifiers);
    
    expect(result.internalValidity).toBe('high');
  });

  it('should return moderate internal validity for RoB2 some concerns', () => {
    const instrument = createInstrumentWithRoB2('some_concerns');
    const modifiers = createEmptyTreatmentModifiersData();
    
    const result = computeTreatmentValidityProfile(instrument, modifiers);
    
    expect(result.internalValidity).toBe('moderate');
  });

  it('should return low internal validity for RoB2 high risk', () => {
    const instrument = createInstrumentWithRoB2('high');
    const modifiers = createEmptyTreatmentModifiersData();
    
    const result = computeTreatmentValidityProfile(instrument, modifiers);
    
    expect(result.internalValidity).toBe('low');
  });

  it('should return low internal validity for ROBINS-I serious risk', () => {
    const instrument = createInstrumentWithROBINSI('high'); // maps to serious
    const modifiers = createEmptyTreatmentModifiersData();
    
    const result = computeTreatmentValidityProfile(instrument, modifiers);
    
    expect(result.internalValidity).toBe('low');
  });

  it('should return low internal validity for ROBINS-I critical risk', () => {
    const instrument = createInstrumentWithROBINSI('critical');
    const modifiers = createEmptyTreatmentModifiersData();
    
    const result = computeTreatmentValidityProfile(instrument, modifiers);
    
    expect(result.internalValidity).toBe('low');
  });
});

// =============================================================================
// TESTS: CONFOUNDING WARNING (ROBINS-I)
// =============================================================================

describe('Treatment Validity Rules - Confounding Warning', () => {
  it('should add confounding warning when ROBINS-I domain 1 is serious', () => {
    const instrument = createInstrumentWithROBINSI('some_concerns', {
      domain1Judgment: 'serious',
    });
    const modifiers = createEmptyTreatmentModifiersData();
    
    const result = computeTreatmentValidityProfile(instrument, modifiers);
    
    expect(result.warnings.some(w => w.message.includes('Confounding'))).toBe(true);
    expect(result.derivedFlags.confoundingOrSelectionIssue).toBe(true);
  });

  it('should add confounding warning when ROBINS-I domain 2 is critical', () => {
    const instrument = createInstrumentWithROBINSI('some_concerns', {
      domain2Judgment: 'critical',
    });
    const modifiers = createEmptyTreatmentModifiersData();
    
    const result = computeTreatmentValidityProfile(instrument, modifiers);
    
    expect(result.warnings.some(w => w.message.includes('Confounding'))).toBe(true);
  });
});

// =============================================================================
// TESTS: CROSSOVER DILUTION WARNING
// =============================================================================

describe('Treatment Validity Rules - Crossover Dilution Warning', () => {
  it('should add crossover dilution warning when crossover contamination is likely', () => {
    const instrument = createInstrumentWithRoB2('low');
    const modifiers = createEmptyTreatmentModifiersData();
    modifiers.settingAndCare.crossoverContaminationLikely = 'Yes';
    
    const result = computeTreatmentValidityProfile(instrument, modifiers);
    
    expect(result.warnings.some(w => w.message.includes('Crossover'))).toBe(true);
    expect(result.effectDistortionRisks.crossoverDilution).toBe(true);
    expect(result.effectDistortionRisks.adherenceBias).toBe(true);
  });

  it('should add crossover dilution warning when adherence differs from practice', () => {
    const instrument = createInstrumentWithRoB2('low');
    const modifiers = createEmptyTreatmentModifiersData();
    modifiers.settingAndCare.adherenceDifferentFromPractice = 'Yes';
    
    const result = computeTreatmentValidityProfile(instrument, modifiers);
    
    expect(result.warnings.some(w => w.message.includes('Crossover'))).toBe(true);
    expect(result.effectDistortionRisks.crossoverDilution).toBe(true);
  });
});

// =============================================================================
// TESTS: BASELINE RISK EXTERNAL WARNING
// =============================================================================

describe('Treatment Validity Rules - Baseline Risk External Warning', () => {
  it('should add warning when baseline risk is from external source', () => {
    const instrument = createInstrumentWithRoB2('low');
    const modifiers = createEmptyTreatmentModifiersData();
    const dataEntry = createEmptyTreatmentDataEntry();
    // Update the first outcome's baseline risk
    dataEntry.outcomeData[0].baselineRisk.source = 'external';
    
    const result = computeTreatmentValidityProfile(instrument, modifiers, dataEntry);
    
    expect(result.warnings.some(w => w.message.includes('external baseline risk'))).toBe(true);
  });

  it('should NOT add warning when baseline risk is from study control', () => {
    const instrument = createInstrumentWithRoB2('low');
    const modifiers = createEmptyTreatmentModifiersData();
    const dataEntry = createEmptyTreatmentDataEntry();
    // Default is already 'study_control'
    dataEntry.outcomeData[0].baselineRisk.source = 'study_control';
    
    const result = computeTreatmentValidityProfile(instrument, modifiers, dataEntry);
    
    expect(result.warnings.some(w => w.message.includes('external baseline risk'))).toBe(false);
  });

  it('should downgrade transportability when external source does not match context', () => {
    const instrument = createInstrumentWithRoB2('low');
    const modifiers = createEmptyTreatmentModifiersData();
    modifiers.externalValidity.baselineRiskSourceMatchesUserContext = 'No';
    const dataEntry = createEmptyTreatmentDataEntry();
    dataEntry.outcomeData[0].baselineRisk.source = 'external';
    
    const result = computeTreatmentValidityProfile(instrument, modifiers, dataEntry);
    
    // Should be downgraded from high
    expect(result.transportability).not.toBe('high');
  });
});

// =============================================================================
// TESTS: TIME HORIZON MISMATCH WARNING
// =============================================================================

describe('Treatment Validity Rules - Time Horizon Mismatch Warning', () => {
  it('should add time horizon warning when follow-up is inadequate', () => {
    const instrument = createInstrumentWithRoB2('low');
    const modifiers = createEmptyTreatmentModifiersData();
    modifiers.timingAndFollowup.followupAdequateForOutcome = 'No';
    
    const result = computeTreatmentValidityProfile(instrument, modifiers);
    
    expect(result.warnings.some(w => w.message.includes('time horizon'))).toBe(true);
    expect(result.effectDistortionRisks.timeHorizonMismatch).toBe(true);
  });
});

// =============================================================================
// TESTS: SELECTIVE REPORTING WARNING
// =============================================================================

describe('Treatment Validity Rules - Selective Reporting Warning', () => {
  it('should add selective reporting warning when suspected', () => {
    const instrument = createInstrumentWithRoB2('low');
    const modifiers = createEmptyTreatmentModifiersData();
    modifiers.analysisReporting.selectiveReportingSuspected = 'Yes';
    
    const result = computeTreatmentValidityProfile(instrument, modifiers);
    
    expect(result.warnings.some(w => w.message.includes('Selective reporting'))).toBe(true);
    expect(result.effectDistortionRisks.selectiveReporting).toBe(true);
    expect(result.effectDistortionRisks.benefitInflation).toBe(true);
  });

  it('should add selective reporting warning when outcome switching is suspected', () => {
    const instrument = createInstrumentWithRoB2('low');
    const modifiers = createEmptyTreatmentModifiersData();
    modifiers.outcomeAscertainment.outcomeSwitchingSuspected = 'Yes';
    
    const result = computeTreatmentValidityProfile(instrument, modifiers);
    
    expect(result.warnings.some(w => w.message.includes('Selective reporting'))).toBe(true);
    expect(result.effectDistortionRisks.selectiveReporting).toBe(true);
  });
});

// =============================================================================
// TESTS: HR CONVERSION WARNING
// =============================================================================

describe('Treatment Validity Rules - HR Conversion Warning', () => {
  it('should add HR conversion warning when data is time-to-event', () => {
    const instrument = createInstrumentWithRoB2('low');
    const modifiers = createEmptyTreatmentModifiersData();
    const dataEntry = createEmptyTreatmentDataEntry();
    dataEntry.outcomeData[0].normalized.repType = 'B_time_to_event';
    
    const result = computeTreatmentValidityProfile(instrument, modifiers, dataEntry);
    
    expect(result.warnings.some(w => w.message.includes('proportional hazards'))).toBe(true);
  });
});

// =============================================================================
// TESTS: OR CONVERSION WARNING
// =============================================================================

describe('Treatment Validity Rules - OR Conversion Warning', () => {
  it('should add OR conversion warning when effect measure is OR', () => {
    const instrument = createInstrumentWithRoB2('low');
    const modifiers = createEmptyTreatmentModifiersData();
    const dataEntry = createEmptyTreatmentDataEntry();
    dataEntry.outcomeData[0].normalized.effect_measure_reported = 'OR';
    
    const result = computeTreatmentValidityProfile(instrument, modifiers, dataEntry);
    
    expect(result.warnings.some(w => w.message.includes('OR-to-absolute'))).toBe(true);
  });
});

// =============================================================================
// TESTS: TRANSPORTABILITY DOWNGRADE
// =============================================================================

describe('Treatment Validity Rules - Transportability Downgrade', () => {
  it('should downgrade transportability when co-interventions are likely', () => {
    const instrument = createInstrumentWithRoB2('low');
    const modifiers = createEmptyTreatmentModifiersData();
    modifiers.settingAndCare.coInterventionsLikely = 'Yes';
    
    const result = computeTreatmentValidityProfile(instrument, modifiers);
    
    expect(result.transportability).toBe('moderate');
    expect(result.warnings.some(w => w.message.includes('Co-interventions'))).toBe(true);
  });

  it('should downgrade transportability when outcome definition differs', () => {
    const instrument = createInstrumentWithRoB2('low');
    const modifiers = createEmptyTreatmentModifiersData();
    modifiers.outcomeAscertainment.outcomeDefinitionMatchesPractice = 'No';
    
    const result = computeTreatmentValidityProfile(instrument, modifiers);
    
    expect(result.transportability).toBe('moderate');
    expect(result.warnings.some(w => w.message.includes('Outcome definition'))).toBe(true);
  });
});

// =============================================================================
// TESTS: MISSING DATA WARNING
// =============================================================================

describe('Treatment Validity Rules - Missing Data Warning', () => {
  it('should add warning and downgrade internal validity for missing data', () => {
    const instrument = createInstrumentWithRoB2('low');
    const modifiers = createEmptyTreatmentModifiersData();
    modifiers.outcomeAscertainment.missingOutcomeDataProblem = 'Yes';
    
    const result = computeTreatmentValidityProfile(instrument, modifiers);
    
    expect(result.warnings.some(w => w.message.includes('Missing outcome data'))).toBe(true);
    expect(result.internalValidity).toBe('moderate');
  });
});

// =============================================================================
// TESTS: SUMMARY PARAGRAPH GENERATION
// =============================================================================

describe('Treatment Validity Rules - Summary Paragraph', () => {
  it('should generate positive summary when no issues', () => {
    const instrument = createInstrumentWithRoB2('low');
    const modifiers = createEmptyTreatmentModifiersData();
    
    const result = computeTreatmentValidityProfile(instrument, modifiers);
    
    expect(result.summaryParagraph).toContain('methodologically sound');
  });

  it('should generate cautionary summary when internal validity is low', () => {
    const instrument = createInstrumentWithRoB2('high');
    const modifiers = createEmptyTreatmentModifiersData();
    
    const result = computeTreatmentValidityProfile(instrument, modifiers);
    
    expect(result.summaryParagraph).toContain('LOW');
    expect(result.summaryParagraph).toContain('significant bias risk');
  });

  it('should mention ARR/NNT when selective reporting is present', () => {
    const instrument = createInstrumentWithRoB2('low');
    const modifiers = createEmptyTreatmentModifiersData();
    modifiers.analysisReporting.selectiveReportingSuspected = 'Yes';
    
    const result = computeTreatmentValidityProfile(instrument, modifiers);
    
    expect(result.summaryParagraph).toContain('ARR');
  });
});

// =============================================================================
// TESTS: COMBINED SCENARIOS
// =============================================================================

describe('Treatment Validity Rules - Combined Scenarios', () => {
  it('should handle multiple issues simultaneously', () => {
    const instrument = createInstrumentWithRoB2('some_concerns');
    const modifiers = createEmptyTreatmentModifiersData();
    modifiers.settingAndCare.crossoverContaminationLikely = 'Yes';
    modifiers.settingAndCare.coInterventionsLikely = 'Yes';
    modifiers.timingAndFollowup.followupAdequateForOutcome = 'No';
    
    const result = computeTreatmentValidityProfile(instrument, modifiers);
    
    expect(result.internalValidity).toBe('moderate');
    expect(result.transportability).toBe('moderate');
    expect(result.warnings.length).toBeGreaterThan(2);
    expect(result.effectDistortionRisks.crossoverDilution).toBe(true);
    expect(result.effectDistortionRisks.timeHorizonMismatch).toBe(true);
  });

  it('should maintain high validity when no issues', () => {
    const instrument = createInstrumentWithRoB2('low');
    const modifiers = createEmptyTreatmentModifiersData();
    const dataEntry = createEmptyTreatmentDataEntry();
    dataEntry.outcomeData[0].baselineRisk.source = 'study_control';
    
    const result = computeTreatmentValidityProfile(instrument, modifiers, dataEntry);
    
    expect(result.internalValidity).toBe('high');
    expect(result.transportability).toBe('high');
    expect(result.warnings.length).toBe(0);
  });
});
