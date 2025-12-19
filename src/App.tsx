
import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import Home from './pages/Home';
import { Catalog } from './pages/Catalog';
import { Booking } from './pages/Booking';
import { CalendarView } from './pages/CalendarView';
import { Login } from './pages/Login';
import { UserProfile } from './pages/UserProfile';
import { Contact } from './pages/Contact';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import ReactLazy = React.lazy;

const ENABLE_ADMIN = import.meta.env.VITE_ENABLE_ADMIN === 'true';
const AdminDashboardLazy = ENABLE_ADMIN ? ReactLazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard }))) : null;
const AdminCheckinLazy = ENABLE_ADMIN ? ReactLazy(() => import('./pages/AdminCheckin').then(m => ({ default: m.AdminCheckin }))) : null;

import { LoadingScreen } from './components/layout/LoadingScreen';
import { useApp } from './context/AppContext';

const LayoutWrapper: React.FC = () => {
  const location = useLocation();
  const { loading } = useApp();

  const isAuthPage = location.pathname === '/login';
  const isAdminPage = location.pathname.startsWith('/admin');
  const isBookingPage = location.pathname.startsWith('/booking');
  const isProfilePage = location.pathname === '/profile';

  return (
    <div className="flex flex-col min-h-screen font-sans text-slate-900">
      {loading && <LoadingScreen />}
      {!isAuthPage && !isAdminPage && <Navbar />}

      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/booking/:id" element={<Booking />} />
            <Route path="/calendar" element={<CalendarView />} />
            {ENABLE_ADMIN && AdminDashboardLazy && (
              <Route path="/admin" element={
                <React.Suspense fallback={<div />}>
                  <AdminDashboardLazy />
                </React.Suspense>
              } />
            )}
            {ENABLE_ADMIN && AdminCheckinLazy && (
              <Route path="/admin/checkin" element={
                <React.Suspense fallback={<div />}>
                  <AdminCheckinLazy />
                </React.Suspense>
              } />
            )}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Footer at Bottom, Hidden on Reservation System and Profile */}
      {!isAuthPage && !isAdminPage && !isBookingPage && !isProfilePage && <Footer />}
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <AppProvider>
          <Router>
            <LayoutWrapper>
              {/* Routes are now handled inside LayoutWrapper for AnimatePresence */}
            </LayoutWrapper>
          </Router>
        </AppProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
