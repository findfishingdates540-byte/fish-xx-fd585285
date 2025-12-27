import { Navigate, useOutletContext, useLocation } from 'react-router-dom';
import { ReactNode, useState, useEffect } from 'react';
import { UpgradeModal } from '@/components/upgrade/UpgradeModal';

type AccountMode = 'dating' | 'fishing' | 'both';

interface RouteGuardProps {
  children: ReactNode;
  allowedModes: AccountMode[];
  redirectBothToHome?: boolean;
}

interface OutletContext {
  accountMode: AccountMode;
}

// Map routes to feature names for the upgrade modal
const routeFeatureNames: Record<string, string> = {
  '/app/spots': 'Fishing Spots',
  '/app/feed': 'Fishing Feed',
  '/app/catches': 'Catch Logbook',
  '/app/buddies': 'Fishing Buddies',
  '/app/buddy-messages': 'Buddy Messages',
  '/app/trips': 'Trip Planning',
};

export function RouteGuard({ children, allowedModes, redirectBothToHome = false }: RouteGuardProps) {
  const { accountMode } = useOutletContext<OutletContext>();
  const location = useLocation();
  const [showUpgrade, setShowUpgrade] = useState(false);

  // For 'both' mode users on dating-specific pages like /app/discover, redirect to dashboard
  if (accountMode === 'both' && redirectBothToHome && location.pathname === '/app/discover') {
    return <Navigate to="/app/dashboard" replace />;
  }

  // 'both' mode has access to everything
  if (accountMode === 'both' || allowedModes.includes(accountMode)) {
    return <>{children}</>;
  }

  // Dating users trying to access fishing features - show upgrade modal
  if (accountMode === 'dating' && allowedModes.includes('fishing')) {
    // Find the feature name for this route
    const featureName = Object.entries(routeFeatureNames).find(([path]) => 
      location.pathname.startsWith(path)
    )?.[1] || 'fishing features';
    
    return (
      <FishingUpgradePrompt featureName={featureName} />
    );
  }

  // Redirect to appropriate default page based on account mode
  const defaultRoute = accountMode === 'dating' ? '/app/discover' : '/app/spots';
  return <Navigate to={defaultRoute} replace />;
}

// Component shown when dating users try to access fishing features
function FishingUpgradePrompt({ featureName }: { featureName: string }) {
  const [showModal, setShowModal] = useState(true);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Premium Feature</h2>
        <p className="text-muted-foreground mb-6">
          {featureName} is a premium feature. Upgrade your account to unlock all fishing features!
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          View Upgrade Options
        </button>
      </div>
      
      <UpgradeModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        featureName={featureName}
      />
    </div>
  );
}

// Helper component for dating-only routes
export function DatingRoute({ children }: { children: ReactNode }) {
  return <RouteGuard allowedModes={['dating', 'both']} redirectBothToHome>{children}</RouteGuard>;
}

// Helper component for fishing-only routes
export function FishingRoute({ children }: { children: ReactNode }) {
  return <RouteGuard allowedModes={['fishing', 'both']}>{children}</RouteGuard>;
}
