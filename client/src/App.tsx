import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import AppRoutes from './routes/AppRoutes';
import useThemeStore, { applyThemeToDOM } from './store/themeStore';

export const App = () => {
  const { theme } = useThemeStore();

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  return (
    <ToastProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppRoutes />
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;