const API_URL = 'http://localhost:8000/api';

// Interfaces para tipagem
interface LoginResponse {
  access: string;
  refresh: string;
}

interface RegisterResponse {
  access: string;
  refresh: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface DashboardData {
  message: string;
}

interface ApiError {
  [key: string]: string[] | undefined;
  non_field_errors?: string[];
}

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

const api = {
  async request<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    let response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Se o token expirou, tenta renovar
    if (response.status === 401 && token) {
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const refreshResponse = await fetch(`${API_URL}/auth/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            localStorage.setItem('access_token', refreshData.access);

            // Refaz a requisição original com o novo token
            headers['Authorization'] = `Bearer ${refreshData.access}`;
            response = await fetch(`${API_URL}${endpoint}`, {
              ...options,
              headers,
            });
          }
        }
      } catch (refreshError) {
        // Se falhar ao renovar, remove os tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        throw refreshError;
      }
    }

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw error;
    }

    return response.json() as T;
  },

  async login(username: string, password: string): Promise<LoginResponse> {
    const data: LoginResponse = await this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    return data;
  },

  async register(
    username: string,
    email: string,
    password1: string,
    password2: string
  ): Promise<RegisterResponse> {
    const data: RegisterResponse = await this.request('/auth/registration/', {
      method: 'POST',
      body: JSON.stringify({ username, email, password1, password2 }),
    });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout/', { method: 'POST' });
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },

  async getProfile(): Promise<User> {
    return this.request('/profile/');
  },

  async getDashboard(): Promise<DashboardData> {
    return this.request('/dashboard/');
  },

  async googleAuth(): Promise<void> {
    const googleClientId = '415705126821-4f0p933ksat3p8gps59g1b84qsbcl2ne.apps.googleusercontent.com';
    const redirectUri = 'http://localhost:5173/auth/google/callback';
    const scope = 'openid email profile';

    // Abre a janela de autenticação do Google
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${googleClientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=select_account`;

    console.log('Abrindo popup do Google:', authUrl);

    // Abre em uma nova janela
    const popup = window.open(
      authUrl,
      'googleAuth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    if (!popup) {
      throw new Error('Popup bloqueado pelo navegador');
    }

    // Escuta a mensagem do popup
    return new Promise((resolve, reject) => {
      let isResolved = false;

      const messageListener = (event: MessageEvent) => {
        console.log('Mensagem recebida do popup:', event.data, 'Origin:', event.origin);

        if (event.origin !== window.location.origin) {
          console.log('Origin não confere, ignorando:', event.origin);
          return;
        }

        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          console.log('Autenticação Google bem-sucedida');
          isResolved = true;
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup.close();
          this.handleGoogleCallback(event.data.code).then(resolve).catch(reject);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          console.log('Erro na autenticação Google:', event.data.error);
          isResolved = true;
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup.close();
          reject(new Error(event.data.error));
        }
      };

      window.addEventListener('message', messageListener);

      // Verifica se o popup foi fechado manualmente (com delay maior)
      const checkClosed = setInterval(() => {
        if (popup.closed && !isResolved) {
          console.log('Popup foi fechado antes da autenticação');
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          reject(new Error('Autenticação cancelada pelo usuário'));
        }
      }, 2000); // Aumentei para 2 segundos
    });
  },

  async handleGoogleCallback(code: string): Promise<void> {
    try {
      // Envia o código diretamente para o backend Django
      // O backend fará a troca do código por token e autenticação
      const response = await fetch(`${API_URL}/auth/google/callback/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          redirect_uri: 'http://localhost:5173/auth/google/callback'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha na autenticação Google');
      }

      const tokenData = await response.json();

      // Se o backend retornar tokens JWT, armazena eles
      if (tokenData.access && tokenData.refresh) {
        localStorage.setItem('access_token', tokenData.access);
        localStorage.setItem('refresh_token', tokenData.refresh);
      }
    } catch (error) {
      console.error('Erro ao processar callback do Google:', error);
      throw error;
    }
  },
};

export default api;
export type { User, DashboardData, ApiError };
