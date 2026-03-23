import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AdminProtectedRoute } from './auth/AdminProtectedRoute';
import { SurveyProvider } from './contexts/SurveyContext';

// Kiosk Pages (no lazy loading - main route, must load fast)
import KioskPage from './pages/kiosk/KioskPage';
import { KioskHomePage } from './pages/kiosk/KioskHomePage';
import { KioskCategoryPage } from './pages/kiosk/KioskCategoryPage';
import { KioskFoodPage } from './pages/kiosk/KioskFoodPage';
import { KioskOrdersPage } from './pages/kiosk/KioskOrdersPage';

// Staff Pages (lazy loaded)
const LoginPage = lazy(() => import('./pages/staff/LoginPage'));
const DashboardPage = lazy(() => import('./pages/staff/DashboardPage'));
const OrdersPage = lazy(() => import('./pages/staff/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/staff/OrderDetailPage'));
const InventoryViewPage = lazy(() => import('./pages/staff/InventoryViewPage').then(m => ({ default: m.InventoryViewPage })));

// Admin Pages (lazy loaded)
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const UsersManagementPage = lazy(() => import('./pages/admin/UsersManagementPage'));
const ClientsManagementPage = lazy(() => import('./pages/admin/ClientsManagementPage'));
const ProductsManagementPage = lazy(() => import('./pages/admin/ProductsManagementPage'));
const DevicesManagementPage = lazy(() => import('./pages/admin/DevicesManagementPage'));
const FeedbackPage = lazy(() => import('./pages/admin/FeedbackPage'));
const InventoryPage = lazy(() => import('./pages/admin/InventoryPage'));

function App() {
  return (
    <AuthProvider>
      <SurveyProvider>
        <BrowserRouter>
          <Suspense fallback={<div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>Cargando...</div>}>
          <Routes>
          {/* Kiosk Routes - More specific routes first */}
          <Route path="/kiosk/:deviceId/food/restaurant/:restaurantId" element={<KioskFoodPage />} />
          <Route path="/kiosk/:deviceId/food" element={<KioskFoodPage />} />
          <Route path="/kiosk/:deviceId/category/:categoryId" element={<KioskCategoryPage />} />
          <Route path="/kiosk/:deviceId/orders" element={<KioskOrdersPage />} />
          
          {/* General Kiosk Route - Must be last */}
          <Route path="/kiosk/:deviceId" element={<KioskHomePage />} />
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
          </Suspense>
        </BrowserRouter>
      </SurveyProvider>
    </AuthProvider>
  );
}

export default App;
