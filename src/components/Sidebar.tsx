import React from 'react';
import { MessageCircle, User, HelpCircle, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ActiveView } from './MainApp';

interface SidebarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  isAdmin: boolean;
}

export default function Sidebar({ activeView, onViewChange, isAdmin }: SidebarProps) {
  const { logout, user } = useAuth();

  const menuItems = [
    { id: 'chats' as ActiveView, icon: MessageCircle, label: 'Чаты' },
    { id: 'profile' as ActiveView, icon: User, label: 'Профиль' },
    { id: 'faq' as ActiveView, icon: HelpCircle, label: 'FAQ' },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'admin' as ActiveView, icon: Shield, label: 'Админ' });
  }

  return (
    <div className="w-16 md:w-64 bg-dark-800/50 backdrop-blur-lg border-r border-primary-500/20 flex flex-col">
      <div className="p-4 border-b border-primary-500/20">
        <div className="hidden md:flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">APE</h1>
            <p className="text-primary-300 text-xs">@{user?.username}</p>
          </div>
        </div>
        <div className="md:hidden flex justify-center">
          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all mb-1 ${
              activeView === item.id
                ? 'bg-primary-600 text-white'
                : 'text-primary-300 hover:bg-primary-600/20 hover:text-white'
            } ${
              item.id === 'admin' ? 'border border-red-500/30 bg-red-500/10' : ''
            }`}
          >
            <item.icon className={`w-5 h-5 ${item.id === 'admin' ? 'text-red-400' : ''}`} />
            <span className="hidden md:block font-medium">{item.label}</span>
            {item.id === 'admin' && (
              <span className="hidden md:block text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                ADMIN
              </span>
            )}
          </button>
        ))}
      </nav>

      {isAdmin && (
        <div className="p-2 border-t border-red-500/20 bg-red-500/10">
          <div className="flex items-center space-x-2 text-red-400 text-sm">
            <Shield className="w-4 h-4" />
            <span className="hidden md:block">Администратор</span>
          </div>
        </div>
      )}

      <div className="p-2 border-t border-primary-500/20">
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 p-3 rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden md:block font-medium">Выйти</span>
        </button>
      </div>
    </div>
  );
}