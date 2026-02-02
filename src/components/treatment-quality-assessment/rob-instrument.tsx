'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  InstrumentData,
  ToolUsed,
  YesNoUnclear,
  RoB2Judgment,
  ROBINSIJudgment,
  OverallRiskOfBias,
  RoB2Domains,
  ROBINSIDomains,
  createEmptyRoB2Domains,
  createEmptyROBINSIDomains,
} from './treatment-validity-rules';

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface RoBInstrumentProps {
  value: InstrumentData;
  onChange: (data: InstrumentData) => void;
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface YesNoUnclearRadioProps {
  label: string;
  value: YesNoUnclear;
  onChange: (value: YesNoUnclear) => void;
}

function YesNoUnclearRadio({ label, value, onChange }: YesNoUnclearRadioProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-700">{label}</p>
      <div className="flex gap-4">
        {(['Yes', 'No', 'Unclear'] as const).map((opt) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={label}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

interface RoB2JudgmentRadioProps {
  value: RoB2Judgment;
  onChange: (value: RoB2Judgment) => void;
}

function RoB2JudgmentRadio({ value, onChange }: RoB2JudgmentRadioProps) {
  return (
    <div className="space-y-2 pt-2 border-t">
      <p className="text-sm font-medium text-gray-700">Risk of Bias Judgment:</p>
      <div className="flex gap-4 flex-wrap">
        {[
          { val: 'low', label: 'Low', color: 'bg-green-100 border-green-400 text-green-800' },
          { val: 'some_concerns', label: 'Some Concerns', color: 'bg-yellow-100 border-yellow-400 text-yellow-800' },
          { val: 'high', label: 'High', color: 'bg-red-100 border-red-400 text-red-800' },
        ].map((opt) => (
          <label
            key={opt.val}
            className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded border ${
              value === opt.val ? opt.color : 'bg-gray-50 border-gray-200'
            }`}
          >
            <input
              type="radio"
              checked={value === opt.val}
              onChange={() => onChange(opt.val as RoB2Judgment)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

interface ROBINSIJudgmentRadioProps {
  value: ROBINSIJudgment;
  onChange: (value: ROBINSIJudgment) => void;
}

function ROBINSIJudgmentRadio({ value, onChange }: ROBINSIJudgmentRadioProps) {
  return (
    <div className="space-y-2 pt-2 border-t">
      <p className="text-sm font-medium text-gray-700">Risk of Bias Judgment:</p>
      <div className="flex gap-3 flex-wrap">
        {[
          { val: 'low', label: 'Low', color: 'bg-green-100 border-green-400 text-green-800' },
          { val: 'moderate', label: 'Moderate', color: 'bg-yellow-100 border-yellow-400 text-yellow-800' },
          { val: 'serious', label: 'Serious', color: 'bg-orange-100 border-orange-400 text-orange-800' },
          { val: 'critical', label: 'Critical', color: 'bg-red-100 border-red-400 text-red-800' },
          { val: 'no_information', label: 'No Information', color: 'bg-gray-100 border-gray-400 text-gray-800' },
        ].map((opt) => (
          <label
            key={opt.val}
            className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded border ${
              value === opt.val ? opt.color : 'bg-gray-50 border-gray-200'
            }`}
          >
            <input
              type="radio"
              checked={value === opt.val}
              onChange={() => onChange(opt.val as ROBINSIJudgment)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RoBInstrument({ value, onChange }: RoBInstrumentProps) {
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set(['domain1']));

  const toggleDomain = (domain: string) => {
    const newExpanded = new Set(expandedDomains);
    if (newExpanded.has(domain)) {
      newExpanded.delete(domain);
    } else {
      newExpanded.add(domain);
    }
    setExpandedDomains(newExpanded);
  };

  const handleToolChange = (tool: ToolUsed) => {
    if (tool === 'RoB2') {
      onChange({
        ...value,
        toolUsed: 'RoB2',
        rob2Domains: value.rob2Domains || createEmptyRoB2Domains(),
        robinsiDomains: undefined,
        overallRiskOfBias: '',
      });
    } else {
      onChange({
        ...value,
        toolUsed: 'ROBINS-I',
        rob2Domains: undefined,
        robinsiDomains: value.robinsiDomains || createEmptyROBINSIDomains(),
        overallRiskOfBias: '',
      });
    }
  };

  const updateRoB2Domain = <K extends keyof RoB2Domains>(
    domain: K,
    field: keyof RoB2Domains[K],
    fieldValue: any
  ) => {
    if (!value.rob2Domains) return;
    onChange({
      ...value,
      rob2Domains: {
        ...value.rob2Domains,
        [domain]: {
          ...value.rob2Domains[domain],
          [field]: fieldValue,
        },
      },
    });
  };

  const updateROBINSIDomain = <K extends keyof ROBINSIDomains>(
    domain: K,
    field: keyof ROBINSIDomains[K],
    fieldValue: any
  ) => {
    if (!value.robinsiDomains) return;
    onChange({
      ...value,
      robinsiDomains: {
        ...value.robinsiDomains,
        [domain]: {
          ...value.robinsiDomains[domain],
          [field]: fieldValue,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Tool Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Risk of Bias Tool</CardTitle>
          <CardDescription>
            Choose the appropriate tool based on study design.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleToolChange('RoB2')}
              className={`p-4 text-left border rounded-lg transition-all ${
                value.toolUsed === 'RoB2'
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  value.toolUsed === 'RoB2' ? 'border-blue-500' : 'border-gray-300'
                }`}>
                  {value.toolUsed === 'RoB2' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  )}
                </div>
                <div>
                  <span className="font-medium text-gray-900">RoB 2</span>
                  <p className="text-sm text-gray-500 mt-0.5">For randomized controlled trials</p>
                </div>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => handleToolChange('ROBINS-I')}
              className={`p-4 text-left border rounded-lg transition-all ${
                value.toolUsed === 'ROBINS-I'
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  value.toolUsed === 'ROBINS-I' ? 'border-blue-500' : 'border-gray-300'
                }`}>
                  {value.toolUsed === 'ROBINS-I' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  )}
                </div>
                <div>
                  <span className="font-medium text-gray-900">ROBINS-I</span>
                  <p className="text-sm text-gray-500 mt-0.5">For non-randomized studies of interventions</p>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Notice about official wording */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> The signaling questions and domain structure below follow the {value.toolUsed} framework. 
          For official verbatim wording, please refer to the published {value.toolUsed} tool. 
          This implementation provides structured fields matching the official domains to capture your assessments.
        </p>
      </div>

      {/* RoB 2 Domains */}
      {value.toolUsed === 'RoB2' && value.rob2Domains && (
        <div className="space-y-4">
          {/* Domain 1: Randomization */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => toggleDomain('domain1')}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  Domain 1: Randomization Process
                </CardTitle>
                <div className="flex items-center gap-2">
                  {value.rob2Domains.domain1.judgment && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      value.rob2Domains.domain1.judgment === 'low' ? 'bg-green-100 text-green-800' :
                      value.rob2Domains.domain1.judgment === 'some_concerns' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {value.rob2Domains.domain1.judgment === 'low' ? 'Low' :
                       value.rob2Domains.domain1.judgment === 'some_concerns' ? 'Some Concerns' : 'High'}
                    </span>
                  )}
                  <span className="text-gray-400">{expandedDomains.has('domain1') ? '▼' : '▶'}</span>
                </div>
              </div>
            </CardHeader>
            {expandedDomains.has('domain1') && (
              <CardContent className="space-y-4">
                <div>
                  <Label>Describe the randomization process:</Label>
                  <Textarea
                    placeholder="How was allocation sequence generated? How was allocation concealed?"
                    value={value.rob2Domains.domain1.describeText}
                    onChange={(e) => updateRoB2Domain('domain1', 'describeText', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <YesNoUnclearRadio
                  label="1.1 Was the allocation sequence random?"
                  value={value.rob2Domains.domain1.q1_1_randomSequence}
                  onChange={(v) => updateRoB2Domain('domain1', 'q1_1_randomSequence', v)}
                />
                
                <YesNoUnclearRadio
                  label="1.2 Was the allocation sequence concealed until participants were enrolled and assigned to interventions?"
                  value={value.rob2Domains.domain1.q1_2_allocationConcealed}
                  onChange={(v) => updateRoB2Domain('domain1', 'q1_2_allocationConcealed', v)}
                />
                
                <YesNoUnclearRadio
                  label="1.3 Did baseline differences between intervention groups suggest a problem with the randomization process?"
                  value={value.rob2Domains.domain1.q1_3_baselineDifferences}
                  onChange={(v) => updateRoB2Domain('domain1', 'q1_3_baselineDifferences', v)}
                />

                <RoB2JudgmentRadio
                  value={value.rob2Domains.domain1.judgment}
                  onChange={(v) => updateRoB2Domain('domain1', 'judgment', v)}
                />
              </CardContent>
            )}
          </Card>

          {/* Domain 2: Deviations */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => toggleDomain('domain2')}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  Domain 2: Deviations from Intended Interventions
                </CardTitle>
                <div className="flex items-center gap-2">
                  {value.rob2Domains.domain2.judgment && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      value.rob2Domains.domain2.judgment === 'low' ? 'bg-green-100 text-green-800' :
                      value.rob2Domains.domain2.judgment === 'some_concerns' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {value.rob2Domains.domain2.judgment === 'low' ? 'Low' :
                       value.rob2Domains.domain2.judgment === 'some_concerns' ? 'Some Concerns' : 'High'}
                    </span>
                  )}
                  <span className="text-gray-400">{expandedDomains.has('domain2') ? '▼' : '▶'}</span>
                </div>
              </div>
            </CardHeader>
            {expandedDomains.has('domain2') && (
              <CardContent className="space-y-4">
                <div>
                  <Label>Describe any deviations from intended interventions:</Label>
                  <Textarea
                    placeholder="Describe blinding, deviations, co-interventions..."
                    value={value.rob2Domains.domain2.describeText}
                    onChange={(e) => updateRoB2Domain('domain2', 'describeText', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <YesNoUnclearRadio
                  label="2.1 Were participants aware of their assigned intervention during the trial?"
                  value={value.rob2Domains.domain2.q2_1_participantsAware}
                  onChange={(v) => updateRoB2Domain('domain2', 'q2_1_participantsAware', v)}
                />
                
                <YesNoUnclearRadio
                  label="2.2 Were carers and people delivering the interventions aware of participants' assigned intervention?"
                  value={value.rob2Domains.domain2.q2_2_carersAware}
                  onChange={(v) => updateRoB2Domain('domain2', 'q2_2_carersAware', v)}
                />
                
                <YesNoUnclearRadio
                  label="2.3 Were there deviations from the intended intervention that arose because of the trial context?"
                  value={value.rob2Domains.domain2.q2_3_deviationsDueToContext}
                  onChange={(v) => updateRoB2Domain('domain2', 'q2_3_deviationsDueToContext', v)}
                />
                
                <YesNoUnclearRadio
                  label="2.4 Were these deviations balanced between groups?"
                  value={value.rob2Domains.domain2.q2_4_deviationsBalanced}
                  onChange={(v) => updateRoB2Domain('domain2', 'q2_4_deviationsBalanced', v)}
                />
                
                <YesNoUnclearRadio
                  label="2.5 Was an appropriate analysis used to estimate the effect of assignment to intervention?"
                  value={value.rob2Domains.domain2.q2_5_appropriateAnalysis}
                  onChange={(v) => updateRoB2Domain('domain2', 'q2_5_appropriateAnalysis', v)}
                />

                <RoB2JudgmentRadio
                  value={value.rob2Domains.domain2.judgment}
                  onChange={(v) => updateRoB2Domain('domain2', 'judgment', v)}
                />
              </CardContent>
            )}
          </Card>

          {/* Domain 3: Missing Outcome Data */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => toggleDomain('domain3')}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  Domain 3: Missing Outcome Data
                </CardTitle>
                <div className="flex items-center gap-2">
                  {value.rob2Domains.domain3.judgment && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      value.rob2Domains.domain3.judgment === 'low' ? 'bg-green-100 text-green-800' :
                      value.rob2Domains.domain3.judgment === 'some_concerns' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {value.rob2Domains.domain3.judgment === 'low' ? 'Low' :
                       value.rob2Domains.domain3.judgment === 'some_concerns' ? 'Some Concerns' : 'High'}
                    </span>
                  )}
                  <span className="text-gray-400">{expandedDomains.has('domain3') ? '▼' : '▶'}</span>
                </div>
              </div>
            </CardHeader>
            {expandedDomains.has('domain3') && (
              <CardContent className="space-y-4">
                <div>
                  <Label>Describe missing outcome data:</Label>
                  <Textarea
                    placeholder="How much data was missing? Was it balanced between groups?"
                    value={value.rob2Domains.domain3.describeText}
                    onChange={(e) => updateRoB2Domain('domain3', 'describeText', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <YesNoUnclearRadio
                  label="3.1 Were data for this outcome available for all, or nearly all, participants randomized?"
                  value={value.rob2Domains.domain3.q3_1_outcomeDataAvailable}
                  onChange={(v) => updateRoB2Domain('domain3', 'q3_1_outcomeDataAvailable', v)}
                />
                
                <YesNoUnclearRadio
                  label="3.2 Is there evidence that the result was not biased by missing outcome data?"
                  value={value.rob2Domains.domain3.q3_2_evidenceNotMissing}
                  onChange={(v) => updateRoB2Domain('domain3', 'q3_2_evidenceNotMissing', v)}
                />
                
                <YesNoUnclearRadio
                  label="3.3 Could missingness in the outcome depend on its true value?"
                  value={value.rob2Domains.domain3.q3_3_missingnessCouldDepend}
                  onChange={(v) => updateRoB2Domain('domain3', 'q3_3_missingnessCouldDepend', v)}
                />

                <RoB2JudgmentRadio
                  value={value.rob2Domains.domain3.judgment}
                  onChange={(v) => updateRoB2Domain('domain3', 'judgment', v)}
                />
              </CardContent>
            )}
          </Card>

          {/* Domain 4: Measurement */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => toggleDomain('domain4')}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  Domain 4: Measurement of the Outcome
                </CardTitle>
                <div className="flex items-center gap-2">
                  {value.rob2Domains.domain4.judgment && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      value.rob2Domains.domain4.judgment === 'low' ? 'bg-green-100 text-green-800' :
                      value.rob2Domains.domain4.judgment === 'some_concerns' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {value.rob2Domains.domain4.judgment === 'low' ? 'Low' :
                       value.rob2Domains.domain4.judgment === 'some_concerns' ? 'Some Concerns' : 'High'}
                    </span>
                  )}
                  <span className="text-gray-400">{expandedDomains.has('domain4') ? '▼' : '▶'}</span>
                </div>
              </div>
            </CardHeader>
            {expandedDomains.has('domain4') && (
              <CardContent className="space-y-4">
                <div>
                  <Label>Describe outcome measurement:</Label>
                  <Textarea
                    placeholder="How was the outcome measured? Were assessors blinded?"
                    value={value.rob2Domains.domain4.describeText}
                    onChange={(e) => updateRoB2Domain('domain4', 'describeText', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <YesNoUnclearRadio
                  label="4.1 Was the method of measuring the outcome appropriate?"
                  value={value.rob2Domains.domain4.q4_1_outcomeAppropriate}
                  onChange={(v) => updateRoB2Domain('domain4', 'q4_1_outcomeAppropriate', v)}
                />
                
                <YesNoUnclearRadio
                  label="4.2 Could measurement or ascertainment of the outcome have differed between intervention groups?"
                  value={value.rob2Domains.domain4.q4_2_assessorsAware}
                  onChange={(v) => updateRoB2Domain('domain4', 'q4_2_assessorsAware', v)}
                />
                
                <YesNoUnclearRadio
                  label="4.3 Could assessment of the outcome have been influenced by knowledge of intervention received?"
                  value={value.rob2Domains.domain4.q4_3_assessmentInfluenced}
                  onChange={(v) => updateRoB2Domain('domain4', 'q4_3_assessmentInfluenced', v)}
                />

                <RoB2JudgmentRadio
                  value={value.rob2Domains.domain4.judgment}
                  onChange={(v) => updateRoB2Domain('domain4', 'judgment', v)}
                />
              </CardContent>
            )}
          </Card>

          {/* Domain 5: Selection of Reported Result */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => toggleDomain('domain5')}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  Domain 5: Selection of the Reported Result
                </CardTitle>
                <div className="flex items-center gap-2">
                  {value.rob2Domains.domain5.judgment && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      value.rob2Domains.domain5.judgment === 'low' ? 'bg-green-100 text-green-800' :
                      value.rob2Domains.domain5.judgment === 'some_concerns' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {value.rob2Domains.domain5.judgment === 'low' ? 'Low' :
                       value.rob2Domains.domain5.judgment === 'some_concerns' ? 'Some Concerns' : 'High'}
                    </span>
                  )}
                  <span className="text-gray-400">{expandedDomains.has('domain5') ? '▼' : '▶'}</span>
                </div>
              </div>
            </CardHeader>
            {expandedDomains.has('domain5') && (
              <CardContent className="space-y-4">
                <div>
                  <Label>Describe any concerns about selection of reported result:</Label>
                  <Textarea
                    placeholder="Was a protocol available? Were all planned outcomes reported?"
                    value={value.rob2Domains.domain5.describeText}
                    onChange={(e) => updateRoB2Domain('domain5', 'describeText', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <YesNoUnclearRadio
                  label="5.1 Were the data that produced this result analysed in accordance with a pre-specified analysis plan?"
                  value={value.rob2Domains.domain5.q5_1_resultFromPrespecified}
                  onChange={(v) => updateRoB2Domain('domain5', 'q5_1_resultFromPrespecified', v)}
                />
                
                <YesNoUnclearRadio
                  label="5.2 Is the numerical result being assessed likely to have been selected from multiple outcome measurements?"
                  value={value.rob2Domains.domain5.q5_2_multipleOutcomeMeasurements}
                  onChange={(v) => updateRoB2Domain('domain5', 'q5_2_multipleOutcomeMeasurements', v)}
                />
                
                <YesNoUnclearRadio
                  label="5.3 Is the numerical result being assessed likely to have been selected from multiple analyses?"
                  value={value.rob2Domains.domain5.q5_3_multipleAnalyses}
                  onChange={(v) => updateRoB2Domain('domain5', 'q5_3_multipleAnalyses', v)}
                />

                <RoB2JudgmentRadio
                  value={value.rob2Domains.domain5.judgment}
                  onChange={(v) => updateRoB2Domain('domain5', 'judgment', v)}
                />
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {/* ROBINS-I Domains */}
      {value.toolUsed === 'ROBINS-I' && value.robinsiDomains && (
        <div className="space-y-4">
          {/* Domain 1: Confounding */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => toggleDomain('domain1')}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  Domain 1: Bias Due to Confounding
                </CardTitle>
                <div className="flex items-center gap-2">
                  {value.robinsiDomains.domain1.judgment && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      value.robinsiDomains.domain1.judgment === 'low' ? 'bg-green-100 text-green-800' :
                      value.robinsiDomains.domain1.judgment === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      value.robinsiDomains.domain1.judgment === 'serious' ? 'bg-orange-100 text-orange-800' :
                      value.robinsiDomains.domain1.judgment === 'critical' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {value.robinsiDomains.domain1.judgment.charAt(0).toUpperCase() + value.robinsiDomains.domain1.judgment.slice(1).replace('_', ' ')}
                    </span>
                  )}
                  <span className="text-gray-400">{expandedDomains.has('domain1') ? '▼' : '▶'}</span>
                </div>
              </div>
            </CardHeader>
            {expandedDomains.has('domain1') && (
              <CardContent className="space-y-4">
                <div>
                  <Label>Describe confounding issues:</Label>
                  <Textarea
                    placeholder="What confounders were identified? How were they controlled?"
                    value={value.robinsiDomains.domain1.describeText}
                    onChange={(e) => updateROBINSIDomain('domain1', 'describeText', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <YesNoUnclearRadio
                  label="1.1 Is confounding of the effect unlikely?"
                  value={value.robinsiDomains.domain1.q1_1_confoundersControlled}
                  onChange={(v) => updateROBINSIDomain('domain1', 'q1_1_confoundersControlled', v)}
                />
                
                <YesNoUnclearRadio
                  label="1.2 Were confounding variables measured validly and reliably?"
                  value={value.robinsiDomains.domain1.q1_2_measurementValid}
                  onChange={(v) => updateROBINSIDomain('domain1', 'q1_2_measurementValid', v)}
                />
                
                <YesNoUnclearRadio
                  label="1.3 Were appropriate adjustments made for measured confounders?"
                  value={value.robinsiDomains.domain1.q1_3_adjustmentAppropriate}
                  onChange={(v) => updateROBINSIDomain('domain1', 'q1_3_adjustmentAppropriate', v)}
                />

                <ROBINSIJudgmentRadio
                  value={value.robinsiDomains.domain1.judgment}
                  onChange={(v) => updateROBINSIDomain('domain1', 'judgment', v)}
                />
              </CardContent>
            )}
          </Card>

          {/* Domain 2: Selection */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => toggleDomain('domain2')}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  Domain 2: Selection of Participants
                </CardTitle>
                <div className="flex items-center gap-2">
                  {value.robinsiDomains.domain2.judgment && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      value.robinsiDomains.domain2.judgment === 'low' ? 'bg-green-100 text-green-800' :
                      value.robinsiDomains.domain2.judgment === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      value.robinsiDomains.domain2.judgment === 'serious' ? 'bg-orange-100 text-orange-800' :
                      value.robinsiDomains.domain2.judgment === 'critical' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {value.robinsiDomains.domain2.judgment.charAt(0).toUpperCase() + value.robinsiDomains.domain2.judgment.slice(1).replace('_', ' ')}
                    </span>
                  )}
                  <span className="text-gray-400">{expandedDomains.has('domain2') ? '▼' : '▶'}</span>
                </div>
              </div>
            </CardHeader>
            {expandedDomains.has('domain2') && (
              <CardContent className="space-y-4">
                <div>
                  <Label>Describe participant selection:</Label>
                  <Textarea
                    placeholder="How were participants selected? Was selection related to intervention and outcome?"
                    value={value.robinsiDomains.domain2.describeText}
                    onChange={(e) => updateROBINSIDomain('domain2', 'describeText', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <YesNoUnclearRadio
                  label="2.1 Was selection of participants into the study related to intervention and outcome?"
                  value={value.robinsiDomains.domain2.q2_1_selectionBasedOnCharacteristics}
                  onChange={(v) => updateROBINSIDomain('domain2', 'q2_1_selectionBasedOnCharacteristics', v)}
                />
                
                <YesNoUnclearRadio
                  label="2.2 Do start of follow-up and start of intervention coincide?"
                  value={value.robinsiDomains.domain2.q2_2_startOfFollowupCoincides}
                  onChange={(v) => updateROBINSIDomain('domain2', 'q2_2_startOfFollowupCoincides', v)}
                />
                
                <YesNoUnclearRadio
                  label="2.3 Were adjustment techniques used to correct for selection bias?"
                  value={value.robinsiDomains.domain2.q2_3_adjustmentForSelection}
                  onChange={(v) => updateROBINSIDomain('domain2', 'q2_3_adjustmentForSelection', v)}
                />

                <ROBINSIJudgmentRadio
                  value={value.robinsiDomains.domain2.judgment}
                  onChange={(v) => updateROBINSIDomain('domain2', 'judgment', v)}
                />
              </CardContent>
            )}
          </Card>

          {/* Domain 3: Classification */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => toggleDomain('domain3')}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  Domain 3: Classification of Interventions
                </CardTitle>
                <div className="flex items-center gap-2">
                  {value.robinsiDomains.domain3.judgment && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      value.robinsiDomains.domain3.judgment === 'low' ? 'bg-green-100 text-green-800' :
                      value.robinsiDomains.domain3.judgment === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      value.robinsiDomains.domain3.judgment === 'serious' ? 'bg-orange-100 text-orange-800' :
                      value.robinsiDomains.domain3.judgment === 'critical' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {value.robinsiDomains.domain3.judgment.charAt(0).toUpperCase() + value.robinsiDomains.domain3.judgment.slice(1).replace('_', ' ')}
                    </span>
                  )}
                  <span className="text-gray-400">{expandedDomains.has('domain3') ? '▼' : '▶'}</span>
                </div>
              </div>
            </CardHeader>
            {expandedDomains.has('domain3') && (
              <CardContent className="space-y-4">
                <div>
                  <Label>Describe intervention classification:</Label>
                  <Textarea
                    placeholder="How were interventions defined and classified?"
                    value={value.robinsiDomains.domain3.describeText}
                    onChange={(e) => updateROBINSIDomain('domain3', 'describeText', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <YesNoUnclearRadio
                  label="3.1 Were intervention groups clearly defined?"
                  value={value.robinsiDomains.domain3.q3_1_interventionWellDefined}
                  onChange={(v) => updateROBINSIDomain('domain3', 'q3_1_interventionWellDefined', v)}
                />
                
                <YesNoUnclearRadio
                  label="3.2 Was the information used to define intervention status recorded at the start of the intervention?"
                  value={value.robinsiDomains.domain3.q3_2_informationUsedSame}
                  onChange={(v) => updateROBINSIDomain('domain3', 'q3_2_informationUsedSame', v)}
                />
                
                <YesNoUnclearRadio
                  label="3.3 Could classification of intervention status have been affected by knowledge of the outcome?"
                  value={value.robinsiDomains.domain3.q3_3_classificationAffectedByOutcome}
                  onChange={(v) => updateROBINSIDomain('domain3', 'q3_3_classificationAffectedByOutcome', v)}
                />

                <ROBINSIJudgmentRadio
                  value={value.robinsiDomains.domain3.judgment}
                  onChange={(v) => updateROBINSIDomain('domain3', 'judgment', v)}
                />
              </CardContent>
            )}
          </Card>

          {/* Domain 4: Deviations */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => toggleDomain('domain4')}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  Domain 4: Deviations from Intended Interventions
                </CardTitle>
                <div className="flex items-center gap-2">
                  {value.robinsiDomains.domain4.judgment && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      value.robinsiDomains.domain4.judgment === 'low' ? 'bg-green-100 text-green-800' :
                      value.robinsiDomains.domain4.judgment === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      value.robinsiDomains.domain4.judgment === 'serious' ? 'bg-orange-100 text-orange-800' :
                      value.robinsiDomains.domain4.judgment === 'critical' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {value.robinsiDomains.domain4.judgment.charAt(0).toUpperCase() + value.robinsiDomains.domain4.judgment.slice(1).replace('_', ' ')}
                    </span>
                  )}
                  <span className="text-gray-400">{expandedDomains.has('domain4') ? '▼' : '▶'}</span>
                </div>
              </div>
            </CardHeader>
            {expandedDomains.has('domain4') && (
              <CardContent className="space-y-4">
                <div>
                  <Label>Describe deviations from intended interventions:</Label>
                  <Textarea
                    placeholder="Were there important deviations? Were co-interventions balanced?"
                    value={value.robinsiDomains.domain4.describeText}
                    onChange={(e) => updateROBINSIDomain('domain4', 'describeText', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <YesNoUnclearRadio
                  label="4.1 Were there deviations from the intended intervention beyond what would be expected in usual practice?"
                  value={value.robinsiDomains.domain4.q4_1_deviationsUnbalanced}
                  onChange={(v) => updateROBINSIDomain('domain4', 'q4_1_deviationsUnbalanced', v)}
                />
                
                <YesNoUnclearRadio
                  label="4.2 Were important co-interventions balanced across intervention groups?"
                  value={value.robinsiDomains.domain4.q4_2_importantCointerventions}
                  onChange={(v) => updateROBINSIDomain('domain4', 'q4_2_importantCointerventions', v)}
                />
                
                <YesNoUnclearRadio
                  label="4.3 Was an appropriate analysis used to estimate the effect of starting intervention?"
                  value={value.robinsiDomains.domain4.q4_3_appropriateAnalysis}
                  onChange={(v) => updateROBINSIDomain('domain4', 'q4_3_appropriateAnalysis', v)}
                />

                <ROBINSIJudgmentRadio
                  value={value.robinsiDomains.domain4.judgment}
                  onChange={(v) => updateROBINSIDomain('domain4', 'judgment', v)}
                />
              </CardContent>
            )}
          </Card>

          {/* Domain 5: Missing Data */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => toggleDomain('domain5')}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  Domain 5: Missing Data
                </CardTitle>
                <div className="flex items-center gap-2">
                  {value.robinsiDomains.domain5.judgment && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      value.robinsiDomains.domain5.judgment === 'low' ? 'bg-green-100 text-green-800' :
                      value.robinsiDomains.domain5.judgment === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      value.robinsiDomains.domain5.judgment === 'serious' ? 'bg-orange-100 text-orange-800' :
                      value.robinsiDomains.domain5.judgment === 'critical' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {value.robinsiDomains.domain5.judgment.charAt(0).toUpperCase() + value.robinsiDomains.domain5.judgment.slice(1).replace('_', ' ')}
                    </span>
                  )}
                  <span className="text-gray-400">{expandedDomains.has('domain5') ? '▼' : '▶'}</span>
                </div>
              </div>
            </CardHeader>
            {expandedDomains.has('domain5') && (
              <CardContent className="space-y-4">
                <div>
                  <Label>Describe missing data:</Label>
                  <Textarea
                    placeholder="Were data reasonably complete? Could missingness be related to outcomes?"
                    value={value.robinsiDomains.domain5.describeText}
                    onChange={(e) => updateROBINSIDomain('domain5', 'describeText', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <YesNoUnclearRadio
                  label="5.1 Were outcome data reasonably complete?"
                  value={value.robinsiDomains.domain5.q5_1_dataReasonablyComplete}
                  onChange={(v) => updateROBINSIDomain('domain5', 'q5_1_dataReasonablyComplete', v)}
                />
                
                <YesNoUnclearRadio
                  label="5.2 Was proportion of participants with missing data similar across intervention groups?"
                  value={value.robinsiDomains.domain5.q5_2_missingnessRelated}
                  onChange={(v) => updateROBINSIDomain('domain5', 'q5_2_missingnessRelated', v)}
                />
                
                <YesNoUnclearRadio
                  label="5.3 Were appropriate statistical methods used to account for missing data?"
                  value={value.robinsiDomains.domain5.q5_3_appropriateMethods}
                  onChange={(v) => updateROBINSIDomain('domain5', 'q5_3_appropriateMethods', v)}
                />

                <ROBINSIJudgmentRadio
                  value={value.robinsiDomains.domain5.judgment}
                  onChange={(v) => updateROBINSIDomain('domain5', 'judgment', v)}
                />
              </CardContent>
            )}
          </Card>

          {/* Domain 6: Measurement */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => toggleDomain('domain6')}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  Domain 6: Measurement of Outcomes
                </CardTitle>
                <div className="flex items-center gap-2">
                  {value.robinsiDomains.domain6.judgment && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      value.robinsiDomains.domain6.judgment === 'low' ? 'bg-green-100 text-green-800' :
                      value.robinsiDomains.domain6.judgment === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      value.robinsiDomains.domain6.judgment === 'serious' ? 'bg-orange-100 text-orange-800' :
                      value.robinsiDomains.domain6.judgment === 'critical' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {value.robinsiDomains.domain6.judgment.charAt(0).toUpperCase() + value.robinsiDomains.domain6.judgment.slice(1).replace('_', ' ')}
                    </span>
                  )}
                  <span className="text-gray-400">{expandedDomains.has('domain6') ? '▼' : '▶'}</span>
                </div>
              </div>
            </CardHeader>
            {expandedDomains.has('domain6') && (
              <CardContent className="space-y-4">
                <div>
                  <Label>Describe outcome measurement:</Label>
                  <Textarea
                    placeholder="How were outcomes defined and measured?"
                    value={value.robinsiDomains.domain6.describeText}
                    onChange={(e) => updateROBINSIDomain('domain6', 'describeText', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <YesNoUnclearRadio
                  label="6.1 Could the outcome measure have been influenced by knowledge of the intervention received?"
                  value={value.robinsiDomains.domain6.q6_1_outcomeWellDefined}
                  onChange={(v) => updateROBINSIDomain('domain6', 'q6_1_outcomeWellDefined', v)}
                />
                
                <YesNoUnclearRadio
                  label="6.2 Were outcome assessors aware of the intervention received by study participants?"
                  value={value.robinsiDomains.domain6.q6_2_assessorsAware}
                  onChange={(v) => updateROBINSIDomain('domain6', 'q6_2_assessorsAware', v)}
                />
                
                <YesNoUnclearRadio
                  label="6.3 Were the methods of outcome assessment comparable across intervention groups?"
                  value={value.robinsiDomains.domain6.q6_3_methodsComparable}
                  onChange={(v) => updateROBINSIDomain('domain6', 'q6_3_methodsComparable', v)}
                />
                
                <YesNoUnclearRadio
                  label="6.4 Were any systematic errors in measurement of the outcome related to intervention received?"
                  value={value.robinsiDomains.domain6.q6_4_errorsSystematic}
                  onChange={(v) => updateROBINSIDomain('domain6', 'q6_4_errorsSystematic', v)}
                />

                <ROBINSIJudgmentRadio
                  value={value.robinsiDomains.domain6.judgment}
                  onChange={(v) => updateROBINSIDomain('domain6', 'judgment', v)}
                />
              </CardContent>
            )}
          </Card>

          {/* Domain 7: Selection of Reported Result */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => toggleDomain('domain7')}
            >
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  Domain 7: Selection of Reported Result
                </CardTitle>
                <div className="flex items-center gap-2">
                  {value.robinsiDomains.domain7.judgment && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      value.robinsiDomains.domain7.judgment === 'low' ? 'bg-green-100 text-green-800' :
                      value.robinsiDomains.domain7.judgment === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      value.robinsiDomains.domain7.judgment === 'serious' ? 'bg-orange-100 text-orange-800' :
                      value.robinsiDomains.domain7.judgment === 'critical' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {value.robinsiDomains.domain7.judgment.charAt(0).toUpperCase() + value.robinsiDomains.domain7.judgment.slice(1).replace('_', ' ')}
                    </span>
                  )}
                  <span className="text-gray-400">{expandedDomains.has('domain7') ? '▼' : '▶'}</span>
                </div>
              </div>
            </CardHeader>
            {expandedDomains.has('domain7') && (
              <CardContent className="space-y-4">
                <div>
                  <Label>Describe concerns about selection of reported result:</Label>
                  <Textarea
                    placeholder="Was there evidence of selective reporting?"
                    value={value.robinsiDomains.domain7.describeText}
                    onChange={(e) => updateROBINSIDomain('domain7', 'describeText', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <YesNoUnclearRadio
                  label="7.1 Is the reported effect estimate likely to be selected from multiple outcome measurements?"
                  value={value.robinsiDomains.domain7.q7_1_multipleOutcomeMeasurements}
                  onChange={(v) => updateROBINSIDomain('domain7', 'q7_1_multipleOutcomeMeasurements', v)}
                />
                
                <YesNoUnclearRadio
                  label="7.2 Is the reported effect estimate likely to be selected from multiple analyses?"
                  value={value.robinsiDomains.domain7.q7_2_multipleAnalyses}
                  onChange={(v) => updateROBINSIDomain('domain7', 'q7_2_multipleAnalyses', v)}
                />
                
                <YesNoUnclearRadio
                  label="7.3 Is the reported effect estimate likely to be selected based on the results?"
                  value={value.robinsiDomains.domain7.q7_3_resultLikelySelected}
                  onChange={(v) => updateROBINSIDomain('domain7', 'q7_3_resultLikelySelected', v)}
                />

                <ROBINSIJudgmentRadio
                  value={value.robinsiDomains.domain7.judgment}
                  onChange={(v) => updateROBINSIDomain('domain7', 'judgment', v)}
                />
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {/* Overall Risk of Bias */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Risk of Bias</CardTitle>
          <CardDescription>
            Based on the domain assessments, provide an overall judgment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            {value.toolUsed === 'RoB2' ? (
              <>
                {[
                  { val: 'low', label: 'Low', color: 'bg-green-100 border-green-400 text-green-800' },
                  { val: 'some_concerns', label: 'Some Concerns', color: 'bg-yellow-100 border-yellow-400 text-yellow-800' },
                  { val: 'high', label: 'High', color: 'bg-red-100 border-red-400 text-red-800' },
                ].map((opt) => (
                  <label
                    key={opt.val}
                    className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border-2 ${
                      value.overallRiskOfBias === opt.val ? opt.color : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      checked={value.overallRiskOfBias === opt.val}
                      onChange={() => onChange({ ...value, overallRiskOfBias: opt.val as OverallRiskOfBias })}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">{opt.label}</span>
                  </label>
                ))}
              </>
            ) : (
              <>
                {[
                  { val: 'low', label: 'Low', color: 'bg-green-100 border-green-400 text-green-800' },
                  { val: 'some_concerns', label: 'Moderate', color: 'bg-yellow-100 border-yellow-400 text-yellow-800' },
                  { val: 'high', label: 'Serious', color: 'bg-orange-100 border-orange-400 text-orange-800' },
                  { val: 'critical', label: 'Critical', color: 'bg-red-100 border-red-400 text-red-800' },
                ].map((opt) => (
                  <label
                    key={opt.val}
                    className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border-2 ${
                      value.overallRiskOfBias === opt.val ? opt.color : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      checked={value.overallRiskOfBias === opt.val}
                      onChange={() => onChange({ ...value, overallRiskOfBias: opt.val as OverallRiskOfBias })}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">{opt.label}</span>
                  </label>
                ))}
              </>
            )}
          </div>

          <div>
            <Label>Overall Justification</Label>
            <Textarea
              placeholder="Summarize the rationale for the overall judgment..."
              value={value.freeTextJustifications.overall}
              onChange={(e) => onChange({
                ...value,
                freeTextJustifications: { ...value.freeTextJustifications, overall: e.target.value }
              })}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Additional Notes</Label>
            <Textarea
              placeholder="Any other notes or observations..."
              value={value.freeTextJustifications.notes}
              onChange={(e) => onChange({
                ...value,
                freeTextJustifications: { ...value.freeTextJustifications, notes: e.target.value }
              })}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
