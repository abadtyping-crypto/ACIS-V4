import './App.css';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import RequireAuth from './components/auth/RequireAuth';
import AppLayout from './components/layout/AppLayout';
import TenantRouteSync from './components/layout/TenantRouteSync';
import { DEFAULT_TENANT_ID } from './config/tenants';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { ThemeProvider } from './context/ThemeContext';
import AdaptiveProfilePage from './pages/AdaptiveProfilePage';
import DashboardPage from './pages/DashboardPage';
import FavoritesPage from './pages/FavoritesPage';
import LoginPage from './pages/LoginPage';
import NotificationsPage from './pages/NotificationsPage';
import PortalManagementPage from './pages/PortalManagementPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import SettingsPage from './pages/SettingsPage';
import ClientsOnboardingPage from './pages/ClientsOnboardingPage';
import ClientDetailsPage from './pages/ClientDetailsPage';
import ModulePlaceholderPage from './pages/ModulePlaceholderPage';

import TitleBar from './components/layout/TitleBar';

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TenantProvider>
          <BrowserRouter>
            <TitleBar />
            <Routes>
              <Route path="/" element={<Navigate to={`/t/${DEFAULT_TENANT_ID}/login`} replace />} />
              <Route path="/t/:tenantId" element={<TenantRouteSync />}>
                <Route path="login" element={<LoginPage />} />
                <Route element={<RequireAuth />}>
                  <Route element={<AppLayout />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route
                      path="daily-transactions"
                      element={<ModulePlaceholderPage title="Daily Transactions" subtitle="Daily Transactions module placeholder." />}
                    />
                    <Route
                      path="tasks-tracking"
                      element={<ModulePlaceholderPage title="Task's & Traking" subtitle="Tasks and tracking module placeholder." />}
                    />
                    <Route
                      path="invoice-management"
                      element={<ModulePlaceholderPage title="Invoice Management" subtitle="Invoice Management module placeholder." />}
                    />
                    <Route
                      path="proforma-quotation"
                      element={<ModulePlaceholderPage title="Proforma / Quotation" subtitle="Proforma and quotation module placeholder." />}
                    />
                    <Route
                      path="operation-expenses"
                      element={<ModulePlaceholderPage title="Opertaion Expense's" subtitle="Operation expenses module placeholder." />}
                    />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="profile" element={<AdaptiveProfilePage />} />
                    <Route path="profile/edit" element={<ProfilePage />} />
                    <Route path="portal-management" element={<PortalManagementPage />} />
                    <Route
                      path="document-calendar"
                      element={<ModulePlaceholderPage title="Document Calendar" subtitle="Document calendar module placeholder." />}
                    />
                    <Route path="client-onboarding" element={<ClientsOnboardingPage />} />
                    <Route path="clients/:clientId" element={<ClientDetailsPage />} />
                    <Route path="favorites" element={<FavoritesPage />} />
                    <Route path="search" element={<SearchPage />} />
                  </Route>
                </Route>
              </Route>
              <Route path="*" element={<Navigate to={`/t/${DEFAULT_TENANT_ID}/login`} replace />} />
            </Routes>
          </BrowserRouter>
        </TenantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
