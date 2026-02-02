'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  BayesianValidityProfileData,
  WarningWithSource,
  ValidityLevel,
} from './treatment-validity-rules';

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface BayesianValidityProfileProps {
  value: BayesianValidityProfileData;
  onChange: (data: BayesianValidityProfileData) => void;
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface ValidityBadgeProps {
  level: ValidityLevel;
  label: string;
}

function ValidityBadge({ level, label }: ValidityBadgeProps) {
  const colors = {
    high: 'bg-green-100 border-green-400 text-green-800',
    moderate: 'bg-yellow-100 border-yellow-400 text-yellow-800',
    low: 'bg-red-100 border-red-400 text-red-800',
  };

  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${colors[level]}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-75">{label}</p>
      <p className="text-xl font-bold capitalize">{level}</p>
    </div>
  );
}

interface WarningItemProps {
  warning: WarningWithSource;
  isExpanded: boolean;
  onToggle: () => void;
}

function WarningItem({ warning, isExpanded, onToggle }: WarningItemProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-3 text-left bg-amber-50 hover:bg-amber-100 transition-colors flex justify-between items-center"
      >
        <div className="flex items-start gap-2">
          <span className="text-amber-600 text-lg">⚠</span>
          <span className="text-sm text-amber-900">{warning.message}</span>
        </div>
        <span className="text-amber-600 text-sm">{isExpanded ? '▼' : '▶'}</span>
      </button>
      {isExpanded && (
        <div className="p-3 bg-white border-t">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Sources:</p>
          <ul className="text-sm text-gray-700 space-y-1">
            {warning.sources.map((source, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>{source}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface DistortionRiskBadgeProps {
  label: string;
  active: boolean;
}

function DistortionRiskBadge({ label, active }: DistortionRiskBadgeProps) {
  return (
    <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
      active 
        ? 'bg-red-100 text-red-800 border border-red-300'
        : 'bg-gray-100 text-gray-500 border border-gray-200'
    }`}>
      {active ? '✓ ' : ''}{label}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BayesianValidityProfile({ value, onChange }: BayesianValidityProfileProps) {
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

  const hasAnyDistortionRisk = 
    value.effectDistortionRisks.benefitInflation ||
    value.effectDistortionRisks.harmUnderestimate ||
    value.effectDistortionRisks.timeHorizonMismatch ||
    value.effectDistortionRisks.adherenceBias ||
    value.effectDistortionRisks.crossoverDilution ||
    value.effectDistortionRisks.selectiveReporting;

  return (
    <div className="space-y-6">
      {/* Main Validity Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Validity Assessment</CardTitle>
          <CardDescription>
            Computed from RoB instrument and treatment modifiers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <ValidityBadge level={value.internalValidity} label="Internal Validity" />
            <ValidityBadge level={value.transportability} label="Transportability" />
          </div>
        </CardContent>
      </Card>

      {/* Effect Distortion Risks */}
      <Card>
        <CardHeader>
          <CardTitle>Effect Distortion Risks</CardTitle>
          <CardDescription>
            Specific biases that may affect the direction or magnitude of the treatment effect
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasAnyDistortionRisk ? (
            <div className="flex flex-wrap gap-2">
              <DistortionRiskBadge 
                label="Benefit Inflation" 
                active={value.effectDistortionRisks.benefitInflation} 
              />
              <DistortionRiskBadge 
                label="Harm Underestimate" 
                active={value.effectDistortionRisks.harmUnderestimate} 
              />
              <DistortionRiskBadge 
                label="Time Horizon Mismatch" 
                active={value.effectDistortionRisks.timeHorizonMismatch} 
              />
              <DistortionRiskBadge 
                label="Adherence Bias" 
                active={value.effectDistortionRisks.adherenceBias} 
              />
              <DistortionRiskBadge 
                label="Crossover Dilution" 
                active={value.effectDistortionRisks.crossoverDilution} 
              />
              <DistortionRiskBadge 
                label="Selective Reporting" 
                active={value.effectDistortionRisks.selectiveReporting} 
              />
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">
              No specific effect distortion risks identified
            </p>
          )}
        </CardContent>
      </Card>

      {/* Warnings */}
      <Card>
        <CardHeader>
          <CardTitle>Warnings ({value.warnings.length})</CardTitle>
          <CardDescription>
            Click each warning to see which inputs triggered it
          </CardDescription>
        </CardHeader>
        <CardContent>
          {value.warnings.length > 0 ? (
            <div className="space-y-2">
              {value.warnings.map((warning, index) => (
                <WarningItem
                  key={index}
                  warning={warning}
                  isExpanded={expandedWarnings.has(index)}
                  onToggle={() => toggleWarning(index)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">
              No specific warnings generated
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary Paragraph */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>
            Automated interpretation of validity assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-lg ${
            value.internalValidity === 'low' || value.transportability === 'low'
              ? 'bg-red-50 border border-red-200'
              : value.internalValidity === 'moderate' || value.transportability === 'moderate'
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-green-50 border border-green-200'
          }`}>
            <p className={`text-sm ${
              value.internalValidity === 'low' || value.transportability === 'low'
                ? 'text-red-900'
                : value.internalValidity === 'moderate' || value.transportability === 'moderate'
                ? 'text-yellow-900'
                : 'text-green-900'
            }`}>
              {value.summaryParagraph || 'Complete the quality assessment to generate a summary.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Interpretation Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Interpretation Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="font-medium text-green-800">HIGH Validity</p>
              <p className="text-green-700 mt-1">
                Effect estimates likely reflect true treatment effect. 
                ARR/NNT calculations are reliable for clinical decisions.
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="font-medium text-yellow-800">MODERATE Validity</p>
              <p className="text-yellow-700 mt-1">
                Some bias concerns exist. Effect estimates should be 
                interpreted with caution; true effect may differ.
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="font-medium text-red-800">LOW Validity</p>
              <p className="text-red-700 mt-1">
                Significant bias risk. Effect estimates may substantially 
                misrepresent true treatment effect. Use with high caution.
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">
              Impact on Clinical Calculations:
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>ARR (Absolute Risk Reduction):</strong> May be over/underestimated if internal validity is low</li>
              <li>• <strong>NNT (Number Needed to Treat):</strong> Depends on both effect estimate AND baseline risk accuracy</li>
              <li>• <strong>Transportability:</strong> Even valid effects may not apply to your specific patient population</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Analyst Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Analyst Notes</CardTitle>
          <CardDescription>
            Add any additional observations or caveats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Additional notes about the validity assessment, contextual factors, or clinical implications..."
            value={value.analystNotes}
            onChange={(e) => onChange({ ...value, analystNotes: e.target.value })}
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}
