import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ApiHubPage from './pages/api-hub';
import { lazy, Suspense } from 'react';
import BaiduAnalytics from './components/BaiduAnalytics';

const LoginPage = lazy(() => import('./pages/login'));
const PayPage = lazy(() => import('./pages/pay/PayPage'));
const PaidServiceAgreementPage = lazy(() => import('./pages/paid-service-agreement'));
const MarketingPage = lazy(() => import('./pages/marketing'));

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <BaiduAnalytics />
        <Suspense fallback={null}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/pay" element={<PayPage />} />
            <Route path="/paid-service-agreement" element={<PaidServiceAgreementPage />} />
            <Route path="/hub/*" element={<ApiHubPage />} />
            <Route path="/marketing/*" element={<MarketingPage />} />
            <Route path="/" element={<Navigate to="/marketing" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
