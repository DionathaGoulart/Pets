import React, { useState } from 'react'
import { AlertCircle, Mail } from 'lucide-react'
import api from '../service/api'
import type { ApiError } from '../service/api'

interface RegisterFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

interface FormData {
  username: string;
  email: string;
  password1: string;
  password2: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
    const [formData, setFormData] = useState<FormData>({
        username: '',
        email: '',
        password1: '',
        password2: ''
    })
    const [errors, setErrors] = useState<ApiError>({})
    const [loading, setLoading] = useState<boolean>(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault()
        setErrors({})
        setLoading(true)

        try {
            await api.register(
                formData.username,
                formData.email,
                formData.password1,
                formData.password2
            )
            onSuccess()
        } catch (err) {
            const apiError = err as ApiError
            setErrors(apiError)
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (field: keyof FormData) => (
        e: React.ChangeEvent<HTMLInputElement>
    ): void => {
        setFormData(prev => ({
            ...prev,
            [field]: e.target.value
        }))
    }

    const handleGoogleRegister = async (): Promise<void> => {
        setLoading(true)
        try {
            await api.googleAuth()
            // Notifica o componente pai que o cadastro foi bem-sucedido
            onSuccess()
        } catch (err) {
            console.error('Erro no cadastro com Google:', err)
            setErrors({ non_field_errors: ['Erro ao cadastrar com Google'] })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20 transform hover:scale-[1.02] transition-all duration-300">
            {/* Header com gradiente */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mb-4">
                    <Mail className="text-white" size={24} />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    Criar Conta
                </h2>
                <p className="text-gray-500 mt-2">Junte-se a nós e comece sua jornada</p>
            </div>

            {errors.non_field_errors && (
                <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 shadow-sm animate-pulse">
                    <AlertCircle size={20} className="flex-shrink-0" />
                    <span className="text-sm font-medium">{errors.non_field_errors[0]}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="block text-gray-700 text-sm font-semibold">
                        Username
                    </label>
                    <input
                        type="text"
                        value={formData.username}
                        onChange={handleInputChange('username')}
                        className="w-full px-4 py-4 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 focus:bg-white transition-all duration-200 placeholder-gray-400"
                        placeholder="Escolha um username único"
                        required
                    />
                    {errors.username && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle size={14} />
                            {errors.username[0]}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="block text-gray-700 text-sm font-semibold">
                        Email
                    </label>
                    <div className="relative group">
                        <Mail
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors duration-200"
                            size={20}
                        />
                        <input
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange('email')}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 focus:bg-white transition-all duration-200 placeholder-gray-400"
                            placeholder="seu@email.com"
                            required
                        />
                    </div>
                    {errors.email && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle size={14} />
                            {errors.email[0]}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="block text-gray-700 text-sm font-semibold">
                        Senha
                    </label>
                    <input
                        type="password"
                        value={formData.password1}
                        onChange={handleInputChange('password1')}
                        className="w-full px-4 py-4 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 focus:bg-white transition-all duration-200 placeholder-gray-400"
                        placeholder="Mínimo 8 caracteres"
                        required
                    />
                    {errors.password1 && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle size={14} />
                            {errors.password1[0]}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="block text-gray-700 text-sm font-semibold">
                        Confirmar Senha
                    </label>
                    <input
                        type="password"
                        value={formData.password2}
                        onChange={handleInputChange('password2')}
                        className="w-full px-4 py-4 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 focus:bg-white transition-all duration-200 placeholder-gray-400"
                        placeholder="Digite a senha novamente"
                        required
                    />
                    {errors.password2 && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle size={14} />
                            {errors.password2[0]}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                    {loading ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Criando conta...
                        </div>
                    ) : (
                        'Criar Conta'
                    )}
                </button>
            </form>

            <div className="mt-8 text-center">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">ou</span>
                    </div>
                </div>

                {/* Botão do Google */}
                <button
                    onClick={handleGoogleRegister}
                    disabled={loading}
                    className="w-full mt-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md flex items-center justify-center gap-3"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Cadastrar com Google
                </button>

                <button
                    onClick={onSwitchToLogin}
                    className="mt-4 text-green-600 hover:text-blue-600 text-sm font-semibold transition-colors duration-200 hover:underline"
                >
                    Já tem conta? Faça login
                </button>
            </div>
        </div>
    )
}

export default RegisterForm
