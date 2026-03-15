import { Navigate, useOutletContext } from 'react-router-dom';

type AccountMode = 'dating' | 'fishing' | 'both';

interface OutletContext {
  accountMode: AccountMode;
}

export default function AppIndex() {
  const { accountMode } = useOutletContext<OutletContext>();

  // Default all users to feed (fishing-first)
  if (accountMode === 'both') {
    return <Navigate to="/app/dashboard" replace />;
  }

  if (accountMode === 'dating') {
    return <Navigate to="/app/discover" replace />;
  }

  // Fishing mode (default) goes to feed
  return <Navigate to="/app/feed" replace />;
}
