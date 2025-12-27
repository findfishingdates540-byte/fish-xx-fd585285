import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { UpgradeModal } from '@/components/upgrade/UpgradeModal';

interface UpgradeModalContextType {
  showUpgradeModal: (featureName?: string) => void;
  hideUpgradeModal: () => void;
}

const UpgradeModalContext = createContext<UpgradeModalContextType | undefined>(undefined);

export function UpgradeModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [featureName, setFeatureName] = useState<string>('fishing features');

  const showUpgradeModal = useCallback((feature?: string) => {
    setFeatureName(feature || 'fishing features');
    setIsOpen(true);
  }, []);

  const hideUpgradeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <UpgradeModalContext.Provider value={{ showUpgradeModal, hideUpgradeModal }}>
      {children}
      <UpgradeModal 
        isOpen={isOpen} 
        onClose={hideUpgradeModal} 
        featureName={featureName}
      />
    </UpgradeModalContext.Provider>
  );
}

export function useUpgradeModal() {
  const context = useContext(UpgradeModalContext);
  if (context === undefined) {
    throw new Error('useUpgradeModal must be used within an UpgradeModalProvider');
  }
  return context;
}
