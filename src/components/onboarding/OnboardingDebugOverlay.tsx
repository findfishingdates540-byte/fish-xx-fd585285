import { useState, useEffect } from "react";
import { X, Bug, ChevronDown, ChevronUp } from "lucide-react";

// Build version - update this when deploying significant changes
export const APP_VERSION = "1.0.1";
export const BUILD_TIMESTAMP = new Date().toISOString().slice(0, 16);

interface OnboardingDebugOverlayProps {
  currentStep: number;
  currentStepKey: string;
  accountMode: string;
  formValues: {
    firstName: string;
    dateOfBirth: string;
    gender: string | null;
    photos: string[];
    city: string;
    state: string;
    maxDistance: number;
    ageRange: [number, number];
    interestedIn: string[];
    lookingFor: string[];
    fishingExperience: string;
    selectedStyles: string[];
    selectedActivities: string[];
  };
}

export function OnboardingDebugOverlay({
  currentStep,
  currentStepKey,
  accountMode,
  formValues,
}: OnboardingDebugOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    // Check URL param or localStorage for debug mode
    const urlParams = new URLSearchParams(window.location.search);
    const debugFromUrl = urlParams.get('debug') === '1';
    const debugFromStorage = localStorage.getItem('onboarding_debug') === '1';
    setIsVisible(debugFromUrl || debugFromStorage);
    
    // Persist if URL param is set
    if (debugFromUrl) {
      localStorage.setItem('onboarding_debug', '1');
    }
  }, []);

  if (!isVisible) return null;

  const supabasePayload = {
    display_name: formValues.firstName,
    date_of_birth: formValues.dateOfBirth,
    gender: formValues.gender,
    photos: formValues.photos,
    location_name: [formValues.city, formValues.state].filter(Boolean).join(', '),
    max_distance_miles: formValues.maxDistance, // ← Key being sent
    min_age_preference: formValues.ageRange[0],
    max_age_preference: formValues.ageRange[1],
    interested_in: formValues.interestedIn,
    looking_for: formValues.lookingFor,
    fishing_experience: formValues.fishingExperience,
    preferred_species: formValues.selectedStyles,
    fishing_gear: formValues.selectedActivities,
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.removeItem('onboarding_debug');
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9999] max-w-xs">
      <div className="bg-black/90 text-green-400 font-mono text-xs rounded-lg shadow-lg border border-green-500/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-green-500/20 border-b border-green-500/30">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4" />
            <span className="font-bold">Debug Mode</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-green-500/20 rounded"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-red-500/20 rounded text-red-400"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
            {/* Version info */}
            <div className="pb-2 border-b border-green-500/30">
              <div className="text-green-300">v{APP_VERSION}</div>
              <div className="text-green-600 text-[10px]">{BUILD_TIMESTAMP}</div>
            </div>

            {/* Step info */}
            <div className="space-y-1">
              <div><span className="text-green-600">Step:</span> {currentStep + 1}</div>
              <div><span className="text-green-600">Key:</span> {currentStepKey}</div>
              <div><span className="text-green-600">Mode:</span> {accountMode}</div>
            </div>

            {/* Distance display verification */}
            <div className="pt-2 border-t border-green-500/30">
              <div className="text-yellow-400 font-bold">Distance Check:</div>
              <div>
                <span className="text-green-600">Value:</span> {formValues.maxDistance}
              </div>
              <div>
                <span className="text-green-600">UI Label:</span> <span className="text-white">miles</span>
              </div>
              <div>
                <span className="text-green-600">DB Key:</span> <span className="text-white">max_distance_miles</span>
              </div>
            </div>

            {/* Payload preview */}
            <div className="pt-2 border-t border-green-500/30">
              <div className="text-yellow-400 font-bold mb-1">Supabase Payload Keys:</div>
              <div className="text-[10px] leading-relaxed text-green-300">
                {Object.keys(supabasePayload).map(key => (
                  <div key={key} className={key === 'max_distance_miles' ? 'text-yellow-300 font-bold' : ''}>
                    • {key}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
