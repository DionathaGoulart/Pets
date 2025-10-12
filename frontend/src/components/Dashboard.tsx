import React, { useState, useEffect } from 'react'
import { LogOut } from 'lucide-react'
import api from '../service/api'
import type { User, DashboardData } from '../service/api'

interface DashboardProps {
  user: User | null;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        const loadDashboard = async (): Promise<void> => {
            try {
                const data = await api.getDashboard()
                setDashboardData(data)
            } catch (err) {
                console.error('Erro ao carregar dashboard:', err)
            } finally {
                setLoading(false)
            }
        }
        loadDashboard()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-xl text-gray-600 font-medium">Carregando seu dashboard...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header com gradiente */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 shadow-lg">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">
                                Dashboard
                            </h1>
                            <p className="text-blue-100 text-lg">
                                Bem-vindo de volta, {user?.first_name || user?.username}!
                            </p>
                        </div>
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                        >
                            <LogOut size={20} />
                            Sair
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-8 -mt-4">
                {/* Card de boas-vindas */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-2xl font-bold">
                                {user?.username?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-1">
                                {dashboardData?.message || 'Bem-vindo à sua área pessoal!'}
                            </h2>
                            <p className="text-gray-600">Gerencie suas informações e configurações</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                            <div className="text-blue-600 text-sm font-semibold uppercase tracking-wide mb-2">
                                ID do Usuário
                            </div>
                            <div className="text-2xl font-bold text-gray-800">
                                #{user?.id}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                            <div className="text-purple-600 text-sm font-semibold uppercase tracking-wide mb-2">
                                Username
                            </div>
                            <div className="text-2xl font-bold text-gray-800">
                                @{user?.username}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                            <div className="text-green-600 text-sm font-semibold uppercase tracking-wide mb-2">
                                Email
                            </div>
                            <div className="text-lg font-bold text-gray-800 break-all">
                                {user?.email}
                            </div>
                        </div>

                        {user?.first_name && (
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                                <div className="text-orange-600 text-sm font-semibold uppercase tracking-wide mb-2">
                                    Nome Completo
                                </div>
                                <div className="text-lg font-bold text-gray-800">
                                    {user.first_name} {user.last_name}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status da API */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 shadow-lg">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xl">✓</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">
                                Sistema funcionando perfeitamente!
                            </h3>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Sua API Django está conectada com sucesso ao React.
                                O token JWT está sendo usado para autenticar as requisições
                                de forma segura e eficiente.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                                    Autenticação JWT
                                </span>
                                <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                                    API Conectada
                                </span>
                                <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                                    TypeScript
                                </span>
                                <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                                    React 18
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
