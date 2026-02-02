'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  computeLRValidityProfile,
  createEmptyStudyQualityData,
  createEmptyDomain2Test,
  type StudyQualityData,
  type QUADAS2Data,
  type LRModifiersData,
  type LRValidityProfileData,
  type QUADAS2Domain2Test,
  type QUADAS2Domain1,
  type QUADAS2Domain3,
  type QUADAS2Domain4,
  type QUADAS2Phase1,
  type QUADAS2Phase2,
  type YesNoUnclear,
  type RiskJudgment,
  type ConcernJudgment,
  type ValidityLevel,
} from './lr-validity-rules';

// Re-export for consumers
export { createEmptyStudyQualityData, createEmptyDomain2Test, computeLRValidityProfile };
export type {
  StudyQualityData,
  QUADAS2Data,
  LRModifiersData,
  LRValidityProfileData,
  QUADAS2Domain2Test,
  YesNoUnclear,
  RiskJudgment,
  ConcernJudgment,
  ValidityLevel,
};

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function YesNoUnclearRadio({
  name,
  value,
  onChange,
}: {
  name: string;
  value: YesNoUnclear;
  onChange: (v: YesNoUnclear) => void;
}) {
  return (
    <div className="flex space-x-4 mt-1">
      {(['Yes', 'No', 'Unclear'] as YesNoUnclear[]).map((opt) => (
        <label key={opt} className="flex items-center space-x-1 cursor-pointer">
          <input
            type="radio"
            name={name}
            checked={value === opt}
            onChange={() => onChange(opt)}
            className="w-4 h-4"
          />
          <span className={`text-sm ${
            opt === 'Yes' ? 'text-green-700' : 
            opt === 'No' ? 'text-red-700' : 
            'text-amber-700'
          }`}>{opt}</span>
        </label>
      ))}
    </div>
  );
}

function RiskRadio({
  name,
  value,
  onChange,
  showSpacing = false,
}: {
  name: string;
  value: RiskJudgment;
  onChange: (v: RiskJudgment) => void;
  showSpacing?: boolean;
}) {
  return (
    <div className="flex space-x-4 mt-1">
      {(['LOW', 'HIGH', 'UNCLEAR'] as RiskJudgment[]).map((opt) => (
        <label key={opt} className="flex items-center space-x-1 cursor-pointer">
          <input
            type="radio"
            name={name}
            checked={value === opt}
            onChange={() => onChange(opt)}
            className="w-4 h-4"
          />
          <span className={`text-sm font-medium ${
            opt === 'LOW' ? 'text-green-700' : 
            opt === 'HIGH' ? 'text-red-700' : 
            'text-amber-700'
          }`}>{showSpacing && opt === 'LOW' ? 'LOW ' : opt}</span>
        </label>
      ))}
    </div>
  );
}

function ConcernRadio({
  name,
  value,
  onChange,
}: {
  name: string;
  value: ConcernJudgment;
  onChange: (v: ConcernJudgment) => void;
}) {
  return (
    <div className="flex space-x-4 mt-1">
      {(['LOW', 'HIGH', 'UNCLEAR'] as ConcernJudgment[]).map((opt) => (
        <label key={opt} className="flex items-center space-x-1 cursor-pointer">
          <input
            type="radio"
            name={name}
            checked={value === opt}
            onChange={() => onChange(opt)}
            className="w-4 h-4"
          />
          <span className={`text-sm font-medium ${
            opt === 'LOW' ? 'text-green-700' : 
            opt === 'HIGH' ? 'text-red-700' : 
            'text-amber-700'
          }`}>{opt}</span>
        </label>
      ))}
    </div>
  );
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
      >
        <span>{title}</span>
        <span className="text-gray-400">{isOpen ? '▼' : '▶'}</span>
      </button>
      {isOpen && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

// =============================================================================
// TAB 1: QUADAS-2 VERBATIM
// =============================================================================

function QUADAS2VerbatimTab({
  data,
  onChange,
}: {
  data: QUADAS2Data;
  onChange: (data: QUADAS2Data) => void;
}) {
  const updatePhase1 = (field: keyof QUADAS2Phase1, value: string) => {
    onChange({ ...data, phase1: { ...data.phase1, [field]: value } });
  };

  const updatePhase2 = (field: keyof QUADAS2Phase2, value: any) => {
    onChange({ ...data, phase2: { ...data.phase2, [field]: value } });
  };

  const updateDomain1 = (field: keyof QUADAS2Domain1, value: any) => {
    onChange({ ...data, domain1: { ...data.domain1, [field]: value } });
  };

  const updateDomain2Test = (index: number, field: keyof QUADAS2Domain2Test, value: any) => {
    const newTests = [...data.domain2.tests];
    newTests[index] = { ...newTests[index], [field]: value };
    onChange({ ...data, domain2: { tests: newTests } });
  };

  const addIndexTest = () => {
    onChange({
      ...data,
      domain2: {
        tests: [
          ...data.domain2.tests,
          createEmptyDomain2Test(),
        ],
      },
    });
  };

  const removeIndexTest = (index: number) => {
    if (data.domain2.tests.length > 1) {
      const newTests = data.domain2.tests.filter((_, i) => i !== index);
      onChange({ ...data, domain2: { tests: newTests } });
    }
  };

  const updateDomain3 = (field: keyof QUADAS2Domain3, value: any) => {
    onChange({ ...data, domain3: { ...data.domain3, [field]: value } });
  };

  const updateDomain4 = (field: keyof QUADAS2Domain4, value: any) => {
    onChange({ ...data, domain4: { ...data.domain4, [field]: value } });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center border-b pb-4">
        <h2 className="text-2xl font-bold">QUADAS-2</h2>
      </div>

      {/* Phase 1 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Phase 1: State the review question:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-normal">
              Patients (setting, intended use of index test, presentation, prior testing):
            </Label>
            <Textarea
              value={data.phase1.patientsText}
              onChange={(e) => updatePhase1('patientsText', e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm font-normal">Index test(s):</Label>
            <Textarea
              value={data.phase1.indexTestsText}
              onChange={(e) => updatePhase1('indexTestsText', e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm font-normal">Reference standard and target condition:</Label>
            <Textarea
              value={data.phase1.referenceStandardText}
              onChange={(e) => updatePhase1('referenceStandardText', e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Phase 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Phase 2: Draw a flow diagram for the primary study</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.phase2.flowDiagramText}
            onChange={(e) => updatePhase2('flowDiagramText', e.target.value)}
            placeholder="Describe the flow diagram or paste a text representation..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Phase 3 Introduction */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Phase 3: Risk of bias and applicability judgments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">
            QUADAS-2 is structured so that 4 key domains are each rated in terms of the risk of bias and
            the concern regarding applicability to the research question (as defined above). Each key
            domain has a set of signalling questions to help reach the judgments regarding bias and
            applicability.
          </p>
        </CardContent>
      </Card>

      {/* DOMAIN 1: PATIENT SELECTION */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">DOMAIN 1: PATIENT SELECTION</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* A. Risk of Bias */}
          <div className="space-y-4">
            <h4 className="font-semibold">A. Risk of Bias</h4>
            
            <div>
              <Label className="text-sm font-normal">Describe methods of patient selection:</Label>
              <Textarea
                value={data.domain1.riskDescribeText}
                onChange={(e) => updateDomain1('riskDescribeText', e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <p className="text-sm">▪ Was a consecutive or random sample of patients enrolled? Yes/No/Unclear</p>
              <YesNoUnclearRadio
                name="d1-q1"
                value={data.domain1.q1_consecutiveRandom}
                onChange={(v) => updateDomain1('q1_consecutiveRandom', v)}
              />
            </div>

            <div>
              <p className="text-sm">▪ Was a case-control design avoided? Yes/No/Unclear</p>
              <YesNoUnclearRadio
                name="d1-q2"
                value={data.domain1.q2_avoidCaseControl}
                onChange={(v) => updateDomain1('q2_avoidCaseControl', v)}
              />
            </div>

            <div>
              <p className="text-sm">▪ Did the study avoid inappropriate exclusions? Yes/No/Unclear</p>
              <YesNoUnclearRadio
                name="d1-q3"
                value={data.domain1.q3_avoidInappropriateExclusions}
                onChange={(v) => updateDomain1('q3_avoidInappropriateExclusions', v)}
              />
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm font-medium">Could the selection of patients have introduced bias? RISK: LOW/HIGH/UNCLEAR</p>
              <RiskRadio
                name="d1-risk"
                value={data.domain1.riskJudgment}
                onChange={(v) => updateDomain1('riskJudgment', v)}
              />
            </div>
          </div>

          {/* B. Concerns regarding applicability */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold">B. Concerns regarding applicability</h4>
            
            <div>
              <Label className="text-sm font-normal">
                Describe included patients (prior testing, presentation, intended use of index test and setting):
              </Label>
              <Textarea
                value={data.domain1.applicabilityDescribeText}
                onChange={(e) => updateDomain1('applicabilityDescribeText', e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <p className="text-sm font-medium">
                Is there concern that the included patients do not match<br />
                the review question?
              </p>
              <p className="text-sm text-gray-600 mt-1">CONCERN: LOW/HIGH/UNCLEAR</p>
              <ConcernRadio
                name="d1-concern"
                value={data.domain1.applicabilityJudgment}
                onChange={(v) => updateDomain1('applicabilityJudgment', v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DOMAIN 2: INDEX TEST(S) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">DOMAIN 2: INDEX TEST(S)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-gray-700 italic">
            If more than one index test was used, please complete for each test.
          </p>

          {data.domain2.tests.map((test, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <h5 className="font-medium">Index Test {index + 1}</h5>
                {data.domain2.tests.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeIndexTest(index)}
                    className="text-red-600"
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div>
                <Label className="text-sm font-normal">Test name:</Label>
                <input
                  type="text"
                  value={test.indexTestName}
                  onChange={(e) => updateDomain2Test(index, 'indexTestName', e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md text-sm"
                  placeholder="Enter index test name"
                />
              </div>

              {/* A. Risk of Bias */}
              <div className="space-y-4">
                <h4 className="font-semibold">A. Risk of Bias</h4>
                
                <div>
                  <Label className="text-sm font-normal">
                    Describe the index test and how it was conducted and interpreted:
                  </Label>
                  <Textarea
                    value={test.riskDescribeText}
                    onChange={(e) => updateDomain2Test(index, 'riskDescribeText', e.target.value)}
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div>
                  <p className="text-sm">
                    ▪ Were the index test results interpreted without<br />
                    knowledge of the results of the reference standard?
                  </p>
                  <p className="text-sm text-gray-600">Yes/No/Unclear</p>
                  <YesNoUnclearRadio
                    name={`d2-t${index}-q1`}
                    value={test.q1_blindedToReference}
                    onChange={(v) => updateDomain2Test(index, 'q1_blindedToReference', v)}
                  />
                </div>

                <div>
                  <p className="text-sm">▪ If a threshold was used, was it pre-specified? Yes/No/Unclear</p>
                  <YesNoUnclearRadio
                    name={`d2-t${index}-q2`}
                    value={test.q2_thresholdPrespecified}
                    onChange={(v) => updateDomain2Test(index, 'q2_thresholdPrespecified', v)}
                  />
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm font-medium">
                    Could the conduct or interpretation of the index test<br />
                    have introduced bias?
                  </p>
                  <p className="text-sm text-gray-600">RISK: LOW /HIGH/UNCLEAR</p>
                  <RiskRadio
                    name={`d2-t${index}-risk`}
                    value={test.riskJudgment}
                    onChange={(v) => updateDomain2Test(index, 'riskJudgment', v)}
                    showSpacing={true}
                  />
                </div>
              </div>

              {/* B. Concerns regarding applicability */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold">B. Concerns regarding applicability</h4>
                
                <div>
                  <p className="text-sm font-medium">
                    Is there concern that the index test, its conduct, or<br />
                    interpretation differ from the review question?
                  </p>
                  <p className="text-sm text-gray-600">CONCERN: LOW /HIGH/UNCLEAR</p>
                  <ConcernRadio
                    name={`d2-t${index}-concern`}
                    value={test.applicabilityJudgment}
                    onChange={(v) => updateDomain2Test(index, 'applicabilityJudgment', v)}
                  />
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addIndexTest} className="w-full">
            + Add another index test
          </Button>
        </CardContent>
      </Card>

      {/* DOMAIN 3: REFERENCE STANDARD */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">DOMAIN 3: REFERENCE STANDARD</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* A. Risk of Bias */}
          <div className="space-y-4">
            <h4 className="font-semibold">A. Risk of Bias</h4>
            
            <div>
              <Label className="text-sm font-normal">
                Describe the reference standard and how it was conducted and interpreted:
              </Label>
              <Textarea
                value={data.domain3.riskDescribeText}
                onChange={(e) => updateDomain3('riskDescribeText', e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <p className="text-sm">
                ▪ Is the reference standard likely to correctly classify the target<br />
                condition?
              </p>
              <p className="text-sm text-gray-600">Yes/No/Unclear</p>
              <YesNoUnclearRadio
                name="d3-q1"
                value={data.domain3.q1_referenceCorrectClassify}
                onChange={(v) => updateDomain3('q1_referenceCorrectClassify', v)}
              />
            </div>

            <div>
              <p className="text-sm">
                ▪ Were the reference standard results interpreted without<br />
                knowledge of the results of the index test?
              </p>
              <p className="text-sm text-gray-600">Yes/No/Unclear</p>
              <YesNoUnclearRadio
                name="d3-q2"
                value={data.domain3.q2_referenceBlindedToIndex}
                onChange={(v) => updateDomain3('q2_referenceBlindedToIndex', v)}
              />
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm font-medium">
                Could the reference standard, its conduct, or its<br />
                interpretation have introduced bias?
              </p>
              <p className="text-sm text-gray-600">RISK: LOW /HIGH/UNCLEAR</p>
              <RiskRadio
                name="d3-risk"
                value={data.domain3.riskJudgment}
                onChange={(v) => updateDomain3('riskJudgment', v)}
                showSpacing={true}
              />
            </div>
          </div>

          {/* B. Concerns regarding applicability */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold">B. Concerns regarding applicability</h4>
            
            <div>
              <p className="text-sm font-medium">
                Is there concern that the target condition as defined by<br />
                the reference standard does not match the review<br />
                question?
              </p>
              <p className="text-sm text-gray-600">CONCERN: LOW /HIGH/UNCLEAR</p>
              <ConcernRadio
                name="d3-concern"
                value={data.domain3.applicabilityJudgment}
                onChange={(v) => updateDomain3('applicabilityJudgment', v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DOMAIN 4: FLOW AND TIMING */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">DOMAIN 4: FLOW AND TIMING</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* A. Risk of Bias */}
          <div className="space-y-4">
            <h4 className="font-semibold">A. Risk of Bias</h4>
            
            <div>
              <Label className="text-sm font-normal">
                Describe any patients who did not receive the index test(s) and/or reference standard or who
                were excluded from the 2x2 table (refer to flow diagram):
              </Label>
              <Textarea
                value={data.domain4.missingPatientsDescribeText}
                onChange={(e) => updateDomain4('missingPatientsDescribeText', e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-normal">
                Describe the time interval and any interventions between index test(s) and reference standard:
              </Label>
              <Textarea
                value={data.domain4.intervalInterventionsDescribeText}
                onChange={(e) => updateDomain4('intervalInterventionsDescribeText', e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <p className="text-sm">
                ▪ Was there an appropriate interval between index test(s)<br />
                and reference standard?
              </p>
              <p className="text-sm text-gray-600">Yes/No/Unclear</p>
              <YesNoUnclearRadio
                name="d4-q1"
                value={data.domain4.q1_appropriateInterval}
                onChange={(v) => updateDomain4('q1_appropriateInterval', v)}
              />
            </div>

            <div>
              <p className="text-sm">▪ Did all patients receive a reference standard? Yes/No/Unclear</p>
              <YesNoUnclearRadio
                name="d4-q2"
                value={data.domain4.q2_allReceiveReference}
                onChange={(v) => updateDomain4('q2_allReceiveReference', v)}
              />
            </div>

            <div>
              <p className="text-sm">▪ Did patients receive the same reference standard? Yes/No/Unclear</p>
              <YesNoUnclearRadio
                name="d4-q3"
                value={data.domain4.q3_sameReference}
                onChange={(v) => updateDomain4('q3_sameReference', v)}
              />
            </div>

            <div>
              <p className="text-sm">▪ Were all patients included in the analysis? Yes/No/Unclear</p>
              <YesNoUnclearRadio
                name="d4-q4"
                value={data.domain4.q4_allIncludedAnalysis}
                onChange={(v) => updateDomain4('q4_allIncludedAnalysis', v)}
              />
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm font-medium">Could the patient flow have introduced bias? RISK: LOW /HIGH/UNCLEAR</p>
              <RiskRadio
                name="d4-risk"
                value={data.domain4.riskJudgment}
                onChange={(v) => updateDomain4('riskJudgment', v)}
                showSpacing={true}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// TAB 2: LR MODIFIERS
// =============================================================================

function LRModifiersTab({
  data,
  quadas2,
  onChange,
}: {
  data: LRModifiersData;
  quadas2: QUADAS2Data;
  onChange: (data: LRModifiersData) => void;
}) {
  const updateSection = <K extends keyof LRModifiersData>(
    section: K,
    field: keyof LRModifiersData[K],
    value: any
  ) => {
    onChange({
      ...data,
      [section]: { ...data[section], [field]: value },
    });
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-purple-50 rounded-md text-sm text-purple-800">
        <strong>LR Modifier Assessment</strong> captures factors affecting LR validity and transportability 
        that are not fully addressed by QUADAS-2. Fields may be pre-filled based on QUADAS-2 responses.
      </div>

      {/* 1) Patient Spectrum & Disease Characteristics */}
      <CollapsibleSection title="1) Patient Spectrum & Disease Characteristics" defaultOpen={true}>
        <div className="space-y-3">
          <div>
            <p className="text-sm">Is disease severity representative of the target population?</p>
            <YesNoUnclearRadio
              name="lr-spectrum-severity"
              value={data.patientSpectrum.severityRepresentative}
              onChange={(v) => updateSection('patientSpectrum', 'severityRepresentative', v)}
            />
          </div>
          <div>
            <p className="text-sm">Is disease stage representative?</p>
            <YesNoUnclearRadio
              name="lr-spectrum-stage"
              value={data.patientSpectrum.stageRepresentative}
              onChange={(v) => updateSection('patientSpectrum', 'stageRepresentative', v)}
            />
          </div>
          <div>
            <p className="text-sm">Is the study restricted to specific phenotype/subtype?</p>
            <YesNoUnclearRadio
              name="lr-spectrum-phenotype"
              value={data.patientSpectrum.phenotypeRestricted}
              onChange={(v) => updateSection('patientSpectrum', 'phenotypeRestricted', v)}
            />
          </div>
          <div>
            <p className="text-sm">Is symptom profile typical of real-world presentation?</p>
            <YesNoUnclearRadio
              name="lr-spectrum-symptom"
              value={data.patientSpectrum.symptomProfileTypicality}
              onChange={(v) => updateSection('patientSpectrum', 'symptomProfileTypicality', v)}
            />
          </div>
          <div>
            <p className="text-sm">Were mimicking conditions excluded?</p>
            <YesNoUnclearRadio
              name="lr-spectrum-mimickers"
              value={data.patientSpectrum.mimickersExcluded}
              onChange={(v) => updateSection('patientSpectrum', 'mimickersExcluded', v)}
            />
          </div>
          <div>
            <p className="text-sm">Are masking conditions present that could affect test signal?</p>
            <YesNoUnclearRadio
              name="lr-spectrum-maskers"
              value={data.patientSpectrum.maskersPresent}
              onChange={(v) => updateSection('patientSpectrum', 'maskersPresent', v)}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Notes:</Label>
            <Textarea
              value={data.patientSpectrum.notes}
              onChange={(e) => updateSection('patientSpectrum', 'notes', e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* 2) Demographics & Baseline Patient Factors */}
      <CollapsibleSection title="2) Demographics & Baseline Patient Factors">
        <div className="space-y-3">
          <div>
            <p className="text-sm">Is age distribution representative?</p>
            <YesNoUnclearRadio
              name="lr-demo-age"
              value={data.demographics.ageRepresentative}
              onChange={(v) => updateSection('demographics', 'ageRepresentative', v)}
            />
          </div>
          <div>
            <p className="text-sm">Is sex distribution representative?</p>
            <YesNoUnclearRadio
              name="lr-demo-sex"
              value={data.demographics.sexRepresentative}
              onChange={(v) => updateSection('demographics', 'sexRepresentative', v)}
            />
          </div>
          <div>
            <p className="text-sm">Is comorbidity burden representative?</p>
            <YesNoUnclearRadio
              name="lr-demo-comorbidity"
              value={data.demographics.comorbidityRepresentative}
              onChange={(v) => updateSection('demographics', 'comorbidityRepresentative', v)}
            />
          </div>
          <div>
            <p className="text-sm">Does renal/hepatic function affect test signal?</p>
            <YesNoUnclearRadio
              name="lr-demo-renal"
              value={data.demographics.renalHepaticAffectsSignal}
              onChange={(v) => updateSection('demographics', 'renalHepaticAffectsSignal', v)}
            />
          </div>
          <div>
            <p className="text-sm">Does immunosuppression affect test signal?</p>
            <YesNoUnclearRadio
              name="lr-demo-immuno"
              value={data.demographics.immunosuppressionAffectsSignal}
              onChange={(v) => updateSection('demographics', 'immunosuppressionAffectsSignal', v)}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Medications that affect signal (list):</Label>
            <Textarea
              value={data.demographics.medsAffectSignalList}
              onChange={(e) => updateSection('demographics', 'medsAffectSignalList', e.target.value)}
              rows={2}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Notes:</Label>
            <Textarea
              value={data.demographics.notes}
              onChange={(e) => updateSection('demographics', 'notes', e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* 3) Clinical Setting, Referral Pathway, Intended Use */}
      <CollapsibleSection title="3) Clinical Setting, Referral Pathway, Intended Use">
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Clinical setting:</Label>
            <select
              value={data.settingUse.setting}
              onChange={(e) => updateSection('settingUse', 'setting', e.target.value)}
              className="w-full mt-1 p-2 border rounded-md text-sm"
            >
              <option value="">Select...</option>
              <option value="screening">Screening</option>
              <option value="primary_care">Primary Care</option>
              <option value="ED">Emergency Department</option>
              <option value="ICU">ICU</option>
              <option value="outpatient">Outpatient Specialty</option>
              <option value="specialty">Inpatient Specialty</option>
            </select>
          </div>
          <div>
            <p className="text-sm">Is referral enrichment present?</p>
            <YesNoUnclearRadio
              name="lr-setting-referral"
              value={data.settingUse.referralEnrichment}
              onChange={(v) => updateSection('settingUse', 'referralEnrichment', v)}
            />
          </div>
          <div>
            <Label className="text-sm">Intended use:</Label>
            <select
              value={data.settingUse.intendedUse}
              onChange={(e) => updateSection('settingUse', 'intendedUse', e.target.value)}
              className="w-full mt-1 p-2 border rounded-md text-sm"
            >
              <option value="">Select...</option>
              <option value="rule_out">Rule out</option>
              <option value="rule_in">Rule in</option>
              <option value="triage">Triage</option>
              <option value="diagnosis">Definitive diagnosis</option>
            </select>
          </div>
          <div>
            <p className="text-sm">Are there workflow/verification constraints affecting who gets tested?</p>
            <YesNoUnclearRadio
              name="lr-setting-workflow"
              value={data.settingUse.workflowVerificationConstraints}
              onChange={(v) => updateSection('settingUse', 'workflowVerificationConstraints', v)}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Notes:</Label>
            <Textarea
              value={data.settingUse.notes}
              onChange={(e) => updateSection('settingUse', 'notes', e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* 4) Timing relative to biology and care */}
      <CollapsibleSection title="4) Timing Relative to Biology & Care">
        <div className="space-y-3">
          <div>
            <p className="text-sm">Was time from symptom onset controlled/reported?</p>
            <YesNoUnclearRadio
              name="lr-timing-onset"
              value={data.timingBiology.onsetTimingControlled}
              onChange={(v) => updateSection('timingBiology', 'onsetTimingControlled', v)}
            />
          </div>
          <div>
            <p className="text-sm">Was treatment started before test?</p>
            <YesNoUnclearRadio
              name="lr-timing-treatment"
              value={data.timingBiology.treatmentBeforeTest}
              onChange={(v) => updateSection('timingBiology', 'treatmentBeforeTest', v)}
            />
          </div>
          <div>
            <p className="text-sm">Was serial testing strategy used?</p>
            <YesNoUnclearRadio
              name="lr-timing-serial"
              value={data.timingBiology.serialTestingStrategy}
              onChange={(v) => updateSection('timingBiology', 'serialTestingStrategy', v)}
            />
          </div>
          <div>
            <p className="text-sm">Was physiologic state standardized?</p>
            <YesNoUnclearRadio
              name="lr-timing-physio"
              value={data.timingBiology.physiologicStateStandardized}
              onChange={(v) => updateSection('timingBiology', 'physiologicStateStandardized', v)}
            />
          </div>
          <div>
            <p className="text-sm">Are intercurrent events likely to affect results?</p>
            <YesNoUnclearRadio
              name="lr-timing-intercurrent"
              value={data.timingBiology.intercurrentEventsLikely}
              onChange={(v) => updateSection('timingBiology', 'intercurrentEventsLikely', v)}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Notes:</Label>
            <Textarea
              value={data.timingBiology.notes}
              onChange={(e) => updateSection('timingBiology', 'notes', e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* 5) Index test technology and protocol */}
      <CollapsibleSection title="5) Index Test Technology & Protocol">
        <div className="space-y-3">
          <div>
            <p className="text-sm">Is assay platform specified?</p>
            <YesNoUnclearRadio
              name="lr-tech-platform"
              value={data.testTechProtocol.platformSpecified}
              onChange={(v) => updateSection('testTechProtocol', 'platformSpecified', v)}
            />
          </div>
          <div>
            <p className="text-sm">Does platform match your clinical context?</p>
            <YesNoUnclearRadio
              name="lr-tech-match"
              value={data.testTechProtocol.platformMatchesUserContext}
              onChange={(v) => updateSection('testTechProtocol', 'platformMatchesUserContext', v)}
            />
          </div>
          <div>
            <p className="text-sm">Is protocol standardized?</p>
            <YesNoUnclearRadio
              name="lr-tech-protocol"
              value={data.testTechProtocol.protocolStandardized}
              onChange={(v) => updateSection('testTechProtocol', 'protocolStandardized', v)}
            />
          </div>
          <div>
            <p className="text-sm">Is operator dependence high?</p>
            <YesNoUnclearRadio
              name="lr-tech-operator"
              value={data.testTechProtocol.operatorDependenceHigh}
              onChange={(v) => updateSection('testTechProtocol', 'operatorDependenceHigh', v)}
            />
          </div>
          <div>
            <p className="text-sm">Are known interferents addressed?</p>
            <YesNoUnclearRadio
              name="lr-tech-interferents"
              value={data.testTechProtocol.interferentsAddressed}
              onChange={(v) => updateSection('testTechProtocol', 'interferentsAddressed', v)}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Notes:</Label>
            <Textarea
              value={data.testTechProtocol.notes}
              onChange={(e) => updateSection('testTechProtocol', 'notes', e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* 6) Pre-analytic conditions */}
      <CollapsibleSection title="6) Pre-Analytic Conditions">
        <div className="space-y-3">
          <div>
            <p className="text-sm">Is specimen type standardized?</p>
            <YesNoUnclearRadio
              name="lr-preanalytic-specimen"
              value={data.preAnalytics.specimenStandardized}
              onChange={(v) => updateSection('preAnalytics', 'specimenStandardized', v)}
            />
          </div>
          <div>
            <p className="text-sm">Is collection/handling standardized?</p>
            <YesNoUnclearRadio
              name="lr-preanalytic-collection"
              value={data.preAnalytics.collectionHandlingStandardized}
              onChange={(v) => updateSection('preAnalytics', 'collectionHandlingStandardized', v)}
            />
          </div>
          <div>
            <p className="text-sm">Is transport/storage reported?</p>
            <YesNoUnclearRadio
              name="lr-preanalytic-transport"
              value={data.preAnalytics.transportStorageReported}
              onChange={(v) => updateSection('preAnalytics', 'transportStorageReported', v)}
            />
          </div>
          <div>
            <p className="text-sm">Are known interferents addressed?</p>
            <YesNoUnclearRadio
              name="lr-preanalytic-interferents"
              value={data.preAnalytics.knownInterferentsAddressed}
              onChange={(v) => updateSection('preAnalytics', 'knownInterferentsAddressed', v)}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Notes:</Label>
            <Textarea
              value={data.preAnalytics.notes}
              onChange={(e) => updateSection('preAnalytics', 'notes', e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* 7) Interpretation / reader / human factors */}
      <CollapsibleSection title="7) Interpretation / Reader / Human Factors">
        <div className="space-y-3">
          <div>
            <p className="text-sm">Is reader experience reported?</p>
            <YesNoUnclearRadio
              name="lr-interp-experience"
              value={data.interpretationHuman.readerExperienceReported}
              onChange={(v) => updateSection('interpretationHuman', 'readerExperienceReported', v)}
            />
          </div>
          <div>
            <p className="text-sm">Is inter-reader variability reported?</p>
            <YesNoUnclearRadio
              name="lr-interp-variability"
              value={data.interpretationHuman.interReaderVariabilityReported}
              onChange={(v) => updateSection('interpretationHuman', 'interReaderVariabilityReported', v)}
            />
          </div>
          <div>
            <p className="text-sm">Are structured interpretation criteria used?</p>
            <YesNoUnclearRadio
              name="lr-interp-structured"
              value={data.interpretationHuman.structuredCriteriaUsed}
              onChange={(v) => updateSection('interpretationHuman', 'structuredCriteriaUsed', v)}
            />
          </div>
          <div>
            <p className="text-sm">Is AI assistance used?</p>
            <YesNoUnclearRadio
              name="lr-interp-ai"
              value={data.interpretationHuman.aiAssistanceUsed}
              onChange={(v) => updateSection('interpretationHuman', 'aiAssistanceUsed', v)}
            />
          </div>
          <div>
            <p className="text-sm">Did readers have access to clinical info during interpretation?</p>
            <YesNoUnclearRadio
              name="lr-interp-clinical"
              value={data.interpretationHuman.accessToClinicalInfoDuringRead}
              onChange={(v) => updateSection('interpretationHuman', 'accessToClinicalInfoDuringRead', v)}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Notes:</Label>
            <Textarea
              value={data.interpretationHuman.notes}
              onChange={(e) => updateSection('interpretationHuman', 'notes', e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* 8) Thresholding & indeterminates */}
      <CollapsibleSection title="8) Thresholding & Indeterminates">
        <div className="space-y-3">
          <div>
            <p className="text-sm">Were multiple thresholds reported?</p>
            <YesNoUnclearRadio
              name="lr-thresh-multiple"
              value={data.thresholdingResults.multipleThresholdsReported}
              onChange={(v) => updateSection('thresholdingResults', 'multipleThresholdsReported', v)}
            />
          </div>
          <div>
            <Label className="text-sm">How were indeterminate results handled?</Label>
            <select
              value={data.thresholdingResults.indeterminateHandledHow}
              onChange={(e) => updateSection('thresholdingResults', 'indeterminateHandledHow', e.target.value)}
              className="w-full mt-1 p-2 border rounded-md text-sm"
            >
              <option value="">Select...</option>
              <option value="included">Included in analysis</option>
              <option value="excluded">Excluded from analysis</option>
              <option value="separate">Reported separately</option>
              <option value="not_reported">Not reported</option>
            </select>
          </div>
          <div>
            <p className="text-sm">Are interval LRs derivable from the data?</p>
            <YesNoUnclearRadio
              name="lr-thresh-interval"
              value={data.thresholdingResults.intervalLRsDerivable}
              onChange={(v) => updateSection('thresholdingResults', 'intervalLRsDerivable', v)}
            />
          </div>
          <div>
            <p className="text-sm">Is selective cutpoint reporting suspected?</p>
            <YesNoUnclearRadio
              name="lr-thresh-selective"
              value={data.thresholdingResults.selectiveCutpointReportingSuspected}
              onChange={(v) => updateSection('thresholdingResults', 'selectiveCutpointReportingSuspected', v)}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Notes:</Label>
            <Textarea
              value={data.thresholdingResults.notes}
              onChange={(e) => updateSection('thresholdingResults', 'notes', e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* 9) Reference standard effects (beyond QUADAS-2 basics) */}
      <CollapsibleSection title="9) Reference Standard Effects (Beyond QUADAS-2)">
        <div className="space-y-3">
          <div>
            <p className="text-sm">Was reference standard uniform for all patients?</p>
            <YesNoUnclearRadio
              name="lr-ref-uniform"
              value={data.referenceStandardEffects.referenceUniform}
              onChange={(v) => updateSection('referenceStandardEffects', 'referenceUniform', v)}
            />
          </div>
          <div>
            <p className="text-sm">Was reference standard independent of index test?</p>
            <YesNoUnclearRadio
              name="lr-ref-independent"
              value={data.referenceStandardEffects.referenceIndependent}
              onChange={(v) => updateSection('referenceStandardEffects', 'referenceIndependent', v)}
            />
          </div>
          <div>
            <p className="text-sm">Was clinical follow-up used as reference?</p>
            <YesNoUnclearRadio
              name="lr-ref-followup"
              value={data.referenceStandardEffects.followupAsReference}
              onChange={(v) => updateSection('referenceStandardEffects', 'followupAsReference', v)}
            />
          </div>
          <div>
            <p className="text-sm">Is disease definition stable/consistent?</p>
            <YesNoUnclearRadio
              name="lr-ref-definition"
              value={data.referenceStandardEffects.diseaseDefinitionStable}
              onChange={(v) => updateSection('referenceStandardEffects', 'diseaseDefinitionStable', v)}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Notes:</Label>
            <Textarea
              value={data.referenceStandardEffects.notes}
              onChange={(e) => updateSection('referenceStandardEffects', 'notes', e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* 10) Analysis & reporting choices */}
      <CollapsibleSection title="10) Analysis & Reporting Choices">
        <div className="space-y-3">
          <div>
            <p className="text-sm">Was clustering/correlation handled appropriately?</p>
            <YesNoUnclearRadio
              name="lr-analysis-clustering"
              value={data.analysisReporting.clusteringHandled}
              onChange={(v) => updateSection('analysisReporting', 'clusteringHandled', v)}
            />
          </div>
          <div>
            <p className="text-sm">Was missingness handled appropriately?</p>
            <YesNoUnclearRadio
              name="lr-analysis-missing"
              value={data.analysisReporting.missingnessHandled}
              onChange={(v) => updateSection('analysisReporting', 'missingnessHandled', v)}
            />
          </div>
          <div>
            <p className="text-sm">Is subgroup fishing/p-hacking suspected?</p>
            <YesNoUnclearRadio
              name="lr-analysis-subgroup"
              value={data.analysisReporting.subgroupFishingSuspected}
              onChange={(v) => updateSection('analysisReporting', 'subgroupFishingSuspected', v)}
            />
          </div>
          <div>
            <p className="text-sm">Was continuous data dichotomized?</p>
            <YesNoUnclearRadio
              name="lr-analysis-dichotomized"
              value={data.analysisReporting.dichotomizedContinuous}
              onChange={(v) => updateSection('analysisReporting', 'dichotomizedContinuous', v)}
            />
          </div>
          <div>
            <p className="text-sm">Is there risk of optimism/overfitting?</p>
            <YesNoUnclearRadio
              name="lr-analysis-overfit"
              value={data.analysisReporting.optimismOverfitRisk}
              onChange={(v) => updateSection('analysisReporting', 'optimismOverfitRisk', v)}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Notes:</Label>
            <Textarea
              value={data.analysisReporting.notes}
              onChange={(e) => updateSection('analysisReporting', 'notes', e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* 11) Publication/dissemination signals */}
      <CollapsibleSection title="11) Publication/Dissemination Signals">
        <div className="space-y-3">
          <div>
            <p className="text-sm">Was the study pre-registered?</p>
            <YesNoUnclearRadio
              name="lr-pub-prereg"
              value={data.publicationSignals.preregistered}
              onChange={(v) => updateSection('publicationSignals', 'preregistered', v)}
            />
          </div>
          <div>
            <p className="text-sm">Do outcomes match methods section?</p>
            <YesNoUnclearRadio
              name="lr-pub-match"
              value={data.publicationSignals.outcomesMatchMethods}
              onChange={(v) => updateSection('publicationSignals', 'outcomesMatchMethods', v)}
            />
          </div>
          <div>
            <p className="text-sm">Are negative results reported?</p>
            <YesNoUnclearRadio
              name="lr-pub-negative"
              value={data.publicationSignals.negativeResultsReported}
              onChange={(v) => updateSection('publicationSignals', 'negativeResultsReported', v)}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Notes:</Label>
            <Textarea
              value={data.publicationSignals.notes}
              onChange={(e) => updateSection('publicationSignals', 'notes', e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}

// =============================================================================
// TAB 3: LR VALIDITY PROFILE
// =============================================================================

function LRValidityProfileTab({
  profile,
  analystNotes,
  onNotesChange,
}: {
  profile: Omit<LRValidityProfileData, 'analystNotes'>;
  analystNotes: string;
  onNotesChange: (notes: string) => void;
}) {
  const [expandedWarnings, setExpandedWarnings] = useState<Set<number>>(new Set());

  const toggleWarning = (index: number) => {
    const newExpanded = new Set(expandedWarnings);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedWarnings(newExpanded);
  };

  const getValidityColor = (level: ValidityLevel) => {
    switch (level) {
      case 'high': return 'bg-green-100 border-green-300 text-green-800';
      case 'moderate': return 'bg-amber-100 border-amber-300 text-amber-800';
      case 'low': return 'bg-red-100 border-red-300 text-red-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-800">
        <strong>LR Validity Profile</strong> is computed from your QUADAS-2 and LR Modifier responses.
        No additional input required, but you may add analyst notes.
      </div>

      {/* Validity Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className={`${getValidityColor(profile.internalValidity)} border-2`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Internal Validity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold uppercase">{profile.internalValidity}</p>
          </CardContent>
        </Card>
        <Card className={`${getValidityColor(profile.transportability)} border-2`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Transportability</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold uppercase">{profile.transportability}</p>
          </CardContent>
        </Card>
      </div>

      {/* LR Inflation Risks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">LR Inflation Risks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className={`p-2 rounded ${profile.lrInflationRisks.lrPlusInflated ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'}`}>
              {profile.lrInflationRisks.lrPlusInflated ? '⚠' : '✓'} LR+ Inflation: {profile.lrInflationRisks.lrPlusInflated ? 'RISK' : 'OK'}
            </div>
            <div className={`p-2 rounded ${profile.lrInflationRisks.lrMinusInflated ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'}`}>
              {profile.lrInflationRisks.lrMinusInflated ? '⚠' : '✓'} LR− Inflation: {profile.lrInflationRisks.lrMinusInflated ? 'RISK' : 'OK'}
            </div>
            <div className={`p-2 rounded ${profile.lrInflationRisks.extremenessInflation ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'}`}>
              {profile.lrInflationRisks.extremenessInflation ? '⚠' : '✓'} Extremeness: {profile.lrInflationRisks.extremenessInflation ? 'RISK' : 'OK'}
            </div>
            <div className={`p-2 rounded ${profile.lrInflationRisks.timeDependentInstability ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>
              {profile.lrInflationRisks.timeDependentInstability ? '⚠' : '✓'} Time Instability: {profile.lrInflationRisks.timeDependentInstability ? 'RISK' : 'OK'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {profile.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Warnings ({profile.warnings.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {profile.warnings.map((warning, i) => (
              <div key={i} className="border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleWarning(i)}
                  className="w-full p-3 text-left bg-amber-50 hover:bg-amber-100 flex justify-between items-center"
                >
                  <span className="text-sm text-amber-900">⚠ {warning.message}</span>
                  <span className="text-gray-400 text-xs">{expandedWarnings.has(i) ? 'Hide why' : 'Why?'}</span>
                </button>
                {expandedWarnings.has(i) && (
                  <div className="p-3 bg-gray-50 text-xs text-gray-600">
                    <p className="font-medium mb-1">Sources:</p>
                    <ul className="list-disc list-inside">
                      {warning.sources.map((src, j) => (
                        <li key={j}>{src}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 italic">{profile.summaryParagraph}</p>
        </CardContent>
      </Card>

      {/* Analyst Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analyst Notes (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={analystNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Add any additional notes or context about the quality assessment..."
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface StudyQualityAssessmentProps {
  value: StudyQualityData;
  onChange: (data: StudyQualityData) => void;
}

export function StudyQualityAssessment({ value, onChange }: StudyQualityAssessmentProps) {
  const [activeTab, setActiveTab] = useState<'quadas2' | 'modifiers' | 'profile'>('quadas2');

  // Compute validity profile whenever QUADAS-2 or modifiers change
  const computedProfile = useMemo(() => {
    return computeLRValidityProfile(value.quadas2, value.lrModifiers);
  }, [value.quadas2, value.lrModifiers]);

  const updateQUADAS2 = (quadas2: QUADAS2Data) => {
    onChange({ ...value, quadas2 });
  };

  const updateLRModifiers = (lrModifiers: LRModifiersData) => {
    onChange({ ...value, lrModifiers });
  };

  const updateAnalystNotes = (notes: string) => {
    onChange({
      ...value,
      lrValidityProfile: { ...value.lrValidityProfile, analystNotes: notes },
    });
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('quadas2')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'quadas2'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          QUADAS-2 (Verbatim)
        </button>
        <button
          onClick={() => setActiveTab('modifiers')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'modifiers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          LR Modifiers
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          LR Validity Profile
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'quadas2' && (
        <>
          <QUADAS2VerbatimTab data={value.quadas2} onChange={updateQUADAS2} />
          <div className="flex justify-end pt-4">
            <Button onClick={() => setActiveTab('modifiers')}>
              Continue to LR Modifiers →
            </Button>
          </div>
        </>
      )}

      {activeTab === 'modifiers' && (
        <>
          <LRModifiersTab
            data={value.lrModifiers}
            quadas2={value.quadas2}
            onChange={updateLRModifiers}
          />
          <div className="flex justify-end pt-4">
            <Button onClick={() => setActiveTab('profile')}>
              Continue to LR Validity Profile →
            </Button>
          </div>
        </>
      )}

      {activeTab === 'profile' && (
        <LRValidityProfileTab
          profile={computedProfile}
          analystNotes={value.lrValidityProfile.analystNotes}
          onNotesChange={updateAnalystNotes}
        />
      )}
    </div>
  );
}
