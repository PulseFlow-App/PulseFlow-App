import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SolanaProvider } from './components/SolanaProvider';
import { WalletContextProvider } from './contexts/WalletContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SolanaProvider>
          <WalletContextProvider>
            <SubscriptionProvider>
              <App />
            </SubscriptionProvider>
          </WalletContextProvider>
        </SolanaProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
