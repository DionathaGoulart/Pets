import React, { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

const GoogleCallback: React.FC = () => {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    console.log('GoogleCallback: code =', code, 'error =', error)
    console.log('GoogleCallback: window.opener =', !!window.opener)
    console.log('GoogleCallback: window.location.origin =', window.location.origin)

    if (error) {
      console.log('Enviando erro para janela pai:', error)
      // Envia erro para a janela pai
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error: error
      }, window.location.origin)
      return
    }

    if (code) {
      console.log('Enviando código para janela pai:', code)
      // Envia código para a janela pai
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_SUCCESS',
        code: code
      }, window.location.origin)
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-xl text-gray-600 font-medium">Processando autenticação...</div>
        <p className="text-gray-500 mt-2">Esta janela será fechada automaticamente</p>
      </div>
    </div>
  )
}

export default GoogleCallback
