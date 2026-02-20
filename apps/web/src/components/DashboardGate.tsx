import { Dashboard } from '../pages/Dashboard';

/**
 * Renders the dashboard for logged-in users. Points/numbers are gated inside Dashboard
 * when wallet is not connected (connect wallet to see points and redeem on-chain).
 */
export function DashboardGate() {
  return <Dashboard />;
}
