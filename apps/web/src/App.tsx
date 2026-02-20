import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { DashboardGate } from './components/DashboardGate';
import { BlockPlaceholder } from './pages/BlockPlaceholder';
import { BodySignalsOverview } from './blocks/BodySignals/BodySignalsOverview';
import { BodySignalsLog } from './blocks/BodySignals/BodySignalsLog';
import { BodySignalsResult } from './blocks/BodySignals/BodySignalsResult';
import { BodySignalsTrends } from './blocks/BodySignals/BodySignalsTrends';
import { WorkRoutineOverview } from './blocks/WorkRoutine/WorkRoutineOverview';
import { WorkRoutineCheckIn } from './blocks/WorkRoutine/WorkRoutineCheckIn';
import { WorkRoutineTrends } from './blocks/WorkRoutine/WorkRoutineTrends';
import { WorkRoutineDone } from './blocks/WorkRoutine/WorkRoutineDone';
import { NutritionOverview } from './blocks/Nutrition/NutritionOverview';
import { NutritionFridgeLog } from './blocks/Nutrition/NutritionFridgeLog';
import { NutritionMealTiming } from './blocks/Nutrition/NutritionMealTiming';
import { NutritionPostMealReflection } from './blocks/Nutrition/NutritionPostMealReflection';
import { NutritionHydrationTiming } from './blocks/Nutrition/NutritionHydrationTiming';
import { NutritionResult } from './blocks/Nutrition/NutritionResult';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { Disclaimer } from './pages/Disclaimer';
import { Admin } from './pages/Admin';
import { Lab } from './pages/Lab';
import { Profile } from './pages/Profile';
import { Pulse } from './pages/Pulse';
import { Invite } from './pages/Invite';
import { ShareInvite } from './pages/ShareInvite';
import { DashboardActivity } from './pages/DashboardActivity';
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardGate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/activity"
        element={
          <ProtectedRoute>
            <DashboardActivity />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/pulse"
        element={
          <ProtectedRoute>
            <Pulse />
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
        path="/dashboard/body-signals/result"
        element={
          <ProtectedRoute>
            <BodySignalsResult />
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
        path="/dashboard/work-routine/done"
        element={
          <ProtectedRoute>
            <WorkRoutineDone />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/work-routine/insights"
        element={
          <ProtectedRoute>
            <WorkRoutineTrends />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/nutrition"
        element={
          <ProtectedRoute>
            <NutritionOverview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/nutrition/fridge"
        element={
          <ProtectedRoute>
            <NutritionFridgeLog />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/nutrition/meal-timing"
        element={
          <ProtectedRoute>
            <NutritionMealTiming />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/nutrition/reflections"
        element={
          <ProtectedRoute>
            <NutritionPostMealReflection />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/nutrition/hydration"
        element={
          <ProtectedRoute>
            <NutritionHydrationTiming />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/nutrition/result"
        element={
          <ProtectedRoute>
            <NutritionResult />
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
      <Route
        path="/dashboard/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/disclaimer" element={<Disclaimer />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/lab" element={<Lab />} />
      <Route path="/invite" element={<Invite />} />
      <Route path="/invite/:code" element={<Invite />} />
      <Route
        path="/dashboard/invite"
        element={
          <ProtectedRoute>
            <ShareInvite />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
