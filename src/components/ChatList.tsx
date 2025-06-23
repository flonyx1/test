import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

interface Chat {
  id: string;
  participants: string[];
  lastMessage?: any;
  createdAt: string;
}

interface User {
  id: string;
  username: string;
  nickname: string;
  avatar: string | null;
  isOnline: boolean;
}

interface ChatListProps {
  onChatSelect: (chatId: string) => void;
  selectedChatId: string | null;
}

export default function ChatList({ onChatSelect, selectedChatId }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  const { user, token } = useAuth();
  const { socket } = useSocket();

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (message: any) => {
        loadChats();
      };

      socket.on('new-message', handleNewMessage);

      return () => {
        socket.off('new-message', handleNewMessage);
      };
    }
  }, [socket]);

  const loadChats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/chats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setChats(data);
      }
    } catch (error) {
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch(`http://localhost:3001/api/search-users?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
    }
  };

  const createChat = async (participantId: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ participantId }),
      });
      
      if (response.ok) {
        const newChat = await response.json();
        setChats(prev => [newChat, ...prev]);
        onChatSelect(newChat.id);
        setSearchQuery('');
        setSearchResults([]);
        setIsSearching(false);
      }
    } catch (error) {
    }
  };

  const deleteSelectedChats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/chats', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ chatIds: Array.from(selectedChats) }),
      });
      
      if (response.ok) {
        setChats(prev => prev.filter(chat => !selectedChats.has(chat.id)));
        setSelectedChats(new Set());
        setIsSelectionMode(false);
        
        if (selectedChatId && selectedChats.has(selectedChatId)) {
          onChatSelect('');
        }
      }
    } catch (error) {
    }
  };

  const deleteAllChats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/chats/all', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setChats([]);
        setSelectedChats(new Set());
        setIsSelectionMode(false);
        onChatSelect('');
      }
    } catch (error) {
    }
  };

  const toggleChatSelection = (chatId: string) => {
    const newSelected = new Set(selectedChats);
    if (newSelected.has(chatId)) {
      newSelected.delete(chatId);
    } else {
      newSelected.add(chatId);
    }
    setSelectedChats(newSelected);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    }
  };

  return (
    <div className="h-full flex flex-col bg-dark-800/30">
      <div className="p-4 border-b border-primary-500/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Чаты</h2>
          <div className="flex space-x-2">
            {chats.length > 0 && (
              <>
                <button
                  onClick={() => setIsSelectionMode(!isSelectionMode)}
                  className="p-2 text-primary-400 hover:text-white hover:bg-primary-600/20 rounded-lg transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                {isSelectionMode && (
                  <button
                    onClick={deleteAllChats}
                    className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                  >
                    Все
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400" />
          <input
            type="text"
            placeholder="Поиск по username..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchUsers(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-primary-300 focus:outline-none focus:border-primary-400 transition-all"
          />
        </div>

        {isSelectionMode && selectedChats.size > 0 && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-primary-300">
              Выбрано: {selectedChats.size}
            </span>
            <button
              onClick={deleteSelectedChats}
              className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm"
            >
              Удалить
            </button>
          </div>
        )}
      </div>

      {isSearching && searchResults.length > 0 && (
        <div className="border-b border-primary-500/20">
          <div className="p-3">
            <h3 className="text-sm font-medium text-primary-300 mb-2">Результаты поиска</h3>
            {searchResults.map((searchUser) => (
              <button
                key={searchUser.id}
                onClick={() => createChat(searchUser.id)}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-600/20 transition-all"
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {searchUser.nickname.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {searchUser.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-800"></div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">{searchUser.nickname}</p>
                  <p className="text-primary-300 text-sm">@{searchUser.username}</p>
                </div>
                <Plus className="w-4 h-4 text-primary-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-primary-400 mx-auto mb-3 opacity-50" />
              <p className="text-primary-300">Нет чатов</p>
              <p className="text-primary-400 text-sm mt-1">Найдите пользователя для начала общения</p>
            </div>
          </div>
        ) : (
          <div className="p-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all mb-1 ${
                  selectedChatId === chat.id
                    ? 'bg-primary-600/30 border border-primary-500/50'
                    : 'hover:bg-primary-600/10'
                } ${
                  isSelectionMode && selectedChats.has(chat.id)
                    ? 'bg-red-500/20 border border-red-500/50'
                    : ''
                }`}
                onClick={() => {
                  if (isSelectionMode) {
                    toggleChatSelection(chat.id);
                  } else {
                    onChatSelect(chat.id);
                  }
                }}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {chat.participants.find(p => p !== user?.id)?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-medium truncate">
                      Чат {chat.id.slice(0, 8)}
                    </p>
                    {chat.lastMessage && (
                      <span className="text-xs text-primary-400">
                        {formatTime(chat.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  {chat.lastMessage && (
                    <p className="text-primary-300 text-sm truncate">
                      {chat.lastMessage.content}
                    </p>
                  )}
                </div>
                {isSelectionMode && (
                  <div className={`w-5 h-5 rounded border-2 ${
                    selectedChats.has(chat.id)
                      ? 'bg-red-500 border-red-500'
                      : 'border-primary-400'
                  }`}>
                    {selectedChats.has(chat.id) && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}