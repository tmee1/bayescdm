'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  TreatmentDataEntry,
  InputSourceType,
  NormalizedData,
  TreatmentMetadata,
  DesignType,
  OutcomeType,
  Directionality,
  BenefitOrHarm,
  OutcomeDefinition,
  OutcomeData,
  OutcomePriority,
  createEmptyTreatmentDataEntry,
  createEmptyOutcomeDefinition,
  createEmptyOutcomeData,
} from '@/components/treatment-quality-assessment/treatment-validity-rules';

// =============================================================================
// TYPES
// =============================================================================

interface TreatmentDataWorkflowProps {
  value: TreatmentDataEntry | null;
  onChange: (data: TreatmentDataEntry) => void;
}

interface Raw2x2Data {
  n_treat: string;
  events_treat: string;
  n_control: string;
  events_control: string;
}

interface EffectOnlyData {
  effectMeasure: 'RR' | 'OR' | 'RD' | '';
  estimate: string;
  ci_low: string;
  ci_high: string;
  se: string;
}

interface HRData {
  hr: string;
  ci_low: string;
  ci_high: string;
  se_logHR: string;
  baseline_survival: string;
}

interface ContinuousMeansData {
  mean_treat: string;
  sd_treat: string;
  n_treat: string;
  mean_control: string;
  sd_control: string;
  n_control: string;
}

// =============================================================================
// COMPUTATION UTILITIES
// =============================================================================

function computeFromRaw2x2(data: Raw2x2Data): Partial<NormalizedData> {
  const n_treat = parseFloat(data.n_treat) || 0;
  const events_treat = parseFloat(data.events_treat) || 0;
  const n_control = parseFloat(data.n_control) || 0;
  const events_control = parseFloat(data.events_control) || 0;

  if (n_treat === 0 || n_control === 0) return {};

  const risk_treat = events_treat / n_treat;
  const risk_control = events_control / n_control;
  const RR = risk_control > 0 ? risk_treat / risk_control : undefined;
  const ARR = risk_control - risk_treat;
  const NNT = ARR !== 0 ? Math.abs(1 / ARR) : undefined;

  return {
    repType: 'A_binary',
    n_treat,
    events_treat,
    n_control,
    events_control,
    effect_measure_reported: 'RR',
    estimate: RR,
  };
}

function computeFromEffectOnly(data: EffectOnlyData): Partial<NormalizedData> {
  const estimate = parseFloat(data.estimate) || undefined;
  const ci_low = parseFloat(data.ci_low) || undefined;
  const ci_high = parseFloat(data.ci_high) || undefined;
  const se = parseFloat(data.se) || undefined;

  let calculatedSE = se;
  if (!calculatedSE && ci_low !== undefined && ci_high !== undefined && estimate !== undefined) {
    if (data.effectMeasure === 'RR' || data.effectMeasure === 'OR') {
      const logHigh = Math.log(ci_high);
      const logLow = Math.log(ci_low);
      calculatedSE = (logHigh - logLow) / (2 * 1.96);
    } else {
      calculatedSE = (ci_high - ci_low) / (2 * 1.96);
    }
  }

  return {
    repType: 'A_binary',
    effect_measure_reported: data.effectMeasure,
    estimate,
    ci_low,
    ci_high,
    se: calculatedSE,
  };
}

function computeFromHR(data: HRData): Partial<NormalizedData> {
  const hr = parseFloat(data.hr) || undefined;
  const ci_low = parseFloat(data.ci_low) || undefined;
  const ci_high = parseFloat(data.ci_high) || undefined;
  let se_logHR = parseFloat(data.se_logHR) || undefined;
  const baseline_survival = parseFloat(data.baseline_survival) || undefined;

  if (!se_logHR && ci_low !== undefined && ci_high !== undefined) {
    se_logHR = (Math.log(ci_high) - Math.log(ci_low)) / (2 * 1.96);
  }

  return {
    repType: 'B_time_to_event',
    effect_measure_reported: 'HR',
    estimate: hr,
    ci_low,
    ci_high,
    logHR: hr ? Math.log(hr) : undefined,
    SE_logHR: se_logHR,
    baseline_control_risk_or_survival: baseline_survival,
  };
}

function computeFromContinuousMeans(data: ContinuousMeansData): Partial<NormalizedData> {
  const mean_treat = parseFloat(data.mean_treat);
  const sd_treat = parseFloat(data.sd_treat);
  const n_treat = parseFloat(data.n_treat) || 0;
  const mean_control = parseFloat(data.mean_control);
  const sd_control = parseFloat(data.sd_control);
  const n_control = parseFloat(data.n_control) || 0;

  const md = !isNaN(mean_treat) && !isNaN(mean_control) ? mean_treat - mean_control : undefined;
  
  let SE_md: number | undefined;
  if (!isNaN(sd_treat) && !isNaN(sd_control) && n_treat > 0 && n_control > 0) {
    SE_md = Math.sqrt((sd_treat ** 2 / n_treat) + (sd_control ** 2 / n_control));
  }

  return {
    repType: 'D_continuous',
    mean_treat: !isNaN(mean_treat) ? mean_treat : undefined,
    sd_treat: !isNaN(sd_treat) ? sd_treat : undefined,
    n_treat_continuous: n_treat || undefined,
    mean_control: !isNaN(mean_control) ? mean_control : undefined,
    sd_control: !isNaN(sd_control) ? sd_control : undefined,
    n_control_continuous: n_control || undefined,
    md,
    SE_md,
    effect_measure_reported: 'MD',
    estimate: md,
  };
}

// =============================================================================
// OUTCOME DATA ENTRY COMPONENT
// =============================================================================

interface OutcomeDataEntryProps {
  outcome: OutcomeDefinition;
  outcomeData: OutcomeData;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateOutcomeData: (updates: Partial<OutcomeData>) => void;
}

function OutcomeDataEntry({ 
  outcome, 
  outcomeData, 
  isExpanded, 
  onToggle, 
  onUpdateOutcomeData 
}: OutcomeDataEntryProps) {
  // Local state for form inputs
  const [raw2x2, setRaw2x2] = useState<Raw2x2Data>({
    n_treat: outcomeData.normalized.n_treat?.toString() || '',
    events_treat: outcomeData.normalized.events_treat?.toString() || '',
    n_control: outcomeData.normalized.n_control?.toString() || '',
    events_control: outcomeData.normalized.events_control?.toString() || '',
  });

  const [effectOnly, setEffectOnly] = useState<EffectOnlyData>({
    effectMeasure: (outcomeData.normalized.effect_measure_reported as any) || '',
    estimate: outcomeData.normalized.estimate?.toString() || '',
    ci_low: outcomeData.normalized.ci_low?.toString() || '',
    ci_high: outcomeData.normalized.ci_high?.toString() || '',
    se: outcomeData.normalized.se?.toString() || '',
  });

  const [hrData, setHRData] = useState<HRData>({
    hr: outcomeData.normalized.estimate?.toString() || '',
    ci_low: outcomeData.normalized.ci_low?.toString() || '',
    ci_high: outcomeData.normalized.ci_high?.toString() || '',
    se_logHR: outcomeData.normalized.SE_logHR?.toString() || '',
    baseline_survival: outcomeData.normalized.baseline_control_risk_or_survival?.toString() || '',
  });

  const [continuousMeans, setContinuousMeans] = useState<ContinuousMeansData>({
    mean_treat: outcomeData.normalized.mean_treat?.toString() || '',
    sd_treat: outcomeData.normalized.sd_treat?.toString() || '',
    n_treat: outcomeData.normalized.n_treat_continuous?.toString() || '',
    mean_control: outcomeData.normalized.mean_control?.toString() || '',
    sd_control: outcomeData.normalized.sd_control?.toString() || '',
    n_control: outcomeData.normalized.n_control_continuous?.toString() || '',
  });

  // Compute normalized data based on source type
  const computedNormalized = useMemo<Partial<NormalizedData> | null>(() => {
    switch (outcomeData.inputSourceType) {
      case 'raw_2x2':
        return computeFromRaw2x2(raw2x2);
      case 'effect_only':
        return computeFromEffectOnly(effectOnly);
      case 'hr':
        return computeFromHR(hrData);
      case 'continuous_means':
        return computeFromContinuousMeans(continuousMeans);
      default:
        return null;
    }
  }, [outcomeData.inputSourceType, raw2x2, effectOnly, hrData, continuousMeans]);

  const formatNum = (n: number | undefined, decimals = 3): string => {
    if (n === undefined || isNaN(n)) return '—';
    return n.toFixed(decimals);
  };

  const saveData = () => {
    if (!computedNormalized) return;
    onUpdateOutcomeData({
      normalized: {
        repType: computedNormalized.repType || 'A_binary',
        ...computedNormalized,
      },
    });
  };

  // Check if data has been entered
  const hasData = computedNormalized && computedNormalized.estimate !== undefined;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header - always visible */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full p-4 text-left flex justify-between items-center transition-colors ${
          isExpanded ? 'bg-blue-50 border-b' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            outcome.priority === 'primary' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {outcome.priority === 'primary' ? 'Primary' : 'Secondary'}
          </span>
          <span className="font-medium text-gray-900">
            {outcome.name || 'Unnamed Outcome'}
          </span>
          <span className="text-sm text-gray-500">
            ({outcome.outcomeType})
          </span>
          {hasData && (
            <span className="text-green-600 text-sm">✓ Data entered</span>
          )}
        </div>
        <span className="text-gray-400 text-lg">{isExpanded ? '▼' : '▶'}</span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-white">
          {/* Data Source Selection */}
          <div>
            <Label className="text-sm font-medium">Data Format</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[
                { value: 'raw_2x2', label: '2×2 Table' },
                { value: 'effect_only', label: 'Effect Only (RR/OR/RD)' },
                { value: 'hr', label: 'Hazard Ratio' },
                { value: 'continuous_means', label: 'Continuous (Means)' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onUpdateOutcomeData({ inputSourceType: option.value as InputSourceType })}
                  className={`p-2 text-sm border rounded-lg transition-all ${
                    outcomeData.inputSourceType === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Data Entry Forms */}
          {outcomeData.inputSourceType === 'raw_2x2' && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div></div>
                <div className="text-center font-medium text-gray-700 p-2">Intervention</div>
                <div className="text-center font-medium text-gray-700 p-2">Control</div>
                
                <div className="font-medium text-gray-700 p-2 flex items-center">Events</div>
                <Input
                  type="number"
                  placeholder="Events"
                  value={raw2x2.events_treat}
                  onChange={(e) => setRaw2x2({ ...raw2x2, events_treat: e.target.value })}
                  className="text-center"
                />
                <Input
                  type="number"
                  placeholder="Events"
                  value={raw2x2.events_control}
                  onChange={(e) => setRaw2x2({ ...raw2x2, events_control: e.target.value })}
                  className="text-center"
                />
                
                <div className="font-medium text-gray-700 p-2 flex items-center">Total N</div>
                <Input
                  type="number"
                  placeholder="N"
                  value={raw2x2.n_treat}
                  onChange={(e) => setRaw2x2({ ...raw2x2, n_treat: e.target.value })}
                  className="text-center"
                />
                <Input
                  type="number"
                  placeholder="N"
                  value={raw2x2.n_control}
                  onChange={(e) => setRaw2x2({ ...raw2x2, n_control: e.target.value })}
                  className="text-center"
                />
              </div>
            </div>
          )}

          {outcomeData.inputSourceType === 'effect_only' && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div>
                <Label className="text-sm">Effect Measure</Label>
                <select
                  className="w-full mt-1 p-2 border rounded-md text-sm"
                  value={effectOnly.effectMeasure}
                  onChange={(e) => setEffectOnly({ ...effectOnly, effectMeasure: e.target.value as any })}
                >
                  <option value="">Select...</option>
                  <option value="RR">Relative Risk (RR)</option>
                  <option value="OR">Odds Ratio (OR)</option>
                  <option value="RD">Risk Difference (RD)</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-sm">Estimate</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g., 0.75"
                    value={effectOnly.estimate}
                    onChange={(e) => setEffectOnly({ ...effectOnly, estimate: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm">95% CI Lower</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g., 0.60"
                    value={effectOnly.ci_low}
                    onChange={(e) => setEffectOnly({ ...effectOnly, ci_low: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm">95% CI Upper</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g., 0.94"
                    value={effectOnly.ci_high}
                    onChange={(e) => setEffectOnly({ ...effectOnly, ci_high: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {outcomeData.inputSourceType === 'hr' && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-sm">Hazard Ratio</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g., 0.80"
                    value={hrData.hr}
                    onChange={(e) => setHRData({ ...hrData, hr: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm">95% CI Lower</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g., 0.65"
                    value={hrData.ci_low}
                    onChange={(e) => setHRData({ ...hrData, ci_low: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm">95% CI Upper</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g., 0.98"
                    value={hrData.ci_high}
                    onChange={(e) => setHRData({ ...hrData, ci_high: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm">Control Baseline Survival (optional)</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g., 0.90 for 90% survival"
                  value={hrData.baseline_survival}
                  onChange={(e) => setHRData({ ...hrData, baseline_survival: e.target.value })}
                />
              </div>
            </div>
          )}

          {outcomeData.inputSourceType === 'continuous_means' && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div></div>
                <div className="text-center font-medium text-gray-700 p-2">Intervention</div>
                <div className="text-center font-medium text-gray-700 p-2">Control</div>
                
                <div className="font-medium text-gray-700 p-2 flex items-center">Mean</div>
                <Input
                  type="number"
                  step="any"
                  placeholder="Mean"
                  value={continuousMeans.mean_treat}
                  onChange={(e) => setContinuousMeans({ ...continuousMeans, mean_treat: e.target.value })}
                  className="text-center"
                />
                <Input
                  type="number"
                  step="any"
                  placeholder="Mean"
                  value={continuousMeans.mean_control}
                  onChange={(e) => setContinuousMeans({ ...continuousMeans, mean_control: e.target.value })}
                  className="text-center"
                />
                
                <div className="font-medium text-gray-700 p-2 flex items-center">SD</div>
                <Input
                  type="number"
                  step="any"
                  placeholder="SD"
                  value={continuousMeans.sd_treat}
                  onChange={(e) => setContinuousMeans({ ...continuousMeans, sd_treat: e.target.value })}
                  className="text-center"
                />
                <Input
                  type="number"
                  step="any"
                  placeholder="SD"
                  value={continuousMeans.sd_control}
                  onChange={(e) => setContinuousMeans({ ...continuousMeans, sd_control: e.target.value })}
                  className="text-center"
                />
                
                <div className="font-medium text-gray-700 p-2 flex items-center">N</div>
                <Input
                  type="number"
                  placeholder="N"
                  value={continuousMeans.n_treat}
                  onChange={(e) => setContinuousMeans({ ...continuousMeans, n_treat: e.target.value })}
                  className="text-center"
                />
                <Input
                  type="number"
                  placeholder="N"
                  value={continuousMeans.n_control}
                  onChange={(e) => setContinuousMeans({ ...continuousMeans, n_control: e.target.value })}
                  className="text-center"
                />
              </div>
            </div>
          )}

          {/* Baseline Risk */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <Label className="text-sm font-medium">Baseline Risk (for absolute effects)</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <Label className="text-xs text-gray-500">Source</Label>
                <select
                  className="w-full mt-1 p-2 border rounded-md text-sm"
                  value={outcomeData.baselineRisk.source}
                  onChange={(e) => onUpdateOutcomeData({
                    baselineRisk: { ...outcomeData.baselineRisk, source: e.target.value as any }
                  })}
                >
                  <option value="study_control">From study control group</option>
                  <option value="external">External source</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Value</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g., 0.15 for 15%"
                  value={outcomeData.baselineRisk.valueAtHorizon ?? ''}
                  onChange={(e) => onUpdateOutcomeData({
                    baselineRisk: { 
                      ...outcomeData.baselineRisk, 
                      valueAtHorizon: e.target.value ? parseFloat(e.target.value) : null 
                    }
                  })}
                />
              </div>
            </div>
          </div>

          {/* Computed Results Preview */}
          {hasData && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-blue-600">Computed: </span>
                  <span className="font-medium text-blue-900">
                    {computedNormalized?.effect_measure_reported} = {formatNum(computedNormalized?.estimate)}
                  </span>
                  {computedNormalized?.ci_low !== undefined && computedNormalized?.ci_high !== undefined && (
                    <span className="text-blue-700 text-sm ml-2">
                      (95% CI: {formatNum(computedNormalized.ci_low)} – {formatNum(computedNormalized.ci_high)})
                    </span>
                  )}
                </div>
                <Button size="sm" onClick={saveData}>
                  Save Data
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TreatmentDataWorkflow({ value, onChange }: TreatmentDataWorkflowProps) {
  const dataEntry = value || createEmptyTreatmentDataEntry();
  
  // Track which outcome sections are expanded
  const [expandedOutcomes, setExpandedOutcomes] = useState<Set<string>>(
    new Set(dataEntry.outcomes.map(o => o.id)) // Start with all expanded
  );

  const toggleOutcome = (outcomeId: string) => {
    const newExpanded = new Set(expandedOutcomes);
    if (newExpanded.has(outcomeId)) {
      newExpanded.delete(outcomeId);
    } else {
      newExpanded.add(outcomeId);
    }
    setExpandedOutcomes(newExpanded);
  };

  // Helper functions
  const updateMetadata = (updates: Partial<TreatmentMetadata>) => {
    onChange({
      ...dataEntry,
      metadata: { ...dataEntry.metadata, ...updates },
    });
  };

  const addOutcome = (priority: OutcomePriority) => {
    const newOutcome = createEmptyOutcomeDefinition(priority);
    const newOutcomeData = createEmptyOutcomeData(newOutcome.id);
    setExpandedOutcomes(prev => new Set([...Array.from(prev), newOutcome.id]));
    onChange({
      ...dataEntry,
      outcomes: [...dataEntry.outcomes, newOutcome],
      outcomeData: [...dataEntry.outcomeData, newOutcomeData],
    });
  };

  const removeOutcome = (outcomeId: string) => {
    if (dataEntry.outcomes.length <= 1) return;
    onChange({
      ...dataEntry,
      outcomes: dataEntry.outcomes.filter(o => o.id !== outcomeId),
      outcomeData: dataEntry.outcomeData.filter(od => od.outcomeId !== outcomeId),
    });
  };

  const updateOutcome = (outcomeId: string, updates: Partial<OutcomeDefinition>) => {
    onChange({
      ...dataEntry,
      outcomes: dataEntry.outcomes.map(o => 
        o.id === outcomeId ? { ...o, ...updates } : o
      ),
    });
  };

  const updateOutcomeData = (outcomeId: string, updates: Partial<OutcomeData>) => {
    onChange({
      ...dataEntry,
      outcomeData: dataEntry.outcomeData.map(od =>
        od.outcomeId === outcomeId ? { ...od, ...updates } : od
      ),
    });
  };

  const primaryOutcomes = dataEntry.outcomes.filter(o => o.priority === 'primary');
  const secondaryOutcomes = dataEntry.outcomes.filter(o => o.priority === 'secondary');

  return (
    <div className="space-y-6">
      {/* STEP 1: Study Design Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Study Design</CardTitle>
          <CardDescription>
            Basic study design information. (Population, intervention, and comparator are captured in PICO.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Study Design *</Label>
              <select
                className="w-full mt-1 p-2 border rounded-md"
                value={dataEntry.metadata.designType}
                onChange={(e) => updateMetadata({ designType: e.target.value as DesignType })}
              >
                <option value="RCT">Randomized Controlled Trial</option>
                <option value="observational">Observational Study</option>
                <option value="quasi_experimental">Quasi-Experimental</option>
              </select>
            </div>
            <div>
              <Label>Setting</Label>
              <Input
                placeholder="e.g., Multi-center, outpatient clinics"
                value={dataEntry.metadata.settingText}
                onChange={(e) => updateMetadata({ settingText: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Follow-up Duration</Label>
              <Input
                placeholder="e.g., 5 years, 12 months"
                value={dataEntry.metadata.followUp}
                onChange={(e) => updateMetadata({ followUp: e.target.value })}
              />
            </div>
            <div>
              <Label>Time Horizon for Analysis</Label>
              <Input
                placeholder="e.g., 1 year, lifetime"
                value={dataEntry.metadata.timeHorizon}
                onChange={(e) => updateMetadata({ timeHorizon: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* STEP 2: Define Outcomes */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Define Outcomes</CardTitle>
          <CardDescription>
            Define the primary and secondary outcomes from the study.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Outcomes */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-base font-semibold">Primary Outcomes</Label>
              <Button variant="outline" size="sm" onClick={() => addOutcome('primary')}>
                + Add Primary
              </Button>
            </div>
            <div className="space-y-2">
              {primaryOutcomes.map((outcome) => (
                <div key={outcome.id} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-4 gap-2">
                      <Input
                        placeholder="Outcome name (e.g., Death)"
                        value={outcome.name}
                        onChange={(e) => updateOutcome(outcome.id, { name: e.target.value })}
                        className="text-sm"
                      />
                      <select
                        className="p-2 border rounded-md text-sm bg-white"
                        value={outcome.outcomeType}
                        onChange={(e) => updateOutcome(outcome.id, { outcomeType: e.target.value as OutcomeType })}
                      >
                        <option value="binary">Binary</option>
                        <option value="time_to_event">Time-to-Event</option>
                        <option value="continuous">Continuous</option>
                        <option value="rate">Rate</option>
                        <option value="categorical">Categorical</option>
                      </select>
                      <select
                        className="p-2 border rounded-md text-sm bg-white"
                        value={outcome.directionality}
                        onChange={(e) => updateOutcome(outcome.id, { directionality: e.target.value as Directionality })}
                      >
                        <option value="lower_better">Lower is better</option>
                        <option value="higher_better">Higher is better</option>
                      </select>
                      <select
                        className="p-2 border rounded-md text-sm bg-white"
                        value={outcome.benefitOrHarm}
                        onChange={(e) => updateOutcome(outcome.id, { benefitOrHarm: e.target.value as BenefitOrHarm })}
                      >
                        <option value="benefit">Benefit</option>
                        <option value="harm">Harm</option>
                      </select>
                    </div>
                    {primaryOutcomes.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeOutcome(outcome.id)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {primaryOutcomes.length === 0 && (
                <p className="text-sm text-gray-500 italic py-2">No primary outcomes defined. Click "+ Add Primary" to add one.</p>
              )}
            </div>
          </div>

          {/* Secondary Outcomes */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-base font-semibold">Secondary Outcomes</Label>
              <Button variant="outline" size="sm" onClick={() => addOutcome('secondary')}>
                + Add Secondary
              </Button>
            </div>
            <div className="space-y-2">
              {secondaryOutcomes.map((outcome) => (
                <div key={outcome.id} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-4 gap-2">
                      <Input
                        placeholder="Outcome name (e.g., MACE)"
                        value={outcome.name}
                        onChange={(e) => updateOutcome(outcome.id, { name: e.target.value })}
                        className="text-sm"
                      />
                      <select
                        className="p-2 border rounded-md text-sm bg-white"
                        value={outcome.outcomeType}
                        onChange={(e) => updateOutcome(outcome.id, { outcomeType: e.target.value as OutcomeType })}
                      >
                        <option value="binary">Binary</option>
                        <option value="time_to_event">Time-to-Event</option>
                        <option value="continuous">Continuous</option>
                        <option value="rate">Rate</option>
                        <option value="categorical">Categorical</option>
                      </select>
                      <select
                        className="p-2 border rounded-md text-sm bg-white"
                        value={outcome.directionality}
                        onChange={(e) => updateOutcome(outcome.id, { directionality: e.target.value as Directionality })}
                      >
                        <option value="lower_better">Lower is better</option>
                        <option value="higher_better">Higher is better</option>
                      </select>
                      <select
                        className="p-2 border rounded-md text-sm bg-white"
                        value={outcome.benefitOrHarm}
                        onChange={(e) => updateOutcome(outcome.id, { benefitOrHarm: e.target.value as BenefitOrHarm })}
                      >
                        <option value="benefit">Benefit</option>
                        <option value="harm">Harm</option>
                      </select>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeOutcome(outcome.id)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
              {secondaryOutcomes.length === 0 && (
                <p className="text-sm text-gray-500 italic py-2">No secondary outcomes defined (optional).</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* STEP 3: Enter Data for Each Outcome */}
      <Card>
        <CardHeader>
          <CardTitle>Step 3: Enter Data for Each Outcome</CardTitle>
          <CardDescription>
            Expand each outcome below to enter its effect data. All outcomes defined in Step 2 are listed here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {dataEntry.outcomes.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 text-center">
              No outcomes defined. Please add outcomes in Step 2 first.
            </p>
          ) : (
            <>
              {/* Primary Outcomes Data Entry */}
              {primaryOutcomes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Primary Outcomes</p>
                  {primaryOutcomes.map((outcome) => {
                    const outcomeData = dataEntry.outcomeData.find(od => od.outcomeId === outcome.id);
                    if (!outcomeData) return null;
                    return (
                      <OutcomeDataEntry
                        key={outcome.id}
                        outcome={outcome}
                        outcomeData={outcomeData}
                        isExpanded={expandedOutcomes.has(outcome.id)}
                        onToggle={() => toggleOutcome(outcome.id)}
                        onUpdateOutcomeData={(updates) => updateOutcomeData(outcome.id, updates)}
                      />
                    );
                  })}
                </div>
              )}

              {/* Secondary Outcomes Data Entry */}
              {secondaryOutcomes.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Secondary Outcomes</p>
                  {secondaryOutcomes.map((outcome) => {
                    const outcomeData = dataEntry.outcomeData.find(od => od.outcomeId === outcome.id);
                    if (!outcomeData) return null;
                    return (
                      <OutcomeDataEntry
                        key={outcome.id}
                        outcome={outcome}
                        outcomeData={outcomeData}
                        isExpanded={expandedOutcomes.has(outcome.id)}
                        onToggle={() => toggleOutcome(outcome.id)}
                        onUpdateOutcomeData={(updates) => updateOutcomeData(outcome.id, updates)}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
