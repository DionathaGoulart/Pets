/**
 * Configurações centralizadas da aplicação
 * Todas as variáveis de ambiente devem ser definidas no arquivo .env
 */

// Função auxiliar para validar variáveis obrigatórias
const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key] || defaultValue

  if (!value) {
    console.error(`❌ Variável de ambiente obrigatória não configurada: ${key}`)
  }

  return value || ''
}

// Configurações da API
export const API_CONFIG = {
  BASE_URL: getEnvVar('VITE_API_URL', 'http://localhost:8000/api'),
  TIMEOUT: 30000 // 30 segundos
} as const

// Configurações do Google OAuth
export const GOOGLE_CONFIG = {
  CLIENT_ID: getEnvVar('VITE_GOOGLE_CLIENT_ID'),
  REDIRECT_URI: getEnvVar(
    'VITE_REDIRECT_URI',
    'http://localhost:5173/auth/google/callback'
  ),
  SCOPE: 'openid email profile',
  RESPONSE_TYPE: 'code',
  ACCESS_TYPE: 'offline'
} as const

// Configurações do Frontend
export const FRONTEND_CONFIG = {
  URL: getEnvVar('VITE_FRONTEND_URL', 'http://localhost:5173')
} as const

// Configurações de autenticação
export const AUTH_CONFIG = {
  TOKEN_KEY: 'access_token',
  REFRESH_KEY: 'refresh_token'
} as const

// Log das configurações (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  console.log('🔧 Configurações carregadas:')
  console.log('API URL:', API_CONFIG.BASE_URL)
  console.log('Frontend URL:', FRONTEND_CONFIG.URL)
  console.log(
    'Google Client ID:',
    GOOGLE_CONFIG.CLIENT_ID
      ? `${GOOGLE_CONFIG.CLIENT_ID.substring(0, 20)}...`
      : '❌ NÃO CONFIGURADO'
  )
  console.log('Redirect URI:', GOOGLE_CONFIG.REDIRECT_URI)
}

// Validação das configurações críticas
export const validateConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!API_CONFIG.BASE_URL) {
    errors.push('VITE_API_URL não configurado')
  }

  if (!GOOGLE_CONFIG.CLIENT_ID) {
    errors.push('VITE_GOOGLE_CLIENT_ID não configurado')
  }

  if (!GOOGLE_CONFIG.REDIRECT_URI) {
    errors.push('VITE_REDIRECT_URI não configurado')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
