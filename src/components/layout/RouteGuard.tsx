import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useActiveMode } from '@/contexts/ActiveModeContext';

type AccountMode = 'dating' | 'fishing' | 'both';

interface RouteGuardProps {
  children: ReactNode;
  allowedModes: AccountMode[];
  redirectBothToHome?: boolean;
}

export function RouteGuard({ children, allowedModes, redirectBothToHome = false }: RouteGuardProps) {
  // Use baseAccountMode to check actual subscription, not the view mode
  const { baseAccountMode, isComboUser } = useActiveMode();

  // Combo users always have access to everything regardless of their view preference
  if (isComboUser) {
    return <>{children}</>;
  }

  // Non-combo users: check if their base account mode is allowed
  if (allowedModes.includes(baseAccountMode)) {
    return <>{children}</>;
  }

  // Dating users can access fishing features while FishX is free during launch.
  if (baseAccountMode === 'dating' && allowedModes.includes('fishing')) {
    return <>{children}</>;
  }

  // Redirect to appropriate default page based on account mode
  const defaultRoute = baseAccountMode === 'dating' ? '/app/discover' : '/app/spots';
  return <Navigate to={defaultRoute} replace />;
}

// Helper component for dating-only routes
export function DatingRoute({ children }: { children: ReactNode }) {
  return <RouteGuard allowedModes={['dating', 'both']} redirectBothToHome>{children}</RouteGuard>;
}

// Helper component for fishing-only routes
export function FishingRoute({ children }: { children: ReactNode }) {
  return <RouteGuard allowedModes={['fishing', 'both']}>{children}</RouteGuard>;
}
