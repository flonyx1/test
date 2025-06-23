import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import AuthScreen from './components/AuthScreen';
import MainApp from './components/MainApp';
import LoadingScreen from './components/LoadingScreen';

function AppContent() {
  const { user, loading } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (loading || isInitializing) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <SocketProvider>
      <MainApp />
    </SocketProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-accent-900">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;