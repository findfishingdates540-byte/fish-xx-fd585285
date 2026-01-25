import { Navigate, useOutletContext } from 'react-router-dom';

type AccountMode = 'dating' | 'fishing' | 'both';

interface OutletContext {
  accountMode: AccountMode;
}

export default function AppIndex() {
  const { accountMode } = useOutletContext<OutletContext>();

  // Redirect to appropriate default page based on account mode
  if (accountMode === 'fishing') {
    return <Navigate to="/app/feed" replace />;
  }

  if (accountMode === 'both') {
    return <Navigate to="/app/dashboard" replace />;
  }

  // Dating mode defaults to discover
  return <Navigate to="/app/discover" replace />;
}
