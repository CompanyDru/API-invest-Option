import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  Settings, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  LogOut,
  Activity,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { RobotConfig, OperationLog, UserBalance } from '../types/api';
import { investOptionAPI } from '../services/api';

interface RobotDashboardProps {
  onLogout: () => void;
  userEmail: string;
}

export const RobotDashboard: React.FC<RobotDashboardProps> = ({ onLogout, userEmail }) => {
  const [config, setConfig] = useState<RobotConfig>({
    isActive: false,
    callOperations: 2,
    putOperations: 3,
    operationAmount: 10,
    asset: 'EURUSD',
    expiration: 60
  });

  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [operations, setOperations] = useState<OperationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [totalCycles, setTotalCycles] = useState(0);
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadBalance(),
      loadAssets()
    ]);
  };

  const loadBalance = async () => {
    setIsLoadingBalance(true);
    try {
      const userBalance = await investOptionAPI.getBalance();
      if (userBalance) {
        setBalance(userBalance);
      }
    } catch (error) {
      console.error('Erro ao carregar saldo:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const loadAssets = async () => {
    try {
      const availableAssets = await investOptionAPI.getAssets();
      setAssets(availableAssets);
    } catch (error) {
      console.error('Erro ao carregar ativos:', error);
    }
  };

  const executeOperationCycle = async () => {
    if (!config.isActive) return;

    setIsLoading(true);
    const cycleOperations: OperationLog[] = [];

    try {
      // Executa 2 operações CALL
      for (let i = 0; i < config.callOperations; i++) {
        const operation = {
          type: 'CALL' as const,
          amount: config.operationAmount,
          asset: config.asset,
          expiration: config.expiration
        };

        const result = await investOptionAPI.executeTrade(operation);
        
        const log: OperationLog = {
          id: result.trade_id || `call_${Date.now()}_${i}`,
          timestamp: new Date(),
          type: 'CALL',
          amount: config.operationAmount,
          asset: config.asset,
          result: result.success ? 'PENDING' : 'LOSS'
        };

        cycleOperations.push(log);
        
        // Aguarda 3 segundos entre operações para evitar sobrecarga
        if (i < config.callOperations - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      // Aguarda 5 segundos antes das operações PUT
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Executa 3 operações PUT
      for (let i = 0; i < config.putOperations; i++) {
        const operation = {
          type: 'PUT' as const,
          amount: config.operationAmount,
          asset: config.asset,
          expiration: config.expiration
        };

        const result = await investOptionAPI.executeTrade(operation);
        
        const log: OperationLog = {
          id: result.trade_id || `put_${Date.now()}_${i}`,
          timestamp: new Date(),
          type: 'PUT',
          amount: config.operationAmount,
          asset: config.asset,
          result: result.success ? 'PENDING' : 'LOSS'
        };

        cycleOperations.push(log);
        
        // Aguarda 3 segundos entre operações
        if (i < config.putOperations - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      setOperations(prev => [...cycleOperations, ...prev]);
      setCurrentCycle(prev => prev + 1);
      setTotalCycles(prev => prev + 1);
      
      // Atualiza o saldo após as operações
      await loadBalance();

      // Se o robô ainda estiver ativo, agenda o próximo ciclo
      if (config.isActive) {
        setTimeout(() => {
          executeOperationCycle();
        }, 10000); // Aguarda 10 segundos antes do próximo ciclo
      }

    } catch (error) {
      console.error('Erro ao executar ciclo de operações:', error);
      setConfig(prev => ({ ...prev, isActive: false }));
    } finally {
      setIsLoading(false);
    }
  };

  const startRobot = async () => {
    if (balance && balance.balance < config.operationAmount * (config.callOperations + config.putOperations)) {
      alert('Saldo insuficiente para executar todas as operações do ciclo');
      return;
    }

    setConfig(prev => ({ ...prev, isActive: true }));
    setCurrentCycle(0);
    await executeOperationCycle();
  };

  const stopRobot = () => {
    setConfig(prev => ({ ...prev, isActive: false }));
    setIsLoading(false);
  };

  const handleConfigChange = (key: keyof RobotConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const getOperationIcon = (type: 'CALL' | 'PUT') => {
    return type === 'CALL' ? (
      <TrendingUp className="w-4 h-4 text-success-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-danger-600" />
    );
  };

  const getResultColor = (result?: string) => {
    switch (result) {
      case 'WIN': return 'text-success-600';
      case 'LOSS': return 'text-danger-600';
      default: return 'text-yellow-600';
    }
  };

  const getResultText = (result?: string) => {
    switch (result) {
      case 'WIN': return 'GANHOU';
      case 'LOSS': return 'PERDEU';
      default: return 'PENDENTE';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-primary-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Robô Invest Option</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {userEmail}
              </div>
              <button
                onClick={onLogout}
                className="btn-secondary"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Painel de Controle */}
          <div className="lg:col-span-1">
            <div className="card p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Configurações do Robô
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor por Operação (USD)
                  </label>
                  <input
                    type="number"
                    value={config.operationAmount}
                    onChange={(e) => handleConfigChange('operationAmount', Number(e.target.value))}
                    className="input"
                    min="1"
                    max="1000"
                    disabled={config.isActive}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ativo
                  </label>
                  <select
                    value={config.asset}
                    onChange={(e) => handleConfigChange('asset', e.target.value)}
                    className="input"
                    disabled={config.isActive}
                  >
                    <option value="EURUSD">EUR/USD</option>
                    <option value="GBPUSD">GBP/USD</option>
                    <option value="USDJPY">USD/JPY</option>
                    <option value="AUDUSD">AUD/USD</option>
                    <option value="USDCAD">USD/CAD</option>
                    <option value="EURGBP">EUR/GBP</option>
                    <option value="EURJPY">EUR/JPY</option>
                    <option value="GBPJPY">GBP/JPY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempo de Expiração
                  </label>
                  <select
                    value={config.expiration}
                    onChange={(e) => handleConfigChange('expiration', Number(e.target.value))}
                    className="input"
                    disabled={config.isActive}
                  >
                    <option value={60}>1 minuto</option>
                    <option value={300}>5 minutos</option>
                    <option value={900}>15 minutos</option>
                    <option value={1800}>30 minutos</option>
                    <option value={3600}>1 hora</option>
                  </select>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Operações CALL por ciclo:</span>
                    <span className="text-sm text-gray-900 font-semibold">{config.callOperations}</span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700">Operações PUT por ciclo:</span>
                    <span className="text-sm text-gray-900 font-semibold">{config.putOperations}</span>
                  </div>
                  <div className="flex items-center justify-between mb-4 p-2 bg-blue-50 rounded">
                    <span className="text-sm font-medium text-blue-700">Total por ciclo:</span>
                    <span className="text-sm text-blue-900 font-bold">
                      ${(config.operationAmount * (config.callOperations + config.putOperations)).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {!config.isActive ? (
                    <button
                      onClick={startRobot}
                      className="btn-success flex-1"
                      disabled={isLoading || !balance}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Iniciar Robô
                    </button>
                  ) : (
                    <button
                      onClick={stopRobot}
                      className="btn-danger flex-1"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Parar Robô
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Status do Saldo */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Saldo da Conta
              </h3>
              {balance ? (
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    ${balance.balance.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {balance.currency || 'USD'}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">
                  {isLoadingBalance ? 'Carregando...' : 'Erro ao carregar saldo'}
                </div>
              )}
              <button
                onClick={loadBalance}
                className="btn-secondary mt-3 text-sm w-full"
                disabled={isLoadingBalance}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                Atualizar Saldo
              </button>
            </div>
          </div>

          {/* Área Principal */}
          <div className="lg:col-span-2">
            {/* Status do Robô */}
            <div className="card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Status do Robô</h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  config.isActive 
                    ? 'bg-success-100 text-success-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {config.isActive ? 'ATIVO' : 'INATIVO'}
                </div>
              </div>

              {config.isActive && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-blue-800 font-medium">
                      Robô executando operações automaticamente...
                    </span>
                  </div>
                  {isLoading && (
                    <div className="mt-2 flex items-center text-blue-700">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Processando ciclo de operações ({config.callOperations} CALL + {config.putOperations} PUT)
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{totalCycles}</div>
                  <div className="text-sm text-gray-600">Ciclos Executados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{operations.length}</div>
                  <div className="text-sm text-gray-600">Total de Operações</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {operations.filter(op => op.result === 'WIN').length}
                  </div>
                  <div className="text-sm text-gray-600">Operações Ganhas</div>
                </div>
              </div>
            </div>

            {/* Log de Operações */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Histórico de Operações</h3>
                {operations.length > 0 && (
                  <button
                    onClick={() => setOperations([])}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Limpar Histórico
                  </button>
                )}
              </div>
              
              {operations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma operação executada ainda</p>
                  <p className="text-sm mt-1">Clique em "Iniciar Robô" para começar</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {operations.map((operation) => (
                    <div
                      key={operation.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {getOperationIcon(operation.type)}
                        <div>
                          <div className="font-medium text-gray-900">
                            {operation.type} - {operation.asset}
                          </div>
                          <div className="text-sm text-gray-600">
                            {operation.timestamp.toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          ${operation.amount.toFixed(2)}
                        </div>
                        <div className={`text-sm font-medium ${getResultColor(operation.result)}`}>
                          {getResultText(operation.result)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};