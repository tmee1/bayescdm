'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RoBInstrument } from './rob-instrument';
import { TreatmentModifiers } from './treatment-modifiers';
import { BayesianValidityProfile } from './bayesian-validity-profile';
import {
  TreatmentQualityAssessmentData,
  TreatmentDataEntry,
  computeTreatmentValidityProfile,
  createEmptyTreatmentQualityAssessmentData,
} from './treatment-validity-rules';

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface TreatmentQualityAssessmentProps {
  value: TreatmentQualityAssessmentData | null;
  dataEntry?: TreatmentDataEntry;
  onChange: (data: TreatmentQualityAssessmentData) => void;
  onContinue?: () => void;
}

type TabId = 'instrument' | 'modifiers' | 'profile';

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TreatmentQualityAssessment({ 
  value, 
  dataEntry,
  onChange, 
  onContinue 
}: TreatmentQualityAssessmentProps) {
  const [activeTab, setActiveTab] = useState<TabId>('instrument');
  
  // Initialize with empty data if not provided
  const qualityData = value || createEmptyTreatmentQualityAssessmentData();

  // Compute validity profile whenever inputs change
  const computedProfile = useMemo(() => {
    return computeTreatmentValidityProfile(
      qualityData.instrument,
      qualityData.treatmentModifiers,
      dataEntry
    );
  }, [qualityData.instrument, qualityData.treatmentModifiers, dataEntry]);

  // Update the validity profile in the data when computation changes
  useEffect(() => {
    const newProfile = {
      ...computedProfile,
      analystNotes: qualityData.bayesianValidityProfile.analystNotes,
    };
    
    // Only update if something changed
    if (
      newProfile.internalValidity !== qualityData.bayesianValidityProfile.internalValidity ||
      newProfile.transportability !== qualityData.bayesianValidityProfile.transportability ||
      newProfile.warnings.length !== qualityData.bayesianValidityProfile.warnings.length ||
      newProfile.summaryParagraph !== qualityData.bayesianValidityProfile.summaryParagraph
    ) {
      onChange({
        ...qualityData,
        bayesianValidityProfile: newProfile,
      });
    }
  }, [computedProfile]);

  const tabs: { id: TabId; label: string; description: string }[] = [
    { 
      id: 'instrument', 
      label: 'RoB 2 / ROBINS-I', 
      description: 'Risk of Bias Assessment' 
    },
    { 
      id: 'modifiers', 
      label: 'Effect Modifiers', 
      description: 'Transportability Factors' 
    },
    { 
      id: 'profile', 
      label: 'Validity Profile', 
      description: 'Computed Results' 
    },
  ];

  const handleContinueFromInstrument = () => {
    setActiveTab('modifiers');
  };

  const handleContinueFromModifiers = () => {
    setActiveTab('profile');
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <div className="flex flex-col items-center gap-1">
                <span>{tab.label}</span>
                <span className="text-xs font-normal text-gray-400">{tab.description}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'instrument' && (
          <div className="space-y-6">
            <RoBInstrument
              value={qualityData.instrument}
              onChange={(instrument) => onChange({ ...qualityData, instrument })}
            />
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleContinueFromInstrument}>
                Continue to Effect Modifiers →
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'modifiers' && (
          <div className="space-y-6">
            <TreatmentModifiers
              value={qualityData.treatmentModifiers}
              onChange={(treatmentModifiers) => onChange({ ...qualityData, treatmentModifiers })}
            />
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setActiveTab('instrument')}>
                ← Back to Instrument
              </Button>
              <Button onClick={handleContinueFromModifiers}>
                Continue to Validity Profile →
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <BayesianValidityProfile
              value={qualityData.bayesianValidityProfile}
              onChange={(bayesianValidityProfile) => onChange({ 
                ...qualityData, 
                bayesianValidityProfile 
              })}
            />
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setActiveTab('modifiers')}>
                ← Back to Effect Modifiers
              </Button>
              {onContinue && (
                <Button onClick={onContinue}>
                  Continue to Review →
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Validity Summary Badge (always visible) */}
      <div className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-lg border z-50">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Internal</p>
            <p className={`text-sm font-bold ${
              qualityData.bayesianValidityProfile.internalValidity === 'high' ? 'text-green-600' :
              qualityData.bayesianValidityProfile.internalValidity === 'moderate' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {qualityData.bayesianValidityProfile.internalValidity.toUpperCase()}
            </p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Transport</p>
            <p className={`text-sm font-bold ${
              qualityData.bayesianValidityProfile.transportability === 'high' ? 'text-green-600' :
              qualityData.bayesianValidityProfile.transportability === 'moderate' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {qualityData.bayesianValidityProfile.transportability.toUpperCase()}
            </p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Warnings</p>
            <p className={`text-sm font-bold ${
              qualityData.bayesianValidityProfile.warnings.length === 0 ? 'text-green-600' :
              qualityData.bayesianValidityProfile.warnings.length <= 2 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {qualityData.bayesianValidityProfile.warnings.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export for re-use
export { createEmptyTreatmentQualityAssessmentData } from './treatment-validity-rules';
