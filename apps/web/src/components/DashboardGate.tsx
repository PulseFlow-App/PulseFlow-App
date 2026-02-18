import { useWallet } from '../contexts/WalletContext';
import { Dashboard } from '../pages/Dashboard';
import { EmailOnlyReferral } from '../pages/EmailOnlyReferral';

/**
 * Wallet connected → full dashboard (points, blocks, everything).
 * Email only (no wallet) → referral links only; no dashboard, no points.
 */
export function DashboardGate() {
  const { walletPublicKey } = useWallet();
  if (walletPublicKey) return <Dashboard />;
  return <EmailOnlyReferral />;
}
