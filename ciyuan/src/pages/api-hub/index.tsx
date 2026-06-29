import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ApiHubLayout from './layout/ApiHubLayout';

const LogsBilling = lazy(() => import('./pages/LogsBilling'));
const ApiKeys = lazy(() => import('./pages/ApiKeys'));
const ModelMarket = lazy(() => import('./pages/ModelMarket'));
const ModelDetail = lazy(() => import('./pages/ModelDetail'));
const Wallet = lazy(() => import('./pages/Wallet'));

// 页面加载占位符，继承父容器背景色避免深色模式闪白
const PageFallback = () => <div style={{ flex: 1 }} />;

export default function ApiHubPage() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route element={<ApiHubLayout />}>
          <Route index element={<Navigate to="models" replace />} />
          <Route
            path="logs"
            element={
              <Suspense fallback={<PageFallback />}>
                <LogsBilling />
              </Suspense>
            }
          />
          <Route
            path="keys"
            element={
              <Suspense fallback={<PageFallback />}>
                <ApiKeys />
              </Suspense>
            }
          />
          <Route
            path="models"
            element={
              <Suspense fallback={<PageFallback />}>
                <ModelMarket />
              </Suspense>
            }
          />
          <Route
            path="models/:id"
            element={
              <Suspense fallback={<PageFallback />}>
                <ModelDetail />
              </Suspense>
            }
          />
          <Route
            path="wallet"
            element={
              <Suspense fallback={<PageFallback />}>
                <Wallet />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
}