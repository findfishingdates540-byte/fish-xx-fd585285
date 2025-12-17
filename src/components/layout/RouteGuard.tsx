import { Navigate, useOutletContext } from 'react-router-dom';
import { ReactNode } from 'react';

type AccountMode = 'dating' | 'fishing' | 'both';

interface RouteGuardProps {
  children: ReactNode;
  allowedModes: AccountMode[];
}

interface OutletContext {
  accountMode: AccountMode;
}

export function RouteGuard({ children, allowedModes }: RouteGuardProps) {
  const { accountMode } = useOutletContext<OutletContext>();

  // 'both' mode has access to everything
  if (accountMode === 'both' || allowedModes.includes(accountMode)) {
    return <>{children}</>;
  }

  // Redirect to appropriate default page based on account mode
  const defaultRoute = accountMode === 'dating' ? '/app/discover' : '/app/spots';
  return <Navigate to={defaultRoute} replace />;
}

// Helper component for dating-only routes
export function DatingRoute({ children }: { children: ReactNode }) {
  return <RouteGuard allowedModes={['dating', 'both']}>{children}</RouteGuard>;
}

// Helper component for fishing-only routes
export function FishingRoute({ children }: { children: ReactNode }) {
  return <RouteGuard allowedModes={['fishing', 'both']}>{children}</RouteGuard>;
}
