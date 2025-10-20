import { API_CONFIG, GOOGLE_CONFIG, AUTH_CONFIG } from '../config'

// Interfaces para tipagem
interface LoginResponse {
  access: string
  refresh: string
}

interface RegisterResponse {
  access: string
  refresh: string
}

interface User {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
}

interface DashboardData {
  message: string
}

interface ApiError {
  [key: string]: string[] | undefined
  non_field_errors?: string[]
}

interface RequestOptions {
  method?: string
  headers?: Record<string, string>
  body?: string
}

const api = {
  async request<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    }

    let response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      ...options,
      headers
    })

    // Se o token expirou, tenta renovar
    if (response.status === 401 && token) {
      try {
        const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_KEY)
        if (refreshToken) {
          const refreshResponse = await fetch(
            `${API_CONFIG.BASE_URL}/auth/token/refresh/`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh: refreshToken })
            }
          )

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json()
            localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, refreshData.access)

            // Refaz a requisição original com o novo token
            headers['Authorization'] = `Bearer ${refreshData.access}`
            response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
              ...options,
              headers
            })
          }
        }
      } catch (refreshError) {
        localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY)
        localStorage.removeItem(AUTH_CONFIG.REFRESH_KEY)
        throw refreshError
      }
    }

    if (!response.ok) {
      const error: ApiError = await response.json()
      throw error
    }

    return response.json() as T
  },

  async login(username: string, password: string): Promise<LoginResponse> {
    const data: LoginResponse = await this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, data.access)
    localStorage.setItem(AUTH_CONFIG.REFRESH_KEY, data.refresh)
    return data
  },

  async register(
    username: string,
    email: string,
    password1: string,
    password2: string
  ): Promise<RegisterResponse> {
    const data: RegisterResponse = await this.request('/auth/registration/', {
      method: 'POST',
      body: JSON.stringify({ username, email, password1, password2 })
    })
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, data.access)
    localStorage.setItem(AUTH_CONFIG.REFRESH_KEY, data.refresh)
    return data
  },

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout/', { method: 'POST' })
    } finally {
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY)
      localStorage.removeItem(AUTH_CONFIG.REFRESH_KEY)
    }
  },

  async getProfile(): Promise<User> {
    return this.request('/profile/')
  },

  async getDashboard(): Promise<DashboardData> {
    return this.request('/dashboard/')
  },

  async googleAuth(): Promise<void> {
    // Validar se o Client ID está configurado
    if (!GOOGLE_CONFIG.CLIENT_ID) {
      throw new Error(
        'Google Client ID não configurado. Verifique o arquivo .env'
      )
    }

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CONFIG.CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(GOOGLE_CONFIG.REDIRECT_URI)}&` +
      `scope=${encodeURIComponent(GOOGLE_CONFIG.SCOPE)}&` +
      `response_type=${GOOGLE_CONFIG.RESPONSE_TYPE}&` +
      `access_type=${GOOGLE_CONFIG.ACCESS_TYPE}&` +
      `prompt=select_account`

    console.log('🔐 Iniciando autenticação Google...')
    console.log('Client ID:', `${GOOGLE_CONFIG.CLIENT_ID.substring(0, 30)}...`)
    console.log('Redirect URI:', GOOGLE_CONFIG.REDIRECT_URI)

    // Abre em uma nova janela popup
    const popup = window.open(
      authUrl,
      'googleAuth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    )

    if (!popup) {
      throw new Error(
        'Popup bloqueado pelo navegador. Por favor, permita popups para este site.'
      )
    }

    // Escuta a mensagem do popup
    return new Promise((resolve, reject) => {
      let isResolved = false

      const messageListener = (event: MessageEvent) => {
        console.log('📨 Mensagem recebida:', event.data.type)

        // Verifica se a origem é confiável
        if (event.origin !== window.location.origin) {
          console.log('⚠️ Origem não confiável, ignorando:', event.origin)
          return
        }

        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          console.log('✅ Autenticação Google bem-sucedida')
          isResolved = true
          clearInterval(checkClosed)
          window.removeEventListener('message', messageListener)
          popup.close()
          this.handleGoogleCallback(event.data.code).then(resolve).catch(reject)
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          console.error('❌ Erro na autenticação Google:', event.data.error)
          isResolved = true
          clearInterval(checkClosed)
          window.removeEventListener('message', messageListener)
          popup.close()
          reject(new Error(event.data.error))
        }
      }

      window.addEventListener('message', messageListener)

      // Verifica se o popup foi fechado manualmente
      const checkClosed = setInterval(() => {
        if (popup.closed && !isResolved) {
          console.log('⚠️ Popup foi fechado pelo usuário')
          clearInterval(checkClosed)
          window.removeEventListener('message', messageListener)
          reject(new Error('Autenticação cancelada pelo usuário'))
        }
      }, 1000)
    })
  },

  async handleGoogleCallback(code: string): Promise<void> {
    try {
      console.log('🔄 Enviando código para o backend...')
      console.log('Code:', `${code.substring(0, 20)}...`)
      console.log('Redirect URI:', GOOGLE_CONFIG.REDIRECT_URI)

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/auth/google/callback/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code: code,
            redirect_uri: GOOGLE_CONFIG.REDIRECT_URI
          })
        }
      )

      const responseData = await response.json()

      if (!response.ok) {
        console.error('❌ Erro do backend:', responseData)
        throw new Error(responseData.error || 'Falha na autenticação Google')
      }

      console.log('✅ Tokens recebidos do backend')

      // Armazenar tokens JWT
      if (responseData.access && responseData.refresh) {
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, responseData.access)
        localStorage.setItem(AUTH_CONFIG.REFRESH_KEY, responseData.refresh)
        console.log('✅ Tokens salvos no localStorage')
      } else {
        throw new Error('Tokens não recebidos do backend')
      }
    } catch (error) {
      console.error('❌ Erro ao processar callback do Google:', error)
      throw error
    }
  }
}

export default api
export type { User, DashboardData, ApiError }
