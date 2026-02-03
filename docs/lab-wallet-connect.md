# Lab: Solana Wallet Connect

To add **Solana wallet connect** on the Lab page (Phantom, Solflare, etc.):

1. **Install packages** in `apps/web`:
   ```bash
   npm install @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets @solana/web3.js
   ```
   Use versions that match (e.g. `@solana/wallet-adapter-react@^0.15.35` and peers).

2. **Wrap the app** with `ConnectionProvider` and `WalletProvider` in `main.tsx`, and import `@solana/wallet-adapter-react-ui/styles.css`.

3. **Lab page**: use `useWallet()` and `WalletMultiButton` from `@solana/wallet-adapter-react-ui`. When the user connects, store their wallet address in `localStorage` under `@pulse/referral_wallet` so the referral completion (when they register on the app) can send it to the API.

4. **Optional:** set `VITE_SOLANA_RPC` in `.env` for a custom RPC endpoint; otherwise the app uses `clusterApiUrl('mainnet-beta')`.

See [Solana Wallet Adapter](https://github.com/anza-xyz/wallet-adapter) for the recommended “easy steady way” to connect Solana-compatible wallets.
