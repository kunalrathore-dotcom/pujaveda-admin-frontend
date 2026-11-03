import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout";
import AdminProtectedRoute from "./routes/AdminProtectedRoute";
import AdminLoginPage from "./pages/auth/AdminLoginPage";
import AdminForgotPasswordPage from "./pages/auth/AdminForgotPasswordPage";
import AdminVerifyOtpPage from "./pages/auth/AdminVerifyOtpPage";
import AdminResetPasswordPage from "./pages/auth/AdminResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import CategoriesPage from "./pages/CategoriesPage";
import SubcategoriesPage from "./pages/SubcategoriesPage";
import BannerPage from "./pages/BannerPage";
import PromotionalSectionsPage from "./pages/PromotionalSectionsPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import EarningsPage from "./pages/EarningsPage";
import CustomersPage from "./pages/CustomersPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import CouponsPage from "./pages/CouponsPage";
import BlogPage from "./pages/BlogPage";
import TaxSettingsPage from "./pages/TaxSettingsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import ScrollToTop from "./components/common/ScrollToTop";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Admin Authentication & Password Recovery */}
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="/forgot-password" element={<AdminForgotPasswordPage />} />
        <Route path="/verify-otp" element={<AdminVerifyOtpPage />} />
        <Route path="/reset-password" element={<AdminResetPasswordPage />} />

        {/* Protected Admin Dashboard & Management */}
        <Route element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="subcategories" element={<SubcategoriesPage />} />
            <Route path="banners" element={<BannerPage />} />
            <Route path="promotional-sections" element={<PromotionalSectionsPage />} />
            {/* Backward compatibility redirect for old promotions link */}
            <Route path="promotions" element={<Navigate to="/promotional-sections" replace />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="earnings" element={<EarningsPage />} />
            <Route path="manage-earning" element={<EarningsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="view-user/:id" element={<CustomerDetailPage />} />
            <Route path="coupons" element={<CouponsPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="taxes" element={<TaxSettingsPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
          </Route>
        </Route>

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
