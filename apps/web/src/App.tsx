import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { BlockPlaceholder } from './pages/BlockPlaceholder';
import { BodySignalsOverview } from './blocks/BodySignals/BodySignalsOverview';
import { BodySignalsLog } from './blocks/BodySignals/BodySignalsLog';
import { BodySignalsTrends } from './blocks/BodySignals/BodySignalsTrends';
import { WorkRoutineOverview } from './blocks/WorkRoutine/WorkRoutineOverview';
import { WorkRoutineCheckIn } from './blocks/WorkRoutine/WorkRoutineCheckIn';
import { WorkRoutineInsights } from './blocks/WorkRoutine/WorkRoutineInsights';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { Disclaimer } from './pages/Disclaimer';
import { Admin } from './pages/Admin';
import { Lab } from './pages/Lab';
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/body-signals"
        element={
          <ProtectedRoute>
            <BodySignalsOverview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/body-signals/log"
        element={
          <ProtectedRoute>
            <BodySignalsLog />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/body-signals/trends"
        element={
          <ProtectedRoute>
            <BodySignalsTrends />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/work-routine"
        element={
          <ProtectedRoute>
            <WorkRoutineOverview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/work-routine/checkin"
        element={
          <ProtectedRoute>
            <WorkRoutineCheckIn />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/work-routine/insights"
        element={
          <ProtectedRoute>
            <WorkRoutineInsights />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/:blockId"
        element={
          <ProtectedRoute>
            <BlockPlaceholder />
          </ProtectedRoute>
        }
      />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/disclaimer" element={<Disclaimer />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/lab" element={<Lab />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
