// src/routes/VendorRoutes.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { VendorProvider } from '../contexts/VendorContext';
import VendorApplicationPage from '../pages/VendorApplicationPage';
import VendorAnalyticsDashboard from '../pages/vendor/VendorAnalyticsDashboard';
import CommissionPayoutPage from '../pages/vendor/CommissionPayoutPage';
import VendorManagementPage from '../pages/admin/VendorManagementPage';
import VendorPerformancePage from '../pages/admin/VendorPerformancePage';

const VendorRoutes: React.FC = () => {
  return (
    <VendorProvider>
      <Routes>
        {/* Public Vendor Routes */}
        <Route path="/apply" element={<VendorApplicationPage />} />

        {/* Vendor Dashboard Routes */}
        <Route path="/analytics" element={<VendorAnalyticsDashboard />} />
        <Route path="/commissions" element={<CommissionPayoutPage />} />

        {/* Admin Vendor Management Routes */}
        <Route path="/admin/vendors" element={<VendorManagementPage />} />
        <Route path="/admin/vendor-performance" element={<VendorPerformancePage />} />
      </Routes>
    </VendorProvider>
  );
};

export default VendorRoutes;