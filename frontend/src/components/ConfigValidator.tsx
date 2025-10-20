import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { validateConfig } from '../config'

interface ConfigValidatorProps {
  children: React.ReactNode
}

const ConfigValidator: React.FC<ConfigValidatorProps> = ({ children }) => {
  const [configErrors, setConfigErrors] = useState<string[]>([])
  const [isChecked, setIsChecked] = useState(false)

  useEffect(() => {
    const { isValid, errors } = validateConfig()

    if (!isValid) {
      setConfigErrors(errors)
      console.error('❌ Erro de configuração:', errors)
    }

    setIsChecked(true)
  }, [])

  // Ainda verificando
  if (!isChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando configurações...</p>
        </div>
      </div>
    )
  }

  // Se houver erros de configuração
  if (configErrors.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 border-2 border-red-200">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-red-800 mb-2">
                Erro de Configuração
              </h1>
              <p className="text-gray-700 mb-4">
                Algumas variáveis de ambiente obrigatórias não foram
                configuradas.
              </p>
            </div>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
            <h2 className="font-bold text-red-800 mb-3">Variáveis faltando:</h2>
            <ul className="space-y-2">
              {configErrors.map((error, index) => (
                <li key={index} className="flex items-start gap-2 text-red-700">
                  <span className="text-red-500 font-bold">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h2 className="font-bold text-gray-800 mb-3">Como corrigir:</h2>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">1.</span>
                <span>
                  Crie um arquivo{' '}
                  <code className="bg-gray-200 px-2 py-1 rounded">.env</code> na
                  raiz do projeto frontend
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">2.</span>
                <span>Adicione as seguintes variáveis:</span>
              </li>
            </ol>

            <pre className="mt-4 bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
              {`# API Backend
VITE_API_URL=http://localhost:8000/api

# Google OAuth (obtenha em: console.cloud.google.com)
VITE_GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com

# URLs do Frontend
VITE_FRONTEND_URL=http://localhost:5173
VITE_REDIRECT_URI=http://localhost:5173/auth/google/callback`}
            </pre>

            <ol className="space-y-3 text-sm text-gray-700 mt-4">
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">3.</span>
                <span>Salve o arquivo</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">4.</span>
                <span>
                  Reinicie o servidor de desenvolvimento:{' '}
                  <code className="bg-gray-200 px-2 py-1 rounded">
                    npm run dev
                  </code>
                </span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  // Configurações OK, renderiza a aplicação
  return <>{children}</>
}

export default ConfigValidator
