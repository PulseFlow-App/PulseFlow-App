import { useWallet } from '../contexts/WalletContext';
import { SimpleDashboard } from '../pages/SimpleDashboard';
import { Dashboard } from '../pages/Dashboard';

/**
 * Renders SimpleDashboard when user has no wallet (Google-only),
 * full Dashboard when wallet is connected (privileged tier).
 */
export function DashboardGate() {
  const { walletPublicKey } = useWallet();
  if (walletPublicKey) return <Dashboard />;
  return <SimpleDashboard />;
}
