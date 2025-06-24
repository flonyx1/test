import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import Profile from './Profile';
import FAQ from './FAQ';
import AdminPanel from './AdminPanel';

export type ActiveView = 'chats' | 'profile' | 'faq' | 'admin';

export default function MainApp() {
  const [activeView, setActiveView] = useState<ActiveView>('chats');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isAdmin, setIsAdmin] = useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    checkAdminRights();
  }, []);

  const checkAdminRights = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/check');
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.isAdmin);
      }
    } catch (error) {
    }
  };

  const renderMainContent = () => {
    if (activeView === 'profile') {
      return <Profile />;
    }
    
    if (activeView === 'faq') {
      return <FAQ />;
    }

    if (activeView === 'admin') {
      return <AdminPanel />;
    }

    if (isMobile) {
      if (selectedChatId) {
        return (
          <ChatWindow 
            chatId={selectedChatId} 
            onBack={() => setSelectedChatId(null)} 
          />
        );
      } else {
        return (
          <ChatList 
            onChatSelect={setSelectedChatId}
            selectedChatId={selectedChatId}
          />
        );
      }
    }

    return (
      <div className="flex h-full">
        <div className="w-1/3 border-r border-primary-500/20">
          <ChatList 
            onChatSelect={setSelectedChatId}
            selectedChatId={selectedChatId}
          />
        </div>
        <div className="flex-1">
          {selectedChatId ? (
            <ChatWindow chatId={selectedChatId} />
          ) : (
            <div className="h-full flex items-center justify-center bg-dark-800/30">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center mb-4 opacity-50">
                  <span className="text-2xl">💬</span>
                </div>
                <p className="text-primary-300 text-lg">Выберите чат для начала общения</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex bg-dark-900">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        isAdmin={isAdmin}
      />
      <div className="flex-1 flex flex-col">
        {renderMainContent()}
      </div>
    </div>
  );
}
