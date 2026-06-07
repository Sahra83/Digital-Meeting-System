// src/components/ProtectedParticipantRoute.jsx
// Route guard for participants – ensures authentication and participant role

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedParticipantRoute() {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-white text-slate-700">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold">
          Checking your session…
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user?.portal !== 'participant') {
    return <Navigate to={user?.default_path || '/dashboard/overview'} replace />;
  }

  return <Outlet />;
}

export default ProtectedParticipantRoute;
