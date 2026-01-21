import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { SurveyProvider } from './contexts/SurveyContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AdminProtectedRoute } from './auth/AdminProtectedRoute';

// Kiosk Pages
import KioskPage from './pages/kiosk/KioskPage';
import { KioskHomePage } from './pages/kiosk/KioskHomePage';
import { KioskCategoryPage } from './pages/kiosk/KioskCategoryPage';
import { KioskFoodPage } from './pages/kiosk/KioskFoodPage';
import { KioskOrdersPage } from './pages/kiosk/KioskOrdersPage';

// Staff Pages
import LoginPage from './pages/staff/LoginPage';
import DashboardPage from './pages/staff/DashboardPage';
import OrdersPage from './pages/staff/OrdersPage';
import OrderDetailPage from './pages/staff/OrderDetailPage';
import { InventoryViewPage } from './pages/staff/InventoryViewPage';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UsersManagementPage from './pages/admin/UsersManagementPage';
import ClientsManagementPage from './pages/admin/ClientsManagementPage';
import ProductsManagementPage from './pages/admin/ProductsManagementPage';
import DevicesManagementPage from './pages/admin/DevicesManagementPage';
import FeedbackPage from './pages/admin/FeedbackPage';
import InventoryPage from './pages/admin/InventoryPage';

function App() {
  return (
    <AuthProvider>
      <SurveyProvider>
        <BrowserRouter>
          <Routes>
            {/* Kiosk Routes - New Design */}
            <Route path="/kiosk/:deviceId" element={<KioskHomePage />} />
            <Route path="/kiosk/:deviceId/category/:categoryId" element={<KioskCategoryPage />} />
            <Route path="/kiosk/:deviceId/food" element={<KioskFoodPage />} />
            <Route path="/kiosk/:deviceId/food/restaurant/:restaurantId" element={<KioskFoodPage />} />
            <Route path="/kiosk/:deviceId/orders" element={<KioskOrdersPage />} />
            <Route path="/kiosk" element={<Navigate to="/kiosk/01" replace />} />

          {/* Staff Routes */}
          <Route path="/staff/login" element={<LoginPage />} />
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/inventory"
            element={
              <ProtectedRoute>
                <InventoryViewPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboardPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminProtectedRoute>
                <UsersManagementPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/clients"
            element={
              <AdminProtectedRoute>
                <ClientsManagementPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <AdminProtectedRoute>
                <ProductsManagementPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/feedback"
            element={
              <AdminProtectedRoute>
                <FeedbackPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/devices"
            element={
              <AdminProtectedRoute>
                <DevicesManagementPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/inventory"
            element={
              <AdminProtectedRoute>
                <InventoryPage />
              </AdminProtectedRoute>
            }
          />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/kiosk" replace />} />
            <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </SurveyProvider>
    </AuthProvider>
  );
}

export default App;
