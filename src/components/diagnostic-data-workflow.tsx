'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

// =============================================================================
// TYPES
// =============================================================================

export type InputSourceType =
  | '2x2_table'
  | 'sensitivity_specificity_single_cutoff'
  | 'roc_or_multiple_cutoffs_table'
  | 'per_bin_counts_table'
  | 'roc_curve_image_digitized';

export type Directionality = 'higher_more_positive' | 'lower_more_positive';

export interface GlobalMetadata {
  diseaseDefinition: string;
  indexTestName: string;
  directionality: Directionality;
  nDiseasePositive: string;
  nDiseaseNegative: string;
}

export interface TwoByTwoData {
  tp: string;
  fp: string;
  fn: string;
  tn: string;
  cutoffLabel: string;
}

export interface SensSpecData {
  cutoffValue: string;
  sensitivity: string;
  specificity: string;
}

export interface ROCTableRow {
  cutoffValue: string;
  sensitivity: string;
  specificity: string;
}

export interface PerBinRow {
  binLabel: string;
  tp: string;
  fp: string;
  fn: string;
  tn: string;
}

export interface ComputedLR {
  binLabel: string;
  lr: number | null;
  lrPositive?: number | null;
  lrNegative?: number | null;
  warning?: string;
}

export interface DiagnosticDataOutput {
  sourceType: InputSourceType;
  metadata: GlobalMetadata;
  results: ComputedLR[];
  warnings: string[];
}

interface DiagnosticDataWorkflowProps {
  value: DiagnosticDataOutput | null;
  directionality: Directionality;
  onChange: (data: DiagnosticDataOutput) => void;
}

// =============================================================================
// COMPUTATION UTILITIES
// =============================================================================

function computeLRFromSensSpec(
  sensitivity: number,
  specificity: number,
  useContinuityCorrection: boolean = false
): { lrPositive: number | null; lrNegative: number | null; warnings: string[] } {
  const warnings: string[] = [];
  let lrPositive: number | null = null;
  let lrNegative: number | null = null;

  const fpr = 1 - specificity; // False positive rate
  const fnr = 1 - sensitivity; // False negative rate

  // LR+ = sensitivity / (1 - specificity) = sensitivity / FPR
  if (fpr === 0) {
    if (useContinuityCorrection) {
      warnings.push('Applied continuity correction for LR+ (specificity = 100%)');
      lrPositive = sensitivity / 0.005; // Small correction
    } else {
      lrPositive = Infinity;
      warnings.push('LR+ = ∞ (specificity = 100%)');
    }
  } else {
    lrPositive = sensitivity / fpr;
  }

  // LR- = (1 - sensitivity) / specificity = FNR / specificity
  if (specificity === 0) {
    if (useContinuityCorrection) {
      warnings.push('Applied continuity correction for LR- (specificity = 0%)');
      lrNegative = fnr / 0.005;
    } else {
      lrNegative = Infinity;
      warnings.push('LR- denominator is 0 (specificity = 0%)');
    }
  } else {
    lrNegative = fnr / specificity;
  }

  return { lrPositive, lrNegative, warnings };
}

function computeLRFrom2x2(
  tp: number,
  fp: number,
  fn: number,
  tn: number,
  useContinuityCorrection: boolean = false
): { lrPositive: number | null; lrNegative: number | null; sensitivity: number; specificity: number; warnings: string[] } {
  const warnings: string[] = [];
  
  let adjTp = tp, adjFp = fp, adjFn = fn, adjTn = tn;
  
  // Apply continuity correction if any cell is 0
  if (useContinuityCorrection && (tp === 0 || fp === 0 || fn === 0 || tn === 0)) {
    adjTp += 0.5;
    adjFp += 0.5;
    adjFn += 0.5;
    adjTn += 0.5;
    warnings.push('Applied continuity correction (+0.5 to all cells)');
  }

  const diseasePositive = adjTp + adjFn;
  const diseaseNegative = adjFp + adjTn;

  if (diseasePositive === 0) {
    warnings.push('No disease-positive cases (TP + FN = 0)');
    return { lrPositive: null, lrNegative: null, sensitivity: 0, specificity: 0, warnings };
  }
  if (diseaseNegative === 0) {
    warnings.push('No disease-negative cases (FP + TN = 0)');
    return { lrPositive: null, lrNegative: null, sensitivity: 0, specificity: 0, warnings };
  }

  const sensitivity = adjTp / diseasePositive;
  const specificity = adjTn / diseaseNegative;

  const result = computeLRFromSensSpec(sensitivity, specificity, useContinuityCorrection);

  return {
    ...result,
    sensitivity,
    specificity,
    warnings: [...warnings, ...result.warnings],
  };
}

function computeIntervalLRsFromROC(
  rows: { cutoff: string; tpr: number; fpr: number }[],
  directionality: Directionality
): ComputedLR[] {
  if (rows.length === 0) return [];

  // Sort by cutoff based on directionality
  const sorted = [...rows].sort((a, b) => {
    const aVal = parseFloat(a.cutoff) || 0;
    const bVal = parseFloat(b.cutoff) || 0;
    return directionality === 'higher_more_positive' ? aVal - bVal : bVal - aVal;
  });

  const results: ComputedLR[] = [];

  // Low bin (below lowest threshold)
  const first = sorted[0];
  if (first.tpr < 1 || first.fpr < 1) {
    const pDplus = 1 - first.tpr;
    const pDminus = 1 - first.fpr;
    const lr = pDminus === 0 ? (pDplus === 0 ? null : Infinity) : pDplus / pDminus;
    results.push({
      binLabel: directionality === 'higher_more_positive' 
        ? `< ${first.cutoff}` 
        : `> ${first.cutoff}`,
      lr,
      warning: pDminus === 0 ? 'Division by zero' : undefined,
    });
  }

  // Interval bins
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    
    const pDplus = current.tpr - next.tpr;
    const pDminus = current.fpr - next.fpr;
    
    let lr: number | null = null;
    let warning: string | undefined;
    
    if (pDminus === 0) {
      lr = pDplus === 0 ? null : Infinity;
      warning = 'Division by zero in interval';
    } else if (pDminus < 0 || pDplus < 0) {
      warning = 'Negative probability (data may not be monotonic)';
      lr = null;
    } else {
      lr = pDplus / pDminus;
    }

    results.push({
      binLabel: `${current.cutoff} – ${next.cutoff}`,
      lr,
      warning,
    });
  }

  // High bin (above highest threshold)
  const last = sorted[sorted.length - 1];
  if (last.tpr > 0 || last.fpr > 0) {
    const lr = last.fpr === 0 ? (last.tpr === 0 ? null : Infinity) : last.tpr / last.fpr;
    results.push({
      binLabel: directionality === 'higher_more_positive'
        ? `≥ ${last.cutoff}`
        : `≤ ${last.cutoff}`,
      lr,
      warning: last.fpr === 0 && last.tpr > 0 ? 'Division by zero' : undefined,
    });
  }

  return results;
}

function computeLRsFromBinCounts(
  rows: { binLabel: string; tp: number; fp: number; fn: number; tn: number }[],
  useContinuityCorrection: boolean = false
): ComputedLR[] {
  return rows.map((row) => {
    const result = computeLRFrom2x2(row.tp, row.fp, row.fn, row.tn, useContinuityCorrection);
    return {
      binLabel: row.binLabel,
      lr: result.lrPositive, // Use LR+ as the primary LR for bin
      lrPositive: result.lrPositive,
      lrNegative: result.lrNegative,
      warning: result.warnings.length > 0 ? result.warnings.join('; ') : undefined,
    };
  });
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DiagnosticDataWorkflow({ value, directionality, onChange }: DiagnosticDataWorkflowProps) {
  // Source type selection
  const [sourceType, setSourceType] = useState<InputSourceType | null>(
    value?.sourceType || null
  );

  // 2x2 table data
  const [twoByTwo, setTwoByTwo] = useState<TwoByTwoData>({
    tp: '',
    fp: '',
    fn: '',
    tn: '',
    cutoffLabel: '',
  });

  // Sensitivity/specificity data
  const [sensSpec, setSensSpec] = useState<SensSpecData>({
    cutoffValue: '',
    sensitivity: '',
    specificity: '',
  });

  // ROC table data
  const [rocRows, setRocRows] = useState<ROCTableRow[]>([
    { cutoffValue: '', sensitivity: '', specificity: '' },
  ]);
  const [rocOutputMode, setRocOutputMode] = useState<'single' | 'interval'>('interval');
  const [selectedRocRow, setSelectedRocRow] = useState<number>(0);

  // Per-bin counts data (each bin has its own 2x2 table)
  const [binRows, setBinRows] = useState<PerBinRow[]>([
    { binLabel: '', tp: '', fp: '', fn: '', tn: '' },
  ]);

  // Digitized ROC data
  const [digitizedRows, setDigitizedRows] = useState<{ fpr: string; tpr: string }[]>([
    { fpr: '', tpr: '' },
  ]);

  // Settings
  const [useContinuityCorrection, setUseContinuityCorrection] = useState(false);

  // Computed results
  const computedResults = useMemo(() => {
    const warnings: string[] = [];
    let results: ComputedLR[] = [];

    if (!sourceType) return null;

    switch (sourceType) {
      case '2x2_table': {
        const tp = parseFloat(twoByTwo.tp) || 0;
        const fp = parseFloat(twoByTwo.fp) || 0;
        const fn = parseFloat(twoByTwo.fn) || 0;
        const tn = parseFloat(twoByTwo.tn) || 0;

        if (tp + fp + fn + tn === 0) return null;

        const result = computeLRFrom2x2(tp, fp, fn, tn, useContinuityCorrection);
        warnings.push(...result.warnings);
        
        results = [{
          binLabel: twoByTwo.cutoffLabel || 'Binary result',
          lrPositive: result.lrPositive,
          lrNegative: result.lrNegative,
        }];
        break;
      }

      case 'sensitivity_specificity_single_cutoff': {
        const sens = parseFloat(sensSpec.sensitivity);
        const spec = parseFloat(sensSpec.specificity);

        if (isNaN(sens) || isNaN(spec)) return null;

        // Convert percentages if > 1
        const sensNorm = sens > 1 ? sens / 100 : sens;
        const specNorm = spec > 1 ? spec / 100 : spec;

        const result = computeLRFromSensSpec(sensNorm, specNorm, useContinuityCorrection);
        warnings.push(...result.warnings);

        results = [{
          binLabel: sensSpec.cutoffValue || 'Single cutoff',
          lr: result.lrPositive,
          lrPositive: result.lrPositive,
          lrNegative: result.lrNegative,
        }];
        break;
      }

      case 'roc_or_multiple_cutoffs_table': {
        const validRows = rocRows
          .filter(r => r.cutoffValue && (r.sensitivity || r.specificity))
          .map(r => {
            let sens = parseFloat(r.sensitivity);
            let spec = parseFloat(r.specificity);
            // Convert percentages
            if (sens > 1) sens /= 100;
            if (spec > 1) spec /= 100;
            return {
              cutoff: r.cutoffValue,
              tpr: sens,
              fpr: 1 - spec,
            };
          });

        if (validRows.length === 0) return null;

        if (rocOutputMode === 'single' && validRows[selectedRocRow]) {
          const row = validRows[selectedRocRow];
          const sens = row.tpr;
          const spec = 1 - row.fpr;
          const result = computeLRFromSensSpec(sens, spec, useContinuityCorrection);
          warnings.push(...result.warnings);
          results = [{
            binLabel: row.cutoff,
            lr: result.lrPositive,
            lrPositive: result.lrPositive,
            lrNegative: result.lrNegative,
          }];
        } else {
          results = computeIntervalLRsFromROC(validRows, directionality);
        }
        break;
      }

      case 'per_bin_counts_table': {
        const validRows = binRows
          .filter(r => r.binLabel && (r.tp || r.fp || r.fn || r.tn))
          .map(r => ({
            binLabel: r.binLabel,
            tp: parseFloat(r.tp) || 0,
            fp: parseFloat(r.fp) || 0,
            fn: parseFloat(r.fn) || 0,
            tn: parseFloat(r.tn) || 0,
          }));

        if (validRows.length === 0) return null;

        results = computeLRsFromBinCounts(validRows, useContinuityCorrection);
        break;
      }

      case 'roc_curve_image_digitized': {
        warnings.push('Results are approximate (digitized from image)');
        warnings.push('Cutoff values may be unknown');

        const validRows = digitizedRows
          .filter(r => r.fpr && r.tpr)
          .map((r, i) => ({
            cutoff: `Point ${i + 1}`,
            tpr: parseFloat(r.tpr) > 1 ? parseFloat(r.tpr) / 100 : parseFloat(r.tpr),
            fpr: parseFloat(r.fpr) > 1 ? parseFloat(r.fpr) / 100 : parseFloat(r.fpr),
          }));

        if (validRows.length === 0) return null;

        results = computeIntervalLRsFromROC(validRows, directionality);
        break;
      }
    }

    return { results, warnings };
  }, [
    sourceType,
    twoByTwo,
    sensSpec,
    rocRows,
    rocOutputMode,
    selectedRocRow,
    binRows,
    digitizedRows,
    directionality,
    useContinuityCorrection,
  ]);

  // Update parent when results change
  const handleSaveResults = () => {
    if (!sourceType || !computedResults) return;
    
    onChange({
      sourceType,
      metadata: {
        diseaseDefinition: '',
        indexTestName: '',
        directionality,
        nDiseasePositive: '',
        nDiseaseNegative: '',
      },
      results: computedResults.results,
      warnings: computedResults.warnings,
    });
  };

  // Helper to add/remove rows
  const addRocRow = () => setRocRows([...rocRows, { cutoffValue: '', sensitivity: '', specificity: '' }]);
  const removeRocRow = (i: number) => rocRows.length > 1 && setRocRows(rocRows.filter((_, idx) => idx !== i));
  
  const addBinRow = () => setBinRows([...binRows, { binLabel: '', tp: '', fp: '', fn: '', tn: '' }]);
  const removeBinRow = (i: number) => binRows.length > 1 && setBinRows(binRows.filter((_, idx) => idx !== i));

  const addDigitizedRow = () => setDigitizedRows([...digitizedRows, { fpr: '', tpr: '' }]);
  const removeDigitizedRow = (i: number) => digitizedRows.length > 1 && setDigitizedRows(digitizedRows.filter((_, idx) => idx !== i));

  // Format LR for display
  const formatLR = (lr: number | null | undefined): string => {
    if (lr === null || lr === undefined) return '—';
    if (!isFinite(lr)) return '∞';
    if (lr < 0.01) return lr.toExponential(2);
    if (lr < 1) return lr.toFixed(3);
    if (lr < 10) return lr.toFixed(2);
    if (lr < 100) return lr.toFixed(1);
    return lr.toFixed(0);
  };

  return (
    <div className="space-y-6">
      {/* STEP 1: Input Source Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Select Data Format</CardTitle>
          <CardDescription>
            Choose how the diagnostic data is reported in your source study.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { value: '2x2_table', label: '2×2 Table', desc: 'TP, FP, FN, TN counts' },
            { value: 'sensitivity_specificity_single_cutoff', label: 'Sensitivity & Specificity', desc: 'Single cutoff with sens/spec values' },
            { value: 'roc_or_multiple_cutoffs_table', label: 'ROC / Multiple Cutoffs Table', desc: 'Table of cutoffs with sens/spec at each' },
            { value: 'per_bin_counts_table', label: 'Per-Bin Counts', desc: 'Categorical bins with counts in each' },
            { value: 'roc_curve_image_digitized', label: 'Digitized ROC Curve (Advanced)', desc: 'Manually extracted (FPR, TPR) points' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSourceType(option.value as InputSourceType)}
              className={`w-full p-4 text-left border rounded-lg transition-all ${
                sourceType === option.value
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  sourceType === option.value ? 'border-blue-500' : 'border-gray-300'
                }`}>
                  {sourceType === option.value && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  )}
                </div>
                <div>
                  <span className="font-medium text-gray-900">{option.label}</span>
                  <p className="text-sm text-gray-500 mt-0.5">{option.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* STEP 2: Data Entry (varies by source type) */}
      {sourceType === '2x2_table' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Enter 2×2 Table</CardTitle>
            <CardDescription>
              Enter the counts from the diagnostic accuracy table.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Cutoff Label (optional)</Label>
              <Input
                placeholder='e.g., "≥ 500 ng/mL" or "Positive"'
                value={twoByTwo.cutoffLabel}
                onChange={(e) => setTwoByTwo({ ...twoByTwo, cutoffLabel: e.target.value })}
              />
            </div>
            
            {/* Visual 2x2 table */}
            <div className="mt-4">
              <div className="grid grid-cols-3 gap-1 text-sm">
                <div></div>
                <div className="text-center font-medium text-gray-700 p-2 bg-red-50">Disease +</div>
                <div className="text-center font-medium text-gray-700 p-2 bg-green-50">Disease −</div>
                
                <div className="font-medium text-gray-700 p-2 bg-blue-50 flex items-center">Test +</div>
                <div className="p-1">
                  <Input
                    type="number"
                    placeholder="TP"
                    value={twoByTwo.tp}
                    onChange={(e) => setTwoByTwo({ ...twoByTwo, tp: e.target.value })}
                    className="text-center"
                  />
                </div>
                <div className="p-1">
                  <Input
                    type="number"
                    placeholder="FP"
                    value={twoByTwo.fp}
                    onChange={(e) => setTwoByTwo({ ...twoByTwo, fp: e.target.value })}
                    className="text-center"
                  />
                </div>
                
                <div className="font-medium text-gray-700 p-2 bg-blue-50 flex items-center">Test −</div>
                <div className="p-1">
                  <Input
                    type="number"
                    placeholder="FN"
                    value={twoByTwo.fn}
                    onChange={(e) => setTwoByTwo({ ...twoByTwo, fn: e.target.value })}
                    className="text-center"
                  />
                </div>
                <div className="p-1">
                  <Input
                    type="number"
                    placeholder="TN"
                    value={twoByTwo.tn}
                    onChange={(e) => setTwoByTwo({ ...twoByTwo, tn: e.target.value })}
                    className="text-center"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="continuity2x2"
                checked={useContinuityCorrection}
                onChange={(e) => setUseContinuityCorrection(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="continuity2x2" className="text-sm font-normal">
                Apply continuity correction (+0.5) for zero cells
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      {sourceType === 'sensitivity_specificity_single_cutoff' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Enter Sensitivity & Specificity</CardTitle>
            <CardDescription>
              Enter the reported sensitivity and specificity at a single cutoff.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Cutoff Value</Label>
              <Input
                placeholder='e.g., "500 ng/mL" or "Positive"'
                value={sensSpec.cutoffValue}
                onChange={(e) => setSensSpec({ ...sensSpec, cutoffValue: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sensitivity *</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g., 0.95 or 95"
                  value={sensSpec.sensitivity}
                  onChange={(e) => setSensSpec({ ...sensSpec, sensitivity: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Enter as decimal (0.95) or percent (95)</p>
              </div>
              <div>
                <Label>Specificity *</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g., 0.40 or 40"
                  value={sensSpec.specificity}
                  onChange={(e) => setSensSpec({ ...sensSpec, specificity: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Enter as decimal (0.40) or percent (40)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {sourceType === 'roc_or_multiple_cutoffs_table' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Enter ROC / Multiple Cutoffs Table</CardTitle>
            <CardDescription>
              Enter each cutoff with its sensitivity and specificity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {rocRows.map((row, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-xs">Cutoff</Label>
                    <Input
                      placeholder="e.g., 500"
                      value={row.cutoffValue}
                      onChange={(e) => {
                        const updated = [...rocRows];
                        updated[i] = { ...updated[i], cutoffValue: e.target.value };
                        setRocRows(updated);
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Sensitivity</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="0.95"
                      value={row.sensitivity}
                      onChange={(e) => {
                        const updated = [...rocRows];
                        updated[i] = { ...updated[i], sensitivity: e.target.value };
                        setRocRows(updated);
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Specificity</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="0.40"
                      value={row.specificity}
                      onChange={(e) => {
                        const updated = [...rocRows];
                        updated[i] = { ...updated[i], specificity: e.target.value };
                        setRocRows(updated);
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRocRow(i)}
                    disabled={rocRows.length === 1}
                    className="text-red-600 hover:text-red-700"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addRocRow}>
              + Add Row
            </Button>

            <div className="pt-4 border-t">
              <Label>Output Mode</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setRocOutputMode('interval')}
                  className={`p-3 text-left border rounded-lg transition-all ${
                    rocOutputMode === 'interval'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium text-sm">Interval LRs</span>
                  <p className="text-xs text-gray-500 mt-1">LR for each range between cutoffs</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRocOutputMode('single')}
                  className={`p-3 text-left border rounded-lg transition-all ${
                    rocOutputMode === 'single'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium text-sm">Single Cutoff</span>
                  <p className="text-xs text-gray-500 mt-1">Select one cutoff for LR+/LR−</p>
                </button>
              </div>
              {rocOutputMode === 'single' && rocRows.length > 0 && (
                <div className="mt-3">
                  <Label>Select Cutoff</Label>
                  <select
                    value={selectedRocRow}
                    onChange={(e) => setSelectedRocRow(parseInt(e.target.value))}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    {rocRows.map((row, i) => (
                      <option key={i} value={i}>
                        {row.cutoffValue || `Row ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {sourceType === 'per_bin_counts_table' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Enter Per-Bin 2×2 Tables</CardTitle>
            <CardDescription>
              Enter a 2×2 table (TP, FP, FN, TN) for each test result bin/interval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {binRows.map((row, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex-1 mr-4">
                      <Label className="text-xs">Bin / Interval Label</Label>
                      <Input
                        placeholder='e.g., "< 500 ng/mL" or "Low"'
                        value={row.binLabel}
                        onChange={(e) => {
                          const updated = [...binRows];
                          updated[i] = { ...updated[i], binLabel: e.target.value };
                          setBinRows(updated);
                        }}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBinRow(i)}
                      disabled={binRows.length === 1}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Label className="text-xs">TP</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={row.tp}
                        onChange={(e) => {
                          const updated = [...binRows];
                          updated[i] = { ...updated[i], tp: e.target.value };
                          setBinRows(updated);
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-0.5">D+ in bin</p>
                    </div>
                    <div>
                      <Label className="text-xs">FP</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={row.fp}
                        onChange={(e) => {
                          const updated = [...binRows];
                          updated[i] = { ...updated[i], fp: e.target.value };
                          setBinRows(updated);
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-0.5">D− in bin</p>
                    </div>
                    <div>
                      <Label className="text-xs">FN</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={row.fn}
                        onChange={(e) => {
                          const updated = [...binRows];
                          updated[i] = { ...updated[i], fn: e.target.value };
                          setBinRows(updated);
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-0.5">D+ not in bin</p>
                    </div>
                    <div>
                      <Label className="text-xs">TN</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={row.tn}
                        onChange={(e) => {
                          const updated = [...binRows];
                          updated[i] = { ...updated[i], tn: e.target.value };
                          setBinRows(updated);
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-0.5">D− not in bin</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addBinRow}>
              + Add Bin
            </Button>
          </CardContent>
        </Card>
      )}

      {sourceType === 'roc_curve_image_digitized' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Enter Digitized ROC Points</CardTitle>
            <CardDescription>
              Enter (FPR, TPR) points extracted from an ROC curve image.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Results will be marked as approximate. Cutoff values are typically unknown when digitizing from images.
              </p>
            </div>
            <div className="space-y-3">
              {digitizedRows.map((row, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="w-12 text-sm text-gray-500 pb-2">#{i + 1}</div>
                  <div className="flex-1">
                    <Label className="text-xs">FPR (1 − Specificity)</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="e.g., 0.20"
                      value={row.fpr}
                      onChange={(e) => {
                        const updated = [...digitizedRows];
                        updated[i] = { ...updated[i], fpr: e.target.value };
                        setDigitizedRows(updated);
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">TPR (Sensitivity)</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="e.g., 0.85"
                      value={row.tpr}
                      onChange={(e) => {
                        const updated = [...digitizedRows];
                        updated[i] = { ...updated[i], tpr: e.target.value };
                        setDigitizedRows(updated);
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDigitizedRow(i)}
                    disabled={digitizedRows.length === 1}
                    className="text-red-600 hover:text-red-700"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addDigitizedRow}>
              + Add Point
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: Results Display */}
      {sourceType && computedResults && computedResults.results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Computed Likelihood Ratios</CardTitle>
            <CardDescription>
              Results computed from your input data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Warnings */}
            {computedResults.warnings.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm font-medium text-amber-800 mb-1">Warnings:</p>
                <ul className="text-sm text-amber-700 list-disc list-inside">
                  {computedResults.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Results table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Result / Bin</th>
                    {computedResults.results[0].lrPositive !== undefined ? (
                      <>
                        <th className="px-4 py-2 text-right font-medium text-gray-700">LR+</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-700">LR−</th>
                      </>
                    ) : (
                      <th className="px-4 py-2 text-right font-medium text-gray-700">LR</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {computedResults.results.map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 text-gray-900">{r.binLabel}</td>
                      {r.lrPositive !== undefined ? (
                        <>
                          <td className="px-4 py-2 text-right font-mono">
                            {formatLR(r.lrPositive)}
                          </td>
                          <td className="px-4 py-2 text-right font-mono">
                            {formatLR(r.lrNegative)}
                          </td>
                        </>
                      ) : (
                        <td className="px-4 py-2 text-right font-mono">
                          {formatLR(r.lr)}
                          {r.warning && (
                            <span className="ml-2 text-amber-600" title={r.warning}>⚠</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Clinical interpretation guide */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
              <p className="font-medium text-blue-900 mb-1">Interpretation Guide:</p>
              <ul className="text-blue-800 space-y-0.5">
                <li>• LR &gt; 10: Strong evidence to rule IN disease</li>
                <li>• LR 5–10: Moderate evidence to rule in</li>
                <li>• LR 2–5: Weak evidence to rule in</li>
                <li>• LR 0.5–2: Minimal change in probability</li>
                <li>• LR 0.2–0.5: Weak evidence to rule OUT</li>
                <li>• LR 0.1–0.2: Moderate evidence to rule out</li>
                <li>• LR &lt; 0.1: Strong evidence to rule out</li>
              </ul>
            </div>

            <Button onClick={handleSaveResults} className="w-full">
              Save Results & Continue
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
