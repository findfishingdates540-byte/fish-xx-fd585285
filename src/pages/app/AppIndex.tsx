import { Navigate } from 'react-router-dom';

export default function AppIndex() {
  // All users land on the feed
  return <Navigate to="/app/feed" replace />;
}
