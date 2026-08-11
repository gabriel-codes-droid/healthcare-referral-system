import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Dashboard from './Pages/Dashboard';
import Patients from './Pages/Patients';
import PatientRecord from './Pages/PatientRecord';
import Referrals from './Pages/Referrals';
import Appointments from './Pages/Appointments';
import Laboratories from './Pages/Laboratories';
import AuditLogs from './Pages/AuditLogs';
import Doctors from './Pages/Doctors';
import Hospitals from './Pages/Hospitals';
import Settings from './Pages/Settings';
import Reports from './Pages/Reports';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader" />
        <p>Loading Sympra...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RoleRoute({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { user } = useAuth();
  if (user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/" replace /> : <Register />}
      />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="patients/:id" element={<PatientRecord />} />
        <Route path="appointments" element={<RoleRoute roles={['admin', 'clinic', 'hospital']}><Appointments /></RoleRoute>} />
        <Route path="referrals" element={<RoleRoute roles={['admin', 'clinic', 'hospital']}><Referrals /></RoleRoute>} />
        <Route path="doctors" element={<RoleRoute roles={['admin', 'clinic', 'hospital']}><Doctors /></RoleRoute>} />
        <Route path="hospitals" element={<RoleRoute roles={['admin', 'clinic', 'hospital']}><Hospitals /></RoleRoute>} />
        <Route path="laboratories" element={<Laboratories />} />
        <Route path="audit-logs" element={<RoleRoute roles={['admin']}><AuditLogs /></RoleRoute>} />
        <Route
          path="reports"
          element={<Reports />}
        />
        <Route
          path="settings"
          element={<Settings />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
