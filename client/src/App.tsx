import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastProvider } from './components/ui/Toast';
import AppRoutes from './routes/AppRoutes';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const ENABLE_GOOGLE_OAUTH = import.meta.env.VITE_ENABLE_GOOGLE_OAUTH !== 'false';

export const App = () => {
  // Only render GoogleOAuthProvider if client ID is configured AND enabled
  // This prevents 403 errors in console when Google Cloud Console is not configured
  const isGoogleConfigured = !!GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.length > 10 && ENABLE_GOOGLE_OAUTH;

  const appContent = (
    <ToastProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </ToastProvider>
  );

  // Only wrap with GoogleOAuthProvider if configured and enabled
  if (isGoogleConfigured) {
    return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{appContent}</GoogleOAuthProvider>;
  }

  return appContent;
};

export default App;
