import { Navigate, useOutletContext, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';

type AccountMode = 'dating' | 'fishing' | 'both';

interface RouteGuardProps {
  children: ReactNode;
  allowedModes: AccountMode[];
  redirectBothToHome?: boolean;
}

interface OutletContext {
  accountMode: AccountMode;
}

export function RouteGuard({ children, allowedModes, redirectBothToHome = false }: RouteGuardProps) {
  const { accountMode } = useOutletContext<OutletContext>();
  const location = useLocation();

  // For 'both' mode users on dating-specific pages like /app/discover, redirect to dashboard
  if (accountMode === 'both' && redirectBothToHome && location.pathname === '/app/discover') {
    return <Navigate to="/app/dashboard" replace />;
  }

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
  return <RouteGuard allowedModes={['dating', 'both']} redirectBothToHome>{children}</RouteGuard>;
}

// Helper component for fishing-only routes
export function FishingRoute({ children }: { children: ReactNode }) {
  return <RouteGuard allowedModes={['fishing', 'both']}>{children}</RouteGuard>;
}
