import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type BaseAccountMode = 'dating' | 'fishing' | 'both';
export type ActiveMode = 'unified' | 'dating' | 'fishing';

const STORAGE_KEY = 'ffd-active-mode';
const ORIGINAL_MODE_KEY = 'ffd-original-account-mode';

interface ActiveModeContextType {
  // The raw account mode from the database
  baseAccountMode: BaseAccountMode;
  // Set the base account mode (updates local state after DB change)
  setBaseAccountMode: (mode: BaseAccountMode) => void;
  // The original account mode the user registered with
  // This helps determine if user was originally a combo user
  originalAccountMode: BaseAccountMode;
  // Whether the user originally registered as 'both' (combo)
  wasOriginallyCombo: boolean;
  // The active mode the user has selected (only relevant for 'both' users)
  activeMode: ActiveMode;
  // Set the active mode
  setActiveMode: (mode: ActiveMode) => void;
  // The effective mode for navigation and features
  // For single-mode users, this is their account mode
  // For combo users, this depends on activeMode:
  //   - 'unified' -> 'both'
  //   - 'dating' -> 'dating' 
  //   - 'fishing' -> 'fishing'
  effectiveMode: BaseAccountMode;
  // Whether the user is currently a combo user (can switch modes)
  isComboUser: boolean;
}

const ActiveModeContext = createContext<ActiveModeContextType | undefined>(undefined);

interface ActiveModeProviderProps {
  children: ReactNode;
  baseAccountMode: BaseAccountMode;
}

export function ActiveModeProvider({ children, baseAccountMode: initialBaseAccountMode }: ActiveModeProviderProps) {
  // Track base account mode locally so it can be updated after DB changes
  const [baseAccountMode, setBaseAccountModeState] = useState<BaseAccountMode>(initialBaseAccountMode);

  // Track the original account mode (set once on first load)
  const [originalAccountMode, setOriginalAccountMode] = useState<BaseAccountMode>(() => {
    const stored = localStorage.getItem(ORIGINAL_MODE_KEY) as BaseAccountMode | null;
    // If we have a stored original mode, use it
    if (stored && (stored === 'dating' || stored === 'fishing' || stored === 'both')) {
      return stored;
    }
    // Otherwise, this is a fresh session - use the initial mode
    return initialBaseAccountMode;
  });

  // Store the original mode on first load (only if not already stored)
  useEffect(() => {
    const stored = localStorage.getItem(ORIGINAL_MODE_KEY);
    if (!stored) {
      localStorage.setItem(ORIGINAL_MODE_KEY, initialBaseAccountMode);
      setOriginalAccountMode(initialBaseAccountMode);
    }
  }, [initialBaseAccountMode]);

  // Sync with prop changes (e.g., from parent query refetch)
  useEffect(() => {
    setBaseAccountModeState(initialBaseAccountMode);
  }, [initialBaseAccountMode]);

  // Wrapper to update both state and keep track of original
  const setBaseAccountMode = (mode: BaseAccountMode) => {
    setBaseAccountModeState(mode);
  };

  // Initialize from localStorage or default to 'unified' for combo users
  const [activeMode, setActiveModeState] = useState<ActiveMode>(() => {
    if (baseAccountMode !== 'both') return 'unified';
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dating' || stored === 'fishing' || stored === 'unified') {
      return stored;
    }
    return 'unified';
  });

  // Reset to unified when base account mode changes
  useEffect(() => {
    if (baseAccountMode !== 'both') {
      setActiveModeState('unified');
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [baseAccountMode]);

  const setActiveMode = (mode: ActiveMode) => {
    setActiveModeState(mode);
    if (baseAccountMode === 'both') {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  };

  const isComboUser = baseAccountMode === 'both';
  const wasOriginallyCombo = originalAccountMode === 'both';

  // Calculate effective mode
  const effectiveMode: BaseAccountMode = (() => {
    if (baseAccountMode !== 'both') {
      return baseAccountMode;
    }
    // Combo user
    switch (activeMode) {
      case 'dating':
        return 'dating';
      case 'fishing':
        return 'fishing';
      case 'unified':
      default:
        return 'both';
    }
  })();

  return (
    <ActiveModeContext.Provider
      value={{
        baseAccountMode,
        setBaseAccountMode,
        originalAccountMode,
        wasOriginallyCombo,
        activeMode,
        setActiveMode,
        effectiveMode,
        isComboUser,
      }}
    >
      {children}
    </ActiveModeContext.Provider>
  );
}

export function useActiveMode() {
  const context = useContext(ActiveModeContext);
  if (context === undefined) {
    throw new Error('useActiveMode must be used within an ActiveModeProvider');
  }
  return context;
}
