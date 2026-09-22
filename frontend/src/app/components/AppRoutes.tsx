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
import { ProtectedRoute } from '../../features/auth/components/ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
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
      <Route path="/smartquery" element={<SmartAssistantPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/operator" element={<OperatorPortalPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
