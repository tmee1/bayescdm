'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type SignalingAnswer = 'yes' | 'no' | 'unclear' | '';
type RiskLevel = 'low' | 'high' | 'unclear' | '';

interface QUADAS2Data {
  // Domain 1: Patient Selection
  patientSelection: {
    description: string;
    consecutiveOrRandom: SignalingAnswer;
    caseControlAvoided: SignalingAnswer;
    inappropriateExclusionsAvoided: SignalingAnswer;
    riskOfBias: RiskLevel;
    applicabilityDescription: string;
    applicabilityConcern: RiskLevel;
  };
  // Domain 2: Index Test
  indexTest: {
    description: string;
    blindedToReference: SignalingAnswer;
    thresholdPreSpecified: SignalingAnswer;
    riskOfBias: RiskLevel;
    applicabilityConcern: RiskLevel;
  };
  // Domain 3: Reference Standard
  referenceStandard: {
    description: string;
    likelyCorrectClassification: SignalingAnswer;
    blindedToIndex: SignalingAnswer;
    riskOfBias: RiskLevel;
    applicabilityConcern: RiskLevel;
  };
  // Domain 4: Flow and Timing
  flowAndTiming: {
    excludedPatientsDescription: string;
    timeIntervalDescription: string;
    appropriateInterval: SignalingAnswer;
    allReceivedReference: SignalingAnswer;
    sameReferenceStandard: SignalingAnswer;
    allIncludedInAnalysis: SignalingAnswer;
    riskOfBias: RiskLevel;
  };
}

interface QUADAS2FormProps {
  value: QUADAS2Data;
  onChange: (data: QUADAS2Data) => void;
}

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

function SignalingQuestion({
  id,
  question,
  value,
  onChange,
}: {
  id: string;
  question: string;
  value: SignalingAnswer;
  onChange: (value: SignalingAnswer) => void;
}) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <p className="text-sm text-gray-700 mb-2">{question}</p>
      <div className="flex space-x-6">
        <RadioOption
          name={id}
          value="yes"
          checked={value === 'yes'}
          onChange={() => onChange('yes')}
          label="Yes"
          color="text-green-600"
        />
        <RadioOption
          name={id}
          value="no"
          checked={value === 'no'}
          onChange={() => onChange('no')}
          label="No"
          color="text-red-600"
        />
        <RadioOption
          name={id}
          value="unclear"
          checked={value === 'unclear'}
          onChange={() => onChange('unclear')}
          label="Unclear"
          color="text-amber-600"
        />
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
        <RadioOption
          name={id}
          value="low"
          checked={value === 'low'}
          onChange={() => onChange('low')}
          label="Low"
          color="text-green-600 font-medium"
        />
        <RadioOption
          name={id}
          value="high"
          checked={value === 'high'}
          onChange={() => onChange('high')}
          label="High"
          color="text-red-600 font-medium"
        />
        <RadioOption
          name={id}
          value="unclear"
          checked={value === 'unclear'}
          onChange={() => onChange('unclear')}
          label="Unclear"
          color="text-amber-600 font-medium"
        />
      </div>
    </div>
  );
}

export function QUADAS2Form({ value, onChange }: QUADAS2FormProps) {
  const updatePatientSelection = (field: keyof QUADAS2Data['patientSelection'], val: any) => {
    onChange({
      ...value,
      patientSelection: { ...value.patientSelection, [field]: val },
    });
  };

  const updateIndexTest = (field: keyof QUADAS2Data['indexTest'], val: any) => {
    onChange({
      ...value,
      indexTest: { ...value.indexTest, [field]: val },
    });
  };

  const updateReferenceStandard = (field: keyof QUADAS2Data['referenceStandard'], val: any) => {
    onChange({
      ...value,
      referenceStandard: { ...value.referenceStandard, [field]: val },
    });
  };

  const updateFlowAndTiming = (field: keyof QUADAS2Data['flowAndTiming'], val: any) => {
    onChange({
      ...value,
      flowAndTiming: { ...value.flowAndTiming, [field]: val },
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-md">
        <strong>QUADAS-2</strong> (Quality Assessment of Diagnostic Accuracy Studies, Version 2) 
        assesses risk of bias and applicability concerns across 4 domains. Answer all signaling 
        questions, then provide your judgment for each domain.
      </div>

      {/* DOMAIN 1: PATIENT SELECTION */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Domain 1: Patient Selection</CardTitle>
          <CardDescription>
            Could the selection of patients have introduced bias?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Risk of Bias Section */}
          <div>
            <h4 className="font-medium text-sm text-gray-900 mb-2">A. Risk of Bias</h4>
            <div className="mb-3">
              <Label className="text-xs text-gray-500">Describe methods of patient selection:</Label>
              <Textarea
                value={value.patientSelection.description}
                onChange={(e) => updatePatientSelection('description', e.target.value)}
                placeholder="Describe how patients were selected for the study..."
                rows={2}
                className="mt-1"
              />
            </div>
            
            <div className="space-y-1">
              <SignalingQuestion
                id="ps-consecutive"
                question="Was a consecutive or random sample of patients enrolled?"
                value={value.patientSelection.consecutiveOrRandom}
                onChange={(v) => updatePatientSelection('consecutiveOrRandom', v)}
              />
              <SignalingQuestion
                id="ps-case-control"
                question="Was a case-control design avoided?"
                value={value.patientSelection.caseControlAvoided}
                onChange={(v) => updatePatientSelection('caseControlAvoided', v)}
              />
              <SignalingQuestion
                id="ps-exclusions"
                question="Did the study avoid inappropriate exclusions?"
                value={value.patientSelection.inappropriateExclusionsAvoided}
                onChange={(v) => updatePatientSelection('inappropriateExclusionsAvoided', v)}
              />
            </div>

            <div className="mt-4">
              <RiskJudgment
                id="ps-risk"
                label="Could the selection of patients have introduced bias?"
                value={value.patientSelection.riskOfBias}
                onChange={(v) => updatePatientSelection('riskOfBias', v)}
              />
            </div>
          </div>

          {/* Applicability Section */}
          <div className="pt-4 border-t">
            <h4 className="font-medium text-sm text-gray-900 mb-2">B. Concerns Regarding Applicability</h4>
            <div className="mb-3">
              <Label className="text-xs text-gray-500">
                Describe included patients (prior testing, presentation, intended use of index test and setting):
              </Label>
              <Textarea
                value={value.patientSelection.applicabilityDescription}
                onChange={(e) => updatePatientSelection('applicabilityDescription', e.target.value)}
                placeholder="Describe the patient population and clinical context..."
                rows={2}
                className="mt-1"
              />
            </div>
            <RiskJudgment
              id="ps-applicability"
              label="Is there concern that the included patients do not match the review question?"
              value={value.patientSelection.applicabilityConcern}
              onChange={(v) => updatePatientSelection('applicabilityConcern', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* DOMAIN 2: INDEX TEST */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Domain 2: Index Test</CardTitle>
          <CardDescription>
            Could the conduct or interpretation of the index test have introduced bias?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Risk of Bias Section */}
          <div>
            <h4 className="font-medium text-sm text-gray-900 mb-2">A. Risk of Bias</h4>
            <div className="mb-3">
              <Label className="text-xs text-gray-500">
                Describe the index test and how it was conducted and interpreted:
              </Label>
              <Textarea
                value={value.indexTest.description}
                onChange={(e) => updateIndexTest('description', e.target.value)}
                placeholder="Describe the index test methodology..."
                rows={2}
                className="mt-1"
              />
            </div>
            
            <div className="space-y-1">
              <SignalingQuestion
                id="it-blinded"
                question="Were the index test results interpreted without knowledge of the results of the reference standard?"
                value={value.indexTest.blindedToReference}
                onChange={(v) => updateIndexTest('blindedToReference', v)}
              />
              <SignalingQuestion
                id="it-threshold"
                question="If a threshold was used, was it pre-specified?"
                value={value.indexTest.thresholdPreSpecified}
                onChange={(v) => updateIndexTest('thresholdPreSpecified', v)}
              />
            </div>

            <div className="mt-4">
              <RiskJudgment
                id="it-risk"
                label="Could the conduct or interpretation of the index test have introduced bias?"
                value={value.indexTest.riskOfBias}
                onChange={(v) => updateIndexTest('riskOfBias', v)}
              />
            </div>
          </div>

          {/* Applicability Section */}
          <div className="pt-4 border-t">
            <h4 className="font-medium text-sm text-gray-900 mb-2">B. Concerns Regarding Applicability</h4>
            <RiskJudgment
              id="it-applicability"
              label="Is there concern that the index test, its conduct, or interpretation differ from the review question?"
              value={value.indexTest.applicabilityConcern}
              onChange={(v) => updateIndexTest('applicabilityConcern', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* DOMAIN 3: REFERENCE STANDARD */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Domain 3: Reference Standard</CardTitle>
          <CardDescription>
            Could the reference standard, its conduct, or its interpretation have introduced bias?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Risk of Bias Section */}
          <div>
            <h4 className="font-medium text-sm text-gray-900 mb-2">A. Risk of Bias</h4>
            <div className="mb-3">
              <Label className="text-xs text-gray-500">
                Describe the reference standard and how it was conducted and interpreted:
              </Label>
              <Textarea
                value={value.referenceStandard.description}
                onChange={(e) => updateReferenceStandard('description', e.target.value)}
                placeholder="Describe the reference standard methodology..."
                rows={2}
                className="mt-1"
              />
            </div>
            
            <div className="space-y-1">
              <SignalingQuestion
                id="rs-correct"
                question="Is the reference standard likely to correctly classify the target condition?"
                value={value.referenceStandard.likelyCorrectClassification}
                onChange={(v) => updateReferenceStandard('likelyCorrectClassification', v)}
              />
              <SignalingQuestion
                id="rs-blinded"
                question="Were the reference standard results interpreted without knowledge of the results of the index test?"
                value={value.referenceStandard.blindedToIndex}
                onChange={(v) => updateReferenceStandard('blindedToIndex', v)}
              />
            </div>

            <div className="mt-4">
              <RiskJudgment
                id="rs-risk"
                label="Could the reference standard, its conduct, or its interpretation have introduced bias?"
                value={value.referenceStandard.riskOfBias}
                onChange={(v) => updateReferenceStandard('riskOfBias', v)}
              />
            </div>
          </div>

          {/* Applicability Section */}
          <div className="pt-4 border-t">
            <h4 className="font-medium text-sm text-gray-900 mb-2">B. Concerns Regarding Applicability</h4>
            <RiskJudgment
              id="rs-applicability"
              label="Is there concern that the target condition as defined by the reference standard does not match the review question?"
              value={value.referenceStandard.applicabilityConcern}
              onChange={(v) => updateReferenceStandard('applicabilityConcern', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* DOMAIN 4: FLOW AND TIMING */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Domain 4: Flow and Timing</CardTitle>
          <CardDescription>
            Could the patient flow have introduced bias?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-sm text-gray-900 mb-2">A. Risk of Bias</h4>
            
            <div className="mb-3">
              <Label className="text-xs text-gray-500">
                Describe any patients who did not receive the index test(s) and/or reference standard or who were excluded from the 2×2 table:
              </Label>
              <Textarea
                value={value.flowAndTiming.excludedPatientsDescription}
                onChange={(e) => updateFlowAndTiming('excludedPatientsDescription', e.target.value)}
                placeholder="Describe excluded patients and reasons..."
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="mb-3">
              <Label className="text-xs text-gray-500">
                Describe the time interval and any interventions between index test(s) and reference standard:
              </Label>
              <Textarea
                value={value.flowAndTiming.timeIntervalDescription}
                onChange={(e) => updateFlowAndTiming('timeIntervalDescription', e.target.value)}
                placeholder="Describe timing between tests..."
                rows={2}
                className="mt-1"
              />
            </div>
            
            <div className="space-y-1">
              <SignalingQuestion
                id="ft-interval"
                question="Was there an appropriate interval between index test(s) and reference standard?"
                value={value.flowAndTiming.appropriateInterval}
                onChange={(v) => updateFlowAndTiming('appropriateInterval', v)}
              />
              <SignalingQuestion
                id="ft-all-received"
                question="Did all patients receive a reference standard?"
                value={value.flowAndTiming.allReceivedReference}
                onChange={(v) => updateFlowAndTiming('allReceivedReference', v)}
              />
              <SignalingQuestion
                id="ft-same-reference"
                question="Did patients receive the same reference standard?"
                value={value.flowAndTiming.sameReferenceStandard}
                onChange={(v) => updateFlowAndTiming('sameReferenceStandard', v)}
              />
              <SignalingQuestion
                id="ft-all-included"
                question="Were all patients included in the analysis?"
                value={value.flowAndTiming.allIncludedInAnalysis}
                onChange={(v) => updateFlowAndTiming('allIncludedInAnalysis', v)}
              />
            </div>

            <div className="mt-4">
              <RiskJudgment
                id="ft-risk"
                label="Could the patient flow have introduced bias?"
                value={value.flowAndTiming.riskOfBias}
                onChange={(v) => updateFlowAndTiming('riskOfBias', v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function createEmptyQUADAS2Data(): QUADAS2Data {
  return {
    patientSelection: {
      description: '',
      consecutiveOrRandom: '',
      caseControlAvoided: '',
      inappropriateExclusionsAvoided: '',
      riskOfBias: '',
      applicabilityDescription: '',
      applicabilityConcern: '',
    },
    indexTest: {
      description: '',
      blindedToReference: '',
      thresholdPreSpecified: '',
      riskOfBias: '',
      applicabilityConcern: '',
    },
    referenceStandard: {
      description: '',
      likelyCorrectClassification: '',
      blindedToIndex: '',
      riskOfBias: '',
      applicabilityConcern: '',
    },
    flowAndTiming: {
      excludedPatientsDescription: '',
      timeIntervalDescription: '',
      appropriateInterval: '',
      allReceivedReference: '',
      sameReferenceStandard: '',
      allIncludedInAnalysis: '',
      riskOfBias: '',
    },
  };
}

export type { QUADAS2Data };
