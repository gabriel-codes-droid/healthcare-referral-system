import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './Pages/Login';
import Dashboard from './Pages/Dashboard';
import Patients from './Pages/Patients';
import Referrals from './Pages/Referrals';
import Appointments from './Pages/Appointments';
import Laboratories from './Pages/Laboratories';
import Doctors from './Pages/Doctors';
import Hospitals from './Pages/Hospitals';
import PlaceholderPage from './Pages/PlaceholderPage';

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

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
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
        <Route path="appointments" element={<Appointments />} />
        <Route path="referrals" element={<Referrals />} />
        <Route path="doctors" element={<Doctors />} />
        <Route path="hospitals" element={<Hospitals />} />
        <Route path="laboratories" element={<Laboratories />} />
        <Route
          path="reports"
          element={<PlaceholderPage title="Reports" description="Analytics and reporting coming soon." />}
        />
        <Route
          path="messages"
          element={<PlaceholderPage title="Messages" description="Secure messaging between providers." />}
        />
        <Route
          path="billing"
          element={<PlaceholderPage title="Billing" description="Billing and insurance management." />}
        />
        <Route
          path="settings"
          element={<PlaceholderPage title="Settings" description="Account and system preferences." />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
