import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';
import { LocationLayoutPage } from '../../features/masterdata/pages/LocationLayoutPage';
import { InventoryBalancePage } from '../../features/inventory/pages/InventoryBalancePage';
import { SmartAssistantPage } from '../../features/smartquery/pages/SmartAssistantPage';
import { ReportsPage } from '../../features/reporting/pages/ReportsPage';
import { OperatorPortalPage } from '../../features/operator/pages/OperatorPortalPage';
import { InboundOrdersPage } from '../../features/inbound/pages/InboundOrdersPage';
import { OutboundOrdersPage } from '../../features/outbound/pages/OutboundOrdersPage';
import { AuditManagementPage } from '../../features/audit/pages/AuditManagementPage';
import { ProductsPage } from '../../features/products/pages/ProductsPage';
import { UsersManagementPage } from '../../features/users/pages/UsersManagementPage';
import { BarcodePrintingPage } from '../../features/labels/pages/BarcodePrintingPage';
import { ProtectedRoute } from '../../features/auth/components/ProtectedRoute';

interface AppRoutesProps {
  onOpenScanner?: () => void;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({ onOpenScanner }) => {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute routePath="/"><DashboardPage /></ProtectedRoute>} />
      <Route 
        path="/users" 
        element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN']} routePath="/users">
            <UsersManagementPage />
          </ProtectedRoute>
        } 
      />
      <Route path="/products" element={<ProtectedRoute routePath="/products"><ProductsPage /></ProtectedRoute>} />
      <Route path="/inbound" element={<ProtectedRoute routePath="/inbound"><InboundOrdersPage /></ProtectedRoute>} />
      <Route path="/outbound" element={<ProtectedRoute routePath="/outbound"><OutboundOrdersPage /></ProtectedRoute>} />
      <Route path="/layout" element={<ProtectedRoute routePath="/layout"><LocationLayoutPage /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute routePath="/inventory"><InventoryBalancePage /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute routePath="/audit"><AuditManagementPage /></ProtectedRoute>} />
      <Route path="/labels" element={<ProtectedRoute routePath="/labels"><BarcodePrintingPage onOpenScanner={onOpenScanner} /></ProtectedRoute>} />
      <Route path="/smartquery" element={<ProtectedRoute routePath="/smartquery"><SmartAssistantPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute routePath="/reports"><ReportsPage /></ProtectedRoute>} />
      <Route path="/operator" element={<ProtectedRoute routePath="/operator"><OperatorPortalPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
