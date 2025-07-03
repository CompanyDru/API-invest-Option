import axios from 'axios';
import { 
  LoginCredentials, 
  LoginResponse, 
  TradeOperation, 
  TradeResponse, 
  UserBalance 
} from '../types/api';

class InvestOptionAPI {
  private baseURL = 'https://api-demo.investoption.com';
  private token: string | null = null;
  private ssid: string | null = null;

  constructor() {
    // Recupera o token do localStorage se existir
    this.token = localStorage.getItem('invest_option_token');
    this.ssid = localStorage.getItem('invest_option_ssid');
  }

  private getHeaders() {
    const headers: any = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    if (this.ssid) {
      headers['Cookie'] = `ssid=${this.ssid}`;
    }
    
    return headers;
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // Primeiro, fazer login para obter o SSID
      const loginResponse = await axios.post(`${this.baseURL}/login`, {
        email: credentials.email,
        password: credentials.password,
        platform: 'web'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (loginResponse.data.isSuccessful) {
        // Extrair SSID dos cookies da resposta
        const setCookieHeader = loginResponse.headers['set-cookie'];
        if (setCookieHeader) {
          const ssidCookie = setCookieHeader.find((cookie: string) => cookie.includes('ssid='));
          if (ssidCookie) {
            this.ssid = ssidCookie.split('ssid=')[1].split(';')[0];
            localStorage.setItem('invest_option_ssid', this.ssid);
          }
        }

        // Obter informações do perfil
        const profileResponse = await axios.post(`${this.baseURL}/getProfile`, {}, {
          headers: this.getHeaders()
        });

        if (profileResponse.data.isSuccessful) {
          return {
            success: true,
            user: {
              id: profileResponse.data.result.userId.toString(),
              email: profileResponse.data.result.email,
              name: profileResponse.data.result.name || credentials.email,
              balance: profileResponse.data.result.balance || 0
            }
          };
        }
      }

      return {
        success: false,
        message: loginResponse.data.message || 'Erro ao fazer login'
      };
    } catch (error: any) {
      console.error('Erro no login:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao conectar com a corretora'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.ssid) {
        await axios.post(`${this.baseURL}/logout`, {}, {
          headers: this.getHeaders()
        });
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      this.token = null;
      this.ssid = null;
      localStorage.removeItem('invest_option_token');
      localStorage.removeItem('invest_option_ssid');
    }
  }

  async getBalance(): Promise<UserBalance | null> {
    try {
      if (!this.ssid) {
        throw new Error('Sessão não encontrada');
      }

      const response = await axios.post(`${this.baseURL}/getProfile`, {}, {
        headers: this.getHeaders()
      });

      if (response.data.isSuccessful) {
        return {
          balance: response.data.result.balance || 0,
          currency: response.data.result.currency || 'USD'
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao obter saldo:', error);
      return null;
    }
  }

  async executeTrade(operation: TradeOperation): Promise<TradeResponse> {
    try {
      if (!this.ssid) {
        throw new Error('Sessão não encontrada');
      }

      // Mapear o tipo de operação
      const optionType = operation.type === 'CALL' ? 'call' : 'put';

      const tradeData = {
        asset: operation.asset,
        amount: operation.amount,
        time: operation.expiration,
        action: optionType,
        isDemo: false // Definir como false para conta real
      };

      const response = await axios.post(`${this.baseURL}/buyOption`, tradeData, {
        headers: this.getHeaders()
      });

      if (response.data.isSuccessful) {
        return {
          success: true,
          trade_id: response.data.result.id?.toString(),
          message: 'Operação executada com sucesso'
        };
      }

      return {
        success: false,
        message: response.data.message || 'Erro ao executar operação'
      };
    } catch (error: any) {
      console.error('Erro ao executar operação:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao executar operação'
      };
    }
  }

  async getTradeResult(tradeId: string): Promise<TradeResponse> {
    try {
      if (!this.ssid) {
        throw new Error('Sessão não encontrada');
      }

      const response = await axios.post(`${this.baseURL}/getOptionResult`, {
        optionId: parseInt(tradeId)
      }, {
        headers: this.getHeaders()
      });

      if (response.data.isSuccessful) {
        const result = response.data.result;
        return {
          success: true,
          trade_id: tradeId,
          result: result.win ? 'WIN' : 'LOSS',
          message: result.win ? 'Operação vencedora' : 'Operação perdedora'
        };
      }

      return {
        success: false,
        message: response.data.message || 'Erro ao obter resultado'
      };
    } catch (error: any) {
      console.error('Erro ao obter resultado:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao obter resultado'
      };
    }
  }

  async getAssets(): Promise<any[]> {
    try {
      if (!this.ssid) {
        throw new Error('Sessão não encontrada');
      }

      const response = await axios.post(`${this.baseURL}/getInitData`, {}, {
        headers: this.getHeaders()
      });

      if (response.data.isSuccessful && response.data.result.assets) {
        return response.data.result.assets;
      }

      return [];
    } catch (error) {
      console.error('Erro ao obter ativos:', error);
      return [];
    }
  }

  isAuthenticated(): boolean {
    return !!this.ssid;
  }
}

export const investOptionAPI = new InvestOptionAPI();