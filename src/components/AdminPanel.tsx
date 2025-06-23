import React, { useState, useEffect } from 'react';
import { Shield, Users, MessageSquare, Globe, Plus, Trash2, AlertTriangle, Activity } from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalChats: number;
  totalMessages: number;
  totalAdmins: number;
  blockedCountries: number;
  onlineUsers: number;
}

interface Admin {
  id: string;
  ip: string;
  name: string;
  active: boolean;
  createdAt: string;
}

interface BlockedCountry {
  id: string;
  code: string;
  name: string;
  blockedAt: string;
}

export default function AdminPanel() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [blockedCountries, setBlockedCountries] = useState<BlockedCountry[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'admins' | 'countries'>('stats');
  const [loading, setLoading] = useState(true);
  
  const [newAdmin, setNewAdmin] = useState({ ip: '', name: '' });
  const [newCountry, setNewCountry] = useState({ code: '', name: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const statsResponse = await fetch('http://localhost:3001/api/admin/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
      
      const adminsResponse = await fetch('http://localhost:3001/api/admin/admins');
      if (adminsResponse.ok) {
        const adminsData = await adminsResponse.json();
        setAdmins(adminsData);
      }
      
      const countriesResponse = await fetch('http://localhost:3001/api/admin/blocked-countries');
      if (countriesResponse.ok) {
        const countriesData = await countriesResponse.json();
        setBlockedCountries(countriesData);
      }
      
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAdmin.ip || !newAdmin.name) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/admin/add-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAdmin),
      });
      
      if (response.ok) {
        setNewAdmin({ ip: '', name: '' });
        loadData();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
    }
  };

  const blockCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCountry.code || !newCountry.name) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/admin/block-country', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          countryCode: newCountry.code,
          countryName: newCountry.name
        }),
      });
      
      if (response.ok) {
        setNewCountry({ code: '', name: '' });
        loadData();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
    }
  };

  const unblockCountry = async (countryId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/unblock-country/${countryId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        loadData();
      }
    } catch (error) {
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-dark-800/30">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-300">Загрузка админ-панели...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-dark-800/30">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-red-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Админ-панель</h1>
              <p className="text-primary-300">Управление системой APE</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-green-400">
            <Activity className="w-5 h-5" />
            <span className="text-sm font-medium">Система активна</span>
          </div>
        </div>

        <div className="flex space-x-1 mb-8 bg-dark-800/50 rounded-lg p-1">
          {[
            { id: 'stats', label: 'Статистика', icon: Activity },
            { id: 'admins', label: 'Администраторы', icon: Shield },
            { id: 'countries', label: 'Блокировка стран', icon: Globe },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'text-primary-300 hover:text-white hover:bg-primary-600/20'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-dark-800/50 backdrop-blur-lg rounded-2xl p-6 border border-primary-500/20">
              <div className="flex items-center space-x-3 mb-4">
                <Users className="w-8 h-8 text-blue-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Пользователи</h3>
                  <p className="text-primary-300 text-sm">Всего зарегистрировано</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">{stats.totalUsers}</div>
              <div className="text-green-400 text-sm">
                {stats.onlineUsers} онлайн
              </div>
            </div>

            <div className="bg-dark-800/50 backdrop-blur-lg rounded-2xl p-6 border border-primary-500/20">
              <div className="flex items-center space-x-3 mb-4">
                <MessageSquare className="w-8 h-8 text-green-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Чаты</h3>
                  <p className="text-primary-300 text-sm">Активные диалоги</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">{stats.totalChats}</div>
              <div className="text-primary-400 text-sm">
                {stats.totalMessages} сообщений
              </div>
            </div>

            <div className="bg-dark-800/50 backdrop-blur-lg rounded-2xl p-6 border border-primary-500/20">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-8 h-8 text-purple-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Безопасность</h3>
                  <p className="text-primary-300 text-sm">Защита системы</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">{stats.totalAdmins}</div>
              <div className="text-red-400 text-sm">
                {stats.blockedCountries} стран заблокировано
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="space-y-6">
            <div className="bg-dark-800/50 backdrop-blur-lg rounded-2xl p-6 border border-primary-500/20">
              <h3 className="text-lg font-semibold text-white mb-4">Добавить администратора</h3>
              <form onSubmit={addAdmin} className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="IP адрес"
                  value={newAdmin.ip}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, ip: e.target.value }))}
                  className="flex-1 px-4 py-2 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-primary-300 focus:outline-none focus:border-primary-400"
                  required
                />
                <input
                  type="text"
                  placeholder="Имя администратора"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1 px-4 py-2 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-primary-300 focus:outline-none focus:border-primary-400"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:from-primary-700 hover:to-accent-700 transition-all flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить</span>
                </button>
              </form>
            </div>

            <div className="bg-dark-800/50 backdrop-blur-lg rounded-2xl p-6 border border-primary-500/20">
              <h3 className="text-lg font-semibold text-white mb-4">Список администраторов</h3>
              <div className="space-y-3">
                {admins.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-white font-medium">{admin.name}</p>
                        <p className="text-primary-300 text-sm">{admin.ip}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 text-sm">Активен</div>
                      <div className="text-primary-400 text-xs">
                        {new Date(admin.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'countries' && (
          <div className="space-y-6">
            <div className="bg-dark-800/50 backdrop-blur-lg rounded-2xl p-6 border border-primary-500/20">
              <h3 className="text-lg font-semibold text-white mb-4">Заблокировать страну</h3>
              <form onSubmit={blockCountry} className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Код страны (RU, US, CN...)"
                  value={newCountry.code}
                  onChange={(e) => setNewCountry(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="flex-1 px-4 py-2 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-primary-300 focus:outline-none focus:border-primary-400"
                  maxLength={2}
                  required
                />
                <input
                  type="text"
                  placeholder="Название страны"
                  value={newCountry.name}
                  onChange={(e) => setNewCountry(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1 px-4 py-2 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-primary-300 focus:outline-none focus:border-primary-400"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all flex items-center space-x-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Заблокировать</span>
                </button>
              </form>
            </div>

            <div className="bg-dark-800/50 backdrop-blur-lg rounded-2xl p-6 border border-primary-500/20">
              <h3 className="text-lg font-semibold text-white mb-4">Заблокированные страны</h3>
              {blockedCountries.length === 0 ? (
                <p className="text-primary-300 text-center py-8">Нет заблокированных стран</p>
              ) : (
                <div className="space-y-3">
                  {blockedCountries.map((country) => (
                    <div key={country.id} className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-red-400" />
                        <div>
                          <p className="text-white font-medium">{country.name}</p>
                          <p className="text-red-300 text-sm">Код: {country.code}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-red-400 text-sm">Заблокирована</div>
                          <div className="text-primary-400 text-xs">
                            {new Date(country.blockedAt).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                        <button
                          onClick={() => unblockCountry(country.id)}
                          className="p-2 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}