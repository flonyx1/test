import React, { useState } from 'react';
import { Camera, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    nickname: user?.nickname || '',
    username: user?.username || '',
  });

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-dark-800/30">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Профиль</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all"
          >
            {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            <span>{isEditing ? 'Отмена' : 'Редактировать'}</span>
          </button>
        </div>

        <div className="bg-dark-800/50 backdrop-blur-lg rounded-2xl p-6 border border-primary-500/20 mb-6">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-32 h-32 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt="Avatar" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-white">
                    {user?.nickname?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              {isEditing && (
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-all">
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            
            <h2 className="text-xl font-bold text-white mb-1">{user?.nickname}</h2>
            <p className="text-primary-300">@{user?.username}</p>
          </div>
        </div>

        <div className="bg-dark-800/50 backdrop-blur-lg rounded-2xl p-6 border border-primary-500/20 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Информация профиля</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-300 mb-2">
                Отображаемое имя
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.nickname}
                  onChange={(e) => setEditData(prev => ({ ...prev, nickname: e.target.value }))}
                  className="w-full px-4 py-2 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all"
                />
              ) : (
                <p className="text-white bg-dark-700/30 px-4 py-2 rounded-lg">
                  {user?.nickname}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-300 mb-2">
                Username
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.username}
                  onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-2 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all"
                />
              ) : (
                <p className="text-white bg-dark-700/30 px-4 py-2 rounded-lg">
                  @{user?.username}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-300 mb-2">
                Email
              </label>
              <p className="text-white bg-dark-700/30 px-4 py-2 rounded-lg">
                {user?.email}
              </p>
            </div>
          </div>

          {isEditing && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:from-primary-700 hover:to-accent-700 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Сохранить</span>
              </button>
            </div>
          )}
        </div>

        <div className="bg-dark-800/50 backdrop-blur-lg rounded-2xl p-6 border border-primary-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">Безопасность</h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm">Шифрование сообщений активно</span>
            </div>
            
            <div className="flex items-center space-x-3 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm">Анонимность обеспечена</span>
            </div>
            
            <div className="flex items-center space-x-3 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm">Данные защищены</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
