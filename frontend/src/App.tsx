import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Dashboard from './Pages/Dashboard';
import Patients from './Pages/Patients';
import Referrals from './Pages/Referrals';
import Appointments from './Pages/Appointments';
import Laboratories from './Pages/Laboratories';
import Doctors from './Pages/Doctors';
import Hospitals from './Pages/Hospitals';
import Settings from './Pages/Settings';
import PlaceholderPage from './Pages/PlaceholderPage';
import MedicalRecords from './Pages/MedicalRecords';
import Messages from './Pages/Messages';
import Compliance from './Pages/Compliance';
import SyncCenter from './Pages/SyncCenter';

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
        <Route path="patients/:id/records" element={<MedicalRecords />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="referrals" element={<Referrals />} />
        <Route path="doctors" element={<Doctors />} />
        <Route path="hospitals" element={<Hospitals />} />
        <Route path="laboratories" element={<Laboratories />} />
        <Route path="messages" element={<Messages />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="sync" element={<SyncCenter />} />
        <Route
          path="reports"
          element={<PlaceholderPage title="Reports" description="Analytics and reporting coming soon." />}
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
    <ThemeProvider>
      <LanguageProvider><AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider></LanguageProvider>
    </ThemeProvider>
  );
}
