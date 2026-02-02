'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  TreatmentModifiersData,
  YesNoUnclear,
} from './treatment-validity-rules';

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface TreatmentModifiersProps {
  value: TreatmentModifiersData;
  onChange: (data: TreatmentModifiersData) => void;
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface YesNoUnclearSelectProps {
  label: string;
  value: YesNoUnclear;
  onChange: (value: YesNoUnclear) => void;
  helpText?: string;
}

function YesNoUnclearSelect({ label, value, onChange, helpText }: YesNoUnclearSelectProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-700">{label}</p>
          {helpText && <p className="text-xs text-gray-500 mt-0.5">{helpText}</p>}
        </div>
        <select
          className="w-32 p-1.5 text-sm border rounded-md bg-white"
          value={value}
          onChange={(e) => onChange(e.target.value as YesNoUnclear)}
        >
          <option value="">—</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
          <option value="Unclear">Unclear</option>
        </select>
      </div>
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, isExpanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <Card>
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 py-3"
        onClick={onToggle}
      >
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4 pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TreatmentModifiers({ value, onChange }: TreatmentModifiersProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['population']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="space-y-4">
      {/* Introduction */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Purpose:</strong> These modifiers capture effect-modifier and transportability factors 
          NOT already addressed by the RoB 2 / ROBINS-I instrument. They help assess whether the treatment 
          effect observed in the study will apply to your clinical context.
        </p>
      </div>

      {/* Section 1: Population Spectrum */}
      <CollapsibleSection
        title="1. Population Spectrum & Baseline Characteristics"
        isExpanded={expandedSections.has('population')}
        onToggle={() => toggleSection('population')}
      >
        <YesNoUnclearSelect
          label="Is the baseline risk in the study comparable to your patient population?"
          value={value.populationSpectrum.baselineRiskComparable}
          onChange={(v) => onChange({
            ...value,
            populationSpectrum: { ...value.populationSpectrum, baselineRiskComparable: v }
          })}
          helpText="Different baseline risks can change absolute effect sizes (ARR/NNT)"
        />
        
        <YesNoUnclearSelect
          label="Is the disease severity distribution comparable?"
          value={value.populationSpectrum.severityComparable}
          onChange={(v) => onChange({
            ...value,
            populationSpectrum: { ...value.populationSpectrum, severityComparable: v }
          })}
        />
        
        <YesNoUnclearSelect
          label="Is the comorbidity profile comparable?"
          value={value.populationSpectrum.comorbidityComparable}
          onChange={(v) => onChange({
            ...value,
            populationSpectrum: { ...value.populationSpectrum, comorbidityComparable: v }
          })}
        />
        
        <YesNoUnclearSelect
          label="Is prior treatment history comparable?"
          value={value.populationSpectrum.priorTreatmentComparable}
          onChange={(v) => onChange({
            ...value,
            populationSpectrum: { ...value.populationSpectrum, priorTreatmentComparable: v }
          })}
          helpText="Treatment-naive vs previously treated may respond differently"
        />
        
        <YesNoUnclearSelect
          label="Are results from a restrictive subgroup only?"
          value={value.populationSpectrum.subgroupOnly}
          onChange={(v) => onChange({
            ...value,
            populationSpectrum: { ...value.populationSpectrum, subgroupOnly: v }
          })}
          helpText="Subgroup effects may not generalize"
        />

        <div>
          <Label>Notes</Label>
          <Textarea
            placeholder="Additional observations about population comparability..."
            value={value.populationSpectrum.notes}
            onChange={(e) => onChange({
              ...value,
              populationSpectrum: { ...value.populationSpectrum, notes: e.target.value }
            })}
            className="mt-1"
          />
        </div>
      </CollapsibleSection>

      {/* Section 2: Setting and Care */}
      <CollapsibleSection
        title="2. Clinical Setting & Co-interventions"
        isExpanded={expandedSections.has('setting')}
        onToggle={() => toggleSection('setting')}
      >
        <YesNoUnclearSelect
          label="Is the clinical setting comparable to yours?"
          value={value.settingAndCare.settingComparable}
          onChange={(v) => onChange({
            ...value,
            settingAndCare: { ...value.settingAndCare, settingComparable: v }
          })}
          helpText="Trial vs routine care, academic vs community, etc."
        />
        
        <YesNoUnclearSelect
          label="Are co-interventions likely to differ in your setting?"
          value={value.settingAndCare.coInterventionsLikely}
          onChange={(v) => onChange({
            ...value,
            settingAndCare: { ...value.settingAndCare, coInterventionsLikely: v }
          })}
          helpText="Background treatments, supportive care, etc."
        />
        
        <YesNoUnclearSelect
          label="Is adherence likely to differ from practice?"
          value={value.settingAndCare.adherenceDifferentFromPractice}
          onChange={(v) => onChange({
            ...value,
            settingAndCare: { ...value.settingAndCare, adherenceDifferentFromPractice: v }
          })}
          helpText="Trial adherence often exceeds real-world"
        />
        
        <YesNoUnclearSelect
          label="Is monitoring intensity different from practice?"
          value={value.settingAndCare.monitoringIntensityDifferent}
          onChange={(v) => onChange({
            ...value,
            settingAndCare: { ...value.settingAndCare, monitoringIntensityDifferent: v }
          })}
          helpText="More frequent visits may catch events earlier"
        />
        
        <YesNoUnclearSelect
          label="Is crossover or contamination likely?"
          value={value.settingAndCare.crossoverContaminationLikely}
          onChange={(v) => onChange({
            ...value,
            settingAndCare: { ...value.settingAndCare, crossoverContaminationLikely: v }
          })}
          helpText="Crossover dilutes the treatment effect toward null"
        />

        <div>
          <Label>Notes</Label>
          <Textarea
            placeholder="Additional observations about setting and care..."
            value={value.settingAndCare.notes}
            onChange={(e) => onChange({
              ...value,
              settingAndCare: { ...value.settingAndCare, notes: e.target.value }
            })}
            className="mt-1"
          />
        </div>
      </CollapsibleSection>

      {/* Section 3: Timing and Follow-up */}
      <CollapsibleSection
        title="3. Timing & Follow-up"
        isExpanded={expandedSections.has('timing')}
        onToggle={() => toggleSection('timing')}
      >
        <YesNoUnclearSelect
          label="Is follow-up adequate for the outcome of interest?"
          value={value.timingAndFollowup.followupAdequateForOutcome}
          onChange={(v) => onChange({
            ...value,
            timingAndFollowup: { ...value.timingAndFollowup, followupAdequateForOutcome: v }
          })}
          helpText="Short follow-up may miss late events or treatment effects"
        />
        
        <YesNoUnclearSelect
          label="Is differential follow-up likely?"
          value={value.timingAndFollowup.differentialFollowupLikely}
          onChange={(v) => onChange({
            ...value,
            timingAndFollowup: { ...value.timingAndFollowup, differentialFollowupLikely: v }
          })}
          helpText="Unequal follow-up between groups can bias results"
        />
        
        <YesNoUnclearSelect
          label="Are time-varying treatment effects likely?"
          value={value.timingAndFollowup.timeVaryingEffectsLikely}
          onChange={(v) => onChange({
            ...value,
            timingAndFollowup: { ...value.timingAndFollowup, timeVaryingEffectsLikely: v }
          })}
          helpText="Effects may wane or strengthen over time"
        />
        
        <YesNoUnclearSelect
          label="Are competing risks a concern?"
          value={value.timingAndFollowup.competingRisksLikely}
          onChange={(v) => onChange({
            ...value,
            timingAndFollowup: { ...value.timingAndFollowup, competingRisksLikely: v }
          })}
          helpText="Death from other causes may preclude outcome"
        />

        <div>
          <Label>Notes</Label>
          <Textarea
            placeholder="Additional observations about timing and follow-up..."
            value={value.timingAndFollowup.notes}
            onChange={(e) => onChange({
              ...value,
              timingAndFollowup: { ...value.timingAndFollowup, notes: e.target.value }
            })}
            className="mt-1"
          />
        </div>
      </CollapsibleSection>

      {/* Section 4: Intervention Fidelity */}
      <CollapsibleSection
        title="4. Intervention Fidelity & Implementation"
        isExpanded={expandedSections.has('intervention')}
        onToggle={() => toggleSection('intervention')}
      >
        <YesNoUnclearSelect
          label="Was the intervention standardized?"
          value={value.interventionFidelity.interventionStandardized}
          onChange={(v) => onChange({
            ...value,
            interventionFidelity: { ...value.interventionFidelity, interventionStandardized: v }
          })}
        />
        
        <YesNoUnclearSelect
          label="Is dose/intensity comparable to what you'd use?"
          value={value.interventionFidelity.doseIntensityComparable}
          onChange={(v) => onChange({
            ...value,
            interventionFidelity: { ...value.interventionFidelity, doseIntensityComparable: v }
          })}
        />
        
        <YesNoUnclearSelect
          label="Is delivery expertise comparable?"
          value={value.interventionFidelity.deliveryExpertiseComparable}
          onChange={(v) => onChange({
            ...value,
            interventionFidelity: { ...value.interventionFidelity, deliveryExpertiseComparable: v }
          })}
          helpText="Expert centers may achieve better outcomes"
        />
        
        <YesNoUnclearSelect
          label="Is contamination or spillover a concern?"
          value={value.interventionFidelity.contaminationSpillover}
          onChange={(v) => onChange({
            ...value,
            interventionFidelity: { ...value.interventionFidelity, contaminationSpillover: v }
          })}
        />
        
        <YesNoUnclearSelect
          label="Is implementation quality variable?"
          value={value.interventionFidelity.implementationQualityVariable}
          onChange={(v) => onChange({
            ...value,
            interventionFidelity: { ...value.interventionFidelity, implementationQualityVariable: v }
          })}
        />

        <div>
          <Label>Notes</Label>
          <Textarea
            placeholder="Additional observations about intervention fidelity..."
            value={value.interventionFidelity.notes}
            onChange={(e) => onChange({
              ...value,
              interventionFidelity: { ...value.interventionFidelity, notes: e.target.value }
            })}
            className="mt-1"
          />
        </div>
      </CollapsibleSection>

      {/* Section 5: Outcome Ascertainment */}
      <CollapsibleSection
        title="5. Outcome Ascertainment"
        isExpanded={expandedSections.has('outcome')}
        onToggle={() => toggleSection('outcome')}
      >
        <YesNoUnclearSelect
          label="Does the outcome definition match your practice context?"
          value={value.outcomeAscertainment.outcomeDefinitionMatchesPractice}
          onChange={(v) => onChange({
            ...value,
            outcomeAscertainment: { ...value.outcomeAscertainment, outcomeDefinitionMatchesPractice: v }
          })}
          helpText="Different definitions can yield different event rates"
        />
        
        <YesNoUnclearSelect
          label="Was outcome assessment blinded?"
          value={value.outcomeAscertainment.outcomeAssessmentBlinded}
          onChange={(v) => onChange({
            ...value,
            outcomeAscertainment: { ...value.outcomeAscertainment, outcomeAssessmentBlinded: v }
          })}
        />
        
        <YesNoUnclearSelect
          label="Is the measurement instrument valid for your context?"
          value={value.outcomeAscertainment.measurementInstrumentValid}
          onChange={(v) => onChange({
            ...value,
            outcomeAscertainment: { ...value.outcomeAscertainment, measurementInstrumentValid: v }
          })}
        />
        
        <YesNoUnclearSelect
          label="Is missing outcome data a problem?"
          value={value.outcomeAscertainment.missingOutcomeDataProblem}
          onChange={(v) => onChange({
            ...value,
            outcomeAscertainment: { ...value.outcomeAscertainment, missingOutcomeDataProblem: v }
          })}
        />
        
        <YesNoUnclearSelect
          label="Is outcome switching suspected?"
          value={value.outcomeAscertainment.outcomeSwitchingSuspected}
          onChange={(v) => onChange({
            ...value,
            outcomeAscertainment: { ...value.outcomeAscertainment, outcomeSwitchingSuspected: v }
          })}
          helpText="Changing primary outcome after seeing results"
        />

        <div>
          <Label>Notes</Label>
          <Textarea
            placeholder="Additional observations about outcome ascertainment..."
            value={value.outcomeAscertainment.notes}
            onChange={(e) => onChange({
              ...value,
              outcomeAscertainment: { ...value.outcomeAscertainment, notes: e.target.value }
            })}
            className="mt-1"
          />
        </div>
      </CollapsibleSection>

      {/* Section 6: Analysis & Reporting */}
      <CollapsibleSection
        title="6. Analysis & Reporting"
        isExpanded={expandedSections.has('analysis')}
        onToggle={() => toggleSection('analysis')}
      >
        <YesNoUnclearSelect
          label="Was intention-to-treat (ITT) analysis used?"
          value={value.analysisReporting.ITT_used}
          onChange={(v) => onChange({
            ...value,
            analysisReporting: { ...value.analysisReporting, ITT_used: v }
          })}
        />
        
        <YesNoUnclearSelect
          label="Was per-protocol analysis also reported?"
          value={value.analysisReporting.perProtocol_used}
          onChange={(v) => onChange({
            ...value,
            analysisReporting: { ...value.analysisReporting, perProtocol_used: v }
          })}
          helpText="Per-protocol may better reflect efficacy but risks bias"
        />
        
        <YesNoUnclearSelect
          label="Is the estimate from an adjusted model?"
          value={value.analysisReporting.adjustedModelBasedEstimate}
          onChange={(v) => onChange({
            ...value,
            analysisReporting: { ...value.analysisReporting, adjustedModelBasedEstimate: v }
          })}
        />
        
        <YesNoUnclearSelect
          label="Is selective reporting suspected?"
          value={value.analysisReporting.selectiveReportingSuspected}
          onChange={(v) => onChange({
            ...value,
            analysisReporting: { ...value.analysisReporting, selectiveReportingSuspected: v }
          })}
          helpText="Only favorable outcomes or time points reported"
        />
        
        <YesNoUnclearSelect
          label="Was multiplicity appropriately managed?"
          value={value.analysisReporting.multiplicityManaged}
          onChange={(v) => onChange({
            ...value,
            analysisReporting: { ...value.analysisReporting, multiplicityManaged: v }
          })}
          helpText="Multiple comparisons without adjustment"
        />
        
        <YesNoUnclearSelect
          label="Was clustering appropriately handled?"
          value={value.analysisReporting.clusteringHandled}
          onChange={(v) => onChange({
            ...value,
            analysisReporting: { ...value.analysisReporting, clusteringHandled: v }
          })}
          helpText="Cluster RCTs need appropriate analysis"
        />

        <div>
          <Label>Notes</Label>
          <Textarea
            placeholder="Additional observations about analysis and reporting..."
            value={value.analysisReporting.notes}
            onChange={(e) => onChange({
              ...value,
              analysisReporting: { ...value.analysisReporting, notes: e.target.value }
            })}
            className="mt-1"
          />
        </div>
      </CollapsibleSection>

      {/* Section 7: External Validity */}
      <CollapsibleSection
        title="7. External Validity & Transportability"
        isExpanded={expandedSections.has('external')}
        onToggle={() => toggleSection('external')}
      >
        <YesNoUnclearSelect
          label="Does the baseline risk source match your context?"
          value={value.externalValidity.baselineRiskSourceMatchesUserContext}
          onChange={(v) => onChange({
            ...value,
            externalValidity: { ...value.externalValidity, baselineRiskSourceMatchesUserContext: v }
          })}
          helpText="For calculating ARR/NNT"
        />
        
        <YesNoUnclearSelect
          label="Is effect heterogeneity likely across populations?"
          value={value.externalValidity.effectHeterogeneityLikely}
          onChange={(v) => onChange({
            ...value,
            externalValidity: { ...value.externalValidity, effectHeterogeneityLikely: v }
          })}
          helpText="Effects may vary by patient characteristics"
        />
        
        <YesNoUnclearSelect
          label="Is transportability generally limited?"
          value={value.externalValidity.transportabilityLimited}
          onChange={(v) => onChange({
            ...value,
            externalValidity: { ...value.externalValidity, transportabilityLimited: v }
          })}
          helpText="Consider overall applicability to your setting"
        />

        <div>
          <Label>Notes</Label>
          <Textarea
            placeholder="Additional observations about external validity..."
            value={value.externalValidity.notes}
            onChange={(e) => onChange({
              ...value,
              externalValidity: { ...value.externalValidity, notes: e.target.value }
            })}
            className="mt-1"
          />
        </div>
      </CollapsibleSection>
    </div>
  );
}
