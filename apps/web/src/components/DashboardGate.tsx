import { Dashboard } from '../pages/Dashboard';

/**
 * All logged-in users see the dashboard. Wallet is not required to use the app.
 * Connect wallet to unlock advanced metrics, insights, and on-chain rewards.
 */
export function DashboardGate() {
  return <Dashboard />;
}
