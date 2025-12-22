import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type BaseAccountMode = 'dating' | 'fishing' | 'both';
export type ActiveMode = 'unified' | 'dating' | 'fishing';

interface ActiveModeContextType {
  // The raw account mode from the database
  baseAccountMode: BaseAccountMode;
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
  // Whether the user is a combo user (can switch modes)
  isComboUser: boolean;
}

const ActiveModeContext = createContext<ActiveModeContextType | undefined>(undefined);

interface ActiveModeProviderProps {
  children: ReactNode;
  baseAccountMode: BaseAccountMode;
}

const STORAGE_KEY = 'ffd-active-mode';

export function ActiveModeProvider({ children, baseAccountMode }: ActiveModeProviderProps) {
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
