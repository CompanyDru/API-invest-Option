export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    balance: number;
  };
}

export interface TradeOperation {
  type: 'CALL' | 'PUT';
  amount: number;
  asset: string;
  expiration: number;
}

export interface TradeResponse {
  success: boolean;
  message?: string;
  trade_id?: string;
  result?: 'WIN' | 'LOSS';
}

export interface UserBalance {
  balance: number;
  currency: string;
}

export interface RobotConfig {
  isActive: boolean;
  callOperations: number;
  putOperations: number;
  operationAmount: number;
  asset: string;
  expiration: number;
}

export interface OperationLog {
  id: string;
  timestamp: Date;
  type: 'CALL' | 'PUT';
  amount: number;
  asset: string;
  result?: 'WIN' | 'LOSS' | 'PENDING';
  profit?: number;
}