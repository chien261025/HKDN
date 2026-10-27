import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../../features/auth/components/ProtectedRoute';

// Code splitting các trang bằng React.lazy để tối ưu bundle size và thời gian tải trang ban đầu
const DashboardPage = lazy(() => import('../../features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const LocationLayoutPage = lazy(() => import('../../features/masterdata/pages/LocationLayoutPage').then(m => ({ default: m.LocationLayoutPage })));
const InventoryBalancePage = lazy(() => import('../../features/inventory/pages/InventoryBalancePage').then(m => ({ default: m.InventoryBalancePage })));
const SmartAssistantPage = lazy(() => import('../../features/smartquery/pages/SmartAssistantPage').then(m => ({ default: m.SmartAssistantPage })));
const ReportsPage = lazy(() => import('../../features/reporting/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const OperatorPortalPage = lazy(() => import('../../features/operator/pages/OperatorPortalPage').then(m => ({ default: m.OperatorPortalPage })));
const InboundOrdersPage = lazy(() => import('../../features/inbound/pages/InboundOrdersPage').then(m => ({ default: m.InboundOrdersPage })));
const OutboundOrdersPage = lazy(() => import('../../features/outbound/pages/OutboundOrdersPage').then(m => ({ default: m.OutboundOrdersPage })));
const AuditManagementPage = lazy(() => import('../../features/audit/pages/AuditManagementPage').then(m => ({ default: m.AuditManagementPage })));
const ProductsPage = lazy(() => import('../../features/products/pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const UsersManagementPage = lazy(() => import('../../features/users/pages/UsersManagementPage').then(m => ({ default: m.UsersManagementPage })));
const BarcodePrintingPage = lazy(() => import('../../features/labels/pages/BarcodePrintingPage').then(m => ({ default: m.BarcodePrintingPage })));

interface AppRoutesProps {
  onOpenScanner?: () => void;
}

const RouteLoadingFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[450px] w-full p-8">
    <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    <p className="mt-3 text-xs text-slate-500 font-medium">Đang tải phân hệ kho...</p>
  </div>
);

export const AppRoutes: React.FC<AppRoutesProps> = ({ onOpenScanner }) => {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route 
          path="/users" 
          element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <UsersManagementPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/inbound" element={<InboundOrdersPage />} />
        <Route path="/outbound" element={<OutboundOrdersPage />} />
        <Route path="/layout" element={<LocationLayoutPage />} />
        <Route path="/inventory" element={<InventoryBalancePage />} />
        <Route path="/audit" element={<AuditManagementPage />} />
        <Route path="/labels" element={<BarcodePrintingPage onOpenScanner={onOpenScanner} />} />
        <Route path="/smartquery" element={<SmartAssistantPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/operator" element={<OperatorPortalPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
