import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AdminProtectedRoute } from './auth/AdminProtectedRoute';

// Kiosk Pages
import KioskPage from './pages/kiosk/KioskPage';
import { KioskHomePage } from './pages/kiosk/KioskHomePage';
import { KioskCategoryPage } from './pages/kiosk/KioskCategoryPage';
import { KioskFoodPage } from './pages/kiosk/KioskFoodPage';
import { KioskOrdersPage } from './pages/kiosk/KioskOrdersPage';
import { KioskStorePage } from './pages/kiosk/KioskStorePage';
import { KioskStoreProductDetail } from './pages/kiosk/KioskStoreProductDetail';
import { KioskStoreCart } from './pages/kiosk/KioskStoreCart';
import { KioskStoreCheckout } from './pages/kiosk/KioskStoreCheckout';
import { KioskServicesPage } from './pages/kiosk/KioskServicesPage';
import { KioskServiceDetail } from './pages/kiosk/KioskServiceDetail';
import { KioskServiceBooking } from './pages/kiosk/KioskServiceBooking';
import { RedirectToStore } from './pages/kiosk/RedirectToStore';
import { RenovaHomePage } from './pages/kiosk/RenovaHomePage';
import { RenovaAboutPage } from './pages/kiosk/RenovaAboutPage';

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
import ProductsManagementPage from './pages/admin/ProductsManagementPage';
import DevicesManagementPage from './pages/admin/DevicesManagementPage';
import FeedbackPage from './pages/admin/FeedbackPage';
import InventoryPage from './pages/admin/InventoryPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Kiosk Routes - More specific routes first */}
          
          {/* Renova Clinic Routes */}
          <Route path="/kiosk/:deviceId/renova/about" element={<RenovaAboutPage />} />
          <Route path="/kiosk/:deviceId/renova/home" element={<RenovaHomePage />} />
          
          {/* Store Routes - Tienda Unificada (Productos y Servicios) */}
          <Route path="/kiosk/:deviceId/store/checkout" element={<KioskStoreCheckout />} />
          <Route path="/kiosk/:deviceId/store/cart" element={<KioskStoreCart />} />
          <Route path="/kiosk/:deviceId/store/product/:productId" element={<KioskStoreProductDetail />} />
          <Route path="/kiosk/:deviceId/store" element={<KioskStorePage />} />
          
          {/* Services Routes - Redirigir a tienda unificada */}
          <Route path="/kiosk/:deviceId/services/:serviceId/booking" element={<KioskServiceBooking />} />
          <Route path="/kiosk/:deviceId/services/:serviceId" element={<KioskServiceDetail />} />
          <Route path="/kiosk/:deviceId/services" element={<RedirectToStore />} />
          
          {/* Other Kiosk Routes */}
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
    </AuthProvider>
  );
}

export default App;
