import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { RobotDashboard } from './components/RobotDashboard';
import { investOptionAPI } from './services/api';
import { LoginCredentials } from './types/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Verifica se já existe um token salvo
    if (investOptionAPI.isAuthenticated()) {
      setIsAuthenticated(true);
      // Recupera o email do localStorage se disponível
      const savedEmail = localStorage.getItem('user_email');
      if (savedEmail) {
        setUserEmail(savedEmail);
      }
    }
  }, []);

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await investOptionAPI.login(credentials);
      
      if (response.success) {
        setIsAuthenticated(true);
        setUserEmail(credentials.email);
        localStorage.setItem('user_email', credentials.email);
      } else {
        setError(response.message || 'Erro ao fazer login');
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await investOptionAPI.logout();
    setIsAuthenticated(false);
    setUserEmail('');
    localStorage.removeItem('user_email');
  };

  if (!isAuthenticated) {
    return (
      <div>
        <LoginForm onLogin={handleLogin} isLoading={isLoading} />
        {error && (
          <div className="fixed bottom-4 right-4 bg-danger-500 text-white px-4 py-2 rounded-lg shadow-lg">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <RobotDashboard 
      onLogout={handleLogout} 
      userEmail={userEmail}
    />
  );
}

export default App;