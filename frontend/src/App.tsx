import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { isAuthenticated } from './services/auth';
import SensorDetailPage from './pages/SensorDetailPage';
import UserActivitiesPage from './pages/UserActivitiesPage';
import RoleProtectedRoute from './routes/RoleProtectedRoute';
import CompanyManagementPage from './pages/CompanyManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import SensorManagementPage from './pages/SensorManagementPage';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const auth = isAuthenticated();
  return auth ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          isAuthenticated() ? <Navigate to="/dashboard" /> : <LoginPage />
        } />

        {/* Protected routes */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        } />

        <Route path="/sensors/:sensorId" element={
          <PrivateRoute>
            <SensorDetailPage />
          </PrivateRoute>
        } />

        <Route path="/user-activities" element={
          <PrivateRoute>
            <RoleProtectedRoute allowedRoles={['system_admin', 'company_admin']}>
              <UserActivitiesPage />
            </RoleProtectedRoute>
          </PrivateRoute>
        } />

        <Route path="/companies" element={
          <PrivateRoute>
            <RoleProtectedRoute allowedRoles={['system_admin']}>
              <CompanyManagementPage />
            </RoleProtectedRoute>
          </PrivateRoute>
        } />

        <Route path="/users" element={
          <PrivateRoute>
            <RoleProtectedRoute allowedRoles={['system_admin', 'company_admin']}>
              <UserManagementPage />
            </RoleProtectedRoute>
          </PrivateRoute>
        } />

        <Route path="/sensors" element={
          <PrivateRoute>
            <RoleProtectedRoute allowedRoles={['system_admin']}>
              <SensorManagementPage />
            </RoleProtectedRoute>
          </PrivateRoute>
        } />

        {/* Redirect / to /dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" />} />

        {/* 404 - Not found */}
        <Route path="*" element={
          <div className="flex items-center justify-center min-h-screen flex-col">
            <h1 className="text-2xl font-bold mb-4">Sayfa Bulunamadı</h1>
            <p className="mb-4">Aradığınız sayfa bulunamadı.</p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        } />
      </Routes>
    </Router>
  );
};

export default App;