import React, { useState } from 'react';
import { LogIn, Eye, EyeOff, Activity } from 'lucide-react';
import { LoginCredentials } from '../types/api';

interface LoginFormProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  isLoading: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, isLoading }) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.email || !credentials.password) {
      alert('Por favor, preencha todos os campos');
      return;
    }
    await onLogin(credentials);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Robô Invest Option</h1>
          <p className="text-gray-600 mt-2">Faça login com suas credenciais da corretora</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email da Corretora
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              className="input"
              placeholder="seu@email.com"
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha da Corretora
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                className="input pr-10"
                placeholder="Sua senha da corretora"
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isLoading || !credentials.email || !credentials.password}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Conectando à corretora...
              </div>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Entrar no Robô
              </>
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-center text-sm text-yellow-800">
            <p className="font-medium mb-1">⚠️ IMPORTANTE</p>
            <p>Use apenas suas credenciais REAIS da Invest Option</p>
            <p className="mt-1">O robô executará operações em sua conta real</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-center text-xs text-blue-800">
            <p className="font-medium mb-1">💡 MODO DEMONSTRAÇÃO</p>
            <p>Se não conseguir conectar com a API real,</p>
            <p>o sistema funcionará em modo de demonstração</p>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Robô automatizado para operações binárias</p>
          <p>2 operações CALL + 3 operações PUT por ciclo</p>
        </div>
      </div>
    </div>
  );
};