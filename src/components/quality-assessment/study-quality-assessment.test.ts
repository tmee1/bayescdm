import { describe, it, expect } from 'vitest';
import {
  computeLRValidityProfile,
  createEmptyStudyQualityData,
  type QUADAS2Data,
  type LRModifiersData,
} from './lr-validity-rules';

// Helper to get default QUADAS-2 data
function getEmptyQUADAS2(): QUADAS2Data {
  return createEmptyStudyQualityData().quadas2;
}

// Helper to get default LR Modifiers data
function getEmptyLRModifiers(): LRModifiersData {
  return createEmptyStudyQualityData().lrModifiers;
}

describe('computeLRValidityProfile', () => {
  describe('internal validity downgrade rules', () => {
    it('should start with high internal validity for empty data', () => {
      const quadas2 = getEmptyQUADAS2();
      const lrModifiers = getEmptyLRModifiers();
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.internalValidity).toBe('high');
    });

    it('should downgrade internal validity to moderate with one HIGH risk domain', () => {
      const quadas2 = getEmptyQUADAS2();
      quadas2.domain1.riskJudgment = 'HIGH';
      const lrModifiers = getEmptyLRModifiers();
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.internalValidity).toBe('moderate');
    });

    it('should downgrade internal validity to low with two or more HIGH risk domains', () => {
      const quadas2 = getEmptyQUADAS2();
      quadas2.domain1.riskJudgment = 'HIGH';
      quadas2.domain3.riskJudgment = 'HIGH';
      const lrModifiers = getEmptyLRModifiers();
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.internalValidity).toBe('low');
    });

    it('should count HIGH risk in domain2 tests', () => {
      const quadas2 = getEmptyQUADAS2();
      quadas2.domain2.tests[0].riskJudgment = 'HIGH';
      quadas2.domain4.riskJudgment = 'HIGH';
      const lrModifiers = getEmptyLRModifiers();
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.internalValidity).toBe('low');
    });
  });

  describe('transportability downgrade rules', () => {
    it('should start with high transportability for empty data', () => {
      const quadas2 = getEmptyQUADAS2();
      const lrModifiers = getEmptyLRModifiers();
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.transportability).toBe('high');
    });

    it('should downgrade transportability with HIGH applicability concern in domain1', () => {
      const quadas2 = getEmptyQUADAS2();
      quadas2.domain1.applicabilityJudgment = 'HIGH';
      const lrModifiers = getEmptyLRModifiers();
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.transportability).toBe('moderate');
    });

    it('should downgrade transportability with HIGH applicability concern in domain2', () => {
      const quadas2 = getEmptyQUADAS2();
      quadas2.domain2.tests[0].applicabilityJudgment = 'HIGH';
      const lrModifiers = getEmptyLRModifiers();
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.transportability).toBe('moderate');
    });

    it('should downgrade transportability with HIGH applicability concern in domain3', () => {
      const quadas2 = getEmptyQUADAS2();
      quadas2.domain3.applicabilityJudgment = 'HIGH';
      const lrModifiers = getEmptyLRModifiers();
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.transportability).toBe('moderate');
    });

    it('should downgrade transportability to low with multiple HIGH concerns', () => {
      const quadas2 = getEmptyQUADAS2();
      quadas2.domain1.applicabilityJudgment = 'HIGH';
      quadas2.domain2.tests[0].applicabilityJudgment = 'HIGH';
      quadas2.domain3.applicabilityJudgment = 'HIGH';
      const lrModifiers = getEmptyLRModifiers();
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.transportability).toBe('low');
    });
  });

  describe('post-hoc threshold warning (Rule 4)', () => {
    it('should set extremenessInflation when threshold not pre-specified', () => {
      const quadas2 = getEmptyQUADAS2();
      quadas2.domain2.tests[0].q2_thresholdPrespecified = 'No';
      const lrModifiers = getEmptyLRModifiers();
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.lrInflationRisks.extremenessInflation).toBe(true);
      expect(result.warnings.some(w => 
        w.message.includes('Post-hoc or selective thresholding')
      )).toBe(true);
    });

    it('should set extremenessInflation when selective cutpoint reporting suspected', () => {
      const quadas2 = getEmptyQUADAS2();
      const lrModifiers = getEmptyLRModifiers();
      lrModifiers.thresholdingResults.selectiveCutpointReportingSuspected = 'Yes';
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.lrInflationRisks.extremenessInflation).toBe(true);
      expect(result.warnings.some(w => 
        w.message.includes('Post-hoc or selective thresholding')
      )).toBe(true);
    });
  });

  describe('partial verification warning (Rule 5)', () => {
    it('should set lrPlusInflated when not all patients receive reference standard', () => {
      const quadas2 = getEmptyQUADAS2();
      quadas2.domain4.q2_allReceiveReference = 'No';
      const lrModifiers = getEmptyLRModifiers();
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.lrInflationRisks.lrPlusInflated).toBe(true);
      expect(result.warnings.some(w => 
        w.message.includes('Partial verification')
      )).toBe(true);
    });
  });

  describe('differential verification warning (Rule 6)', () => {
    it('should set both lrPlusInflated and lrMinusInflated when patients receive different reference standards', () => {
      const quadas2 = getEmptyQUADAS2();
      quadas2.domain4.q3_sameReference = 'No';
      const lrModifiers = getEmptyLRModifiers();
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.lrInflationRisks.lrPlusInflated).toBe(true);
      expect(result.lrInflationRisks.lrMinusInflated).toBe(true);
      expect(result.warnings.some(w => 
        w.message.includes('Differential verification')
      )).toBe(true);
    });
  });

  describe('imperfect reference standard warning (Rule 7)', () => {
    it('should warn when reference standard may not correctly classify (No)', () => {
      const quadas2 = getEmptyQUADAS2();
      quadas2.domain3.q1_referenceCorrectClassify = 'No';
      const lrModifiers = getEmptyLRModifiers();
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.warnings.some(w => 
        w.message.includes('Imperfect reference standard')
      )).toBe(true);
    });

    it('should warn when reference standard classification is unclear', () => {
      const quadas2 = getEmptyQUADAS2();
      quadas2.domain3.q1_referenceCorrectClassify = 'Unclear';
      const lrModifiers = getEmptyLRModifiers();
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.warnings.some(w => 
        w.message.includes('Imperfect reference standard')
      )).toBe(true);
    });
  });

  describe('spectrum restriction warning (Rule 8)', () => {
    it('should downgrade transportability and warn when severity not representative', () => {
      const quadas2 = getEmptyQUADAS2();
      const lrModifiers = getEmptyLRModifiers();
      lrModifiers.patientSpectrum.severityRepresentative = 'No';
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.transportability).toBe('moderate');
      expect(result.warnings.some(w => 
        w.message.includes('Restricted spectrum')
      )).toBe(true);
    });

    it('should downgrade transportability and warn when phenotype restricted', () => {
      const quadas2 = getEmptyQUADAS2();
      const lrModifiers = getEmptyLRModifiers();
      lrModifiers.patientSpectrum.phenotypeRestricted = 'Yes';
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.transportability).toBe('moderate');
      expect(result.warnings.some(w => 
        w.message.includes('Restricted spectrum')
      )).toBe(true);
    });
  });

  describe('timing/treatment instability warning (Rule 9)', () => {
    it('should set timeDependentInstability when treatment started before test', () => {
      const quadas2 = getEmptyQUADAS2();
      const lrModifiers = getEmptyLRModifiers();
      lrModifiers.timingBiology.treatmentBeforeTest = 'Yes';
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.lrInflationRisks.timeDependentInstability).toBe(true);
      expect(result.warnings.some(w => 
        w.message.includes('Timing/treatment')
      )).toBe(true);
    });

    it('should set timeDependentInstability when onset timing not controlled', () => {
      const quadas2 = getEmptyQUADAS2();
      const lrModifiers = getEmptyLRModifiers();
      lrModifiers.timingBiology.onsetTimingControlled = 'No';
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.lrInflationRisks.timeDependentInstability).toBe(true);
      expect(result.warnings.some(w => 
        w.message.includes('Timing/treatment')
      )).toBe(true);
    });
  });

  describe('reader variability warning (Rule 10)', () => {
    it('should warn when operator dependence high and inter-reader variability not reported', () => {
      const quadas2 = getEmptyQUADAS2();
      const lrModifiers = getEmptyLRModifiers();
      lrModifiers.testTechProtocol.operatorDependenceHigh = 'Yes';
      lrModifiers.interpretationHuman.interReaderVariabilityReported = 'No';
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.warnings.some(w => 
        w.message.includes('Reader/operator variability')
      )).toBe(true);
    });
  });

  describe('indeterminate exclusion warning (Rule 11)', () => {
    it('should warn when indeterminate results were excluded', () => {
      const quadas2 = getEmptyQUADAS2();
      const lrModifiers = getEmptyLRModifiers();
      lrModifiers.thresholdingResults.indeterminateHandledHow = 'excluded';
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.warnings.some(w => 
        w.message.includes('Excluding indeterminates')
      )).toBe(true);
    });
  });

  describe('summary paragraph generation', () => {
    it('should generate positive summary when no warnings', () => {
      const quadas2 = getEmptyQUADAS2();
      const lrModifiers = getEmptyLRModifiers();
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.summaryParagraph).toContain('methodologically sound');
    });

    it('should mention LOW internal validity in summary when applicable', () => {
      const quadas2 = getEmptyQUADAS2();
      quadas2.domain1.riskJudgment = 'HIGH';
      quadas2.domain3.riskJudgment = 'HIGH';
      const lrModifiers = getEmptyLRModifiers();
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.summaryParagraph).toContain('internal validity is LOW');
    });

    it('should include warning messages in summary', () => {
      const quadas2 = getEmptyQUADAS2();
      quadas2.domain4.q2_allReceiveReference = 'No';
      const lrModifiers = getEmptyLRModifiers();
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.summaryParagraph).toContain('Partial verification');
    });
  });

  describe('combined scenarios', () => {
    it('should correctly handle multiple issues', () => {
      const quadas2 = getEmptyQUADAS2();
      // Internal validity issues
      quadas2.domain1.riskJudgment = 'HIGH';
      quadas2.domain4.riskJudgment = 'HIGH';
      // Transportability issues
      quadas2.domain1.applicabilityJudgment = 'HIGH';
      // Specific warnings
      quadas2.domain4.q2_allReceiveReference = 'No';
      quadas2.domain4.q3_sameReference = 'No';
      
      const lrModifiers = getEmptyLRModifiers();
      lrModifiers.thresholdingResults.selectiveCutpointReportingSuspected = 'Yes';
      
      const result = computeLRValidityProfile(quadas2, lrModifiers);
      
      expect(result.internalValidity).toBe('low');
      expect(result.transportability).toBe('moderate');
      expect(result.lrInflationRisks.lrPlusInflated).toBe(true);
      expect(result.lrInflationRisks.lrMinusInflated).toBe(true);
      expect(result.lrInflationRisks.extremenessInflation).toBe(true);
      expect(result.warnings.length).toBeGreaterThanOrEqual(3);
    });
  });
});
