import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Paperclip, Mic, MicOff, Check, CheckCheck, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio';
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  readBy: string[];
}

interface ChatWindowProps {
  chatId: string;
  onBack?: () => void;
}

export default function ChatWindow({ chatId, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { user, token } = useAuth();
  const { socket } = useSocket();

  useEffect(() => {
    loadMessages();
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (message: Message) => {
        if (message.chatId === chatId) {
          setMessages(prev => {
            if (prev.some(m => m.id === message.id)) {
              return prev;
            }
            return [...prev, message];
          });
          
          if (message.senderId !== user?.id) {
            socket.emit('message-read', {
              messageId: message.id,
              userId: user?.id
            });
          }
        }
      };

      const handleMessageReadUpdate = (data: any) => {
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, status: 'read' }
            : msg
        ));
      };

      socket.on('new-message', handleNewMessage);
      socket.on('message-read-update', handleMessageReadUpdate);

      return () => {
        socket.off('new-message', handleNewMessage);
        socket.off('message-read-update', handleMessageReadUpdate);
      };
    }
  }, [socket, chatId, user?.id]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/messages/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = (content: string, type: 'text' | 'image' | 'video' | 'audio' = 'text') => {
    if (!content.trim() && type === 'text') return;

    const messageData = {
      chatId,
      senderId: user?.id,
      content,
      type
    };

    if (socket) {
      socket.emit('send-message', messageData);
    }

    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(newMessage);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);
        sendMessage(audioUrl, 'audio');
        
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setRecordingTime(0);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      sendMessage(fileUrl, type);
    }
  };

  const getMessageStatus = (message: Message) => {
    if (message.senderId !== user?.id) return null;

    switch (message.status) {
      case 'sending':
        return <div className="w-3 h-3 border border-primary-400 rounded-full animate-spin border-t-transparent" />;
      case 'failed':
        return <X className="w-4 h-4 text-red-400" />;
      case 'sent':
        return <Check className="w-4 h-4 text-primary-400" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-primary-400" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-green-400" />;
      default:
        return null;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-dark-800/30">
      <div className="p-4 border-b border-primary-500/20 bg-dark-800/50 backdrop-blur-lg">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-primary-400 hover:text-white hover:bg-primary-600/20 rounded-lg transition-all md:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium">U</span>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-medium">Чат {chatId.slice(0, 8)}</h3>
            <p className="text-primary-300 text-sm">в сети</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: '#2a2a2a' }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.senderId === user?.id
                  ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white'
                  : 'bg-dark-700 text-white'
              }`}
            >
              {message.type === 'text' && (
                <p className="break-words">{message.content}</p>
              )}
              
              {message.type === 'image' && (
                <div>
                  <img 
                    src={message.content} 
                    alt="Изображение" 
                    className="rounded-lg max-w-full h-auto mb-2"
                  />
                </div>
              )}
              
              {message.type === 'video' && (
                <div>
                  <video 
                    src={message.content} 
                    controls 
                    className="rounded-lg max-w-full h-auto mb-2"
                  />
                </div>
              )}
              
              {message.type === 'audio' && (
                <div>
                  <audio 
                    src={message.content} 
                    controls 
                    className="mb-2"
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs opacity-70">
                  {formatTime(message.timestamp)}
                </span>
                {getMessageStatus(message)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-primary-500/20 bg-dark-800/50 backdrop-blur-lg">
        {isRecording ? (
          <div className="flex items-center space-x-3 bg-red-500/20 rounded-lg p-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-white font-medium">
              Запись... {formatRecordingTime(recordingTime)}
            </span>
            <div className="flex-1"></div>
            <button
              onClick={stopRecording}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
            >
              <MicOff className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*"
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-primary-400 hover:text-white hover:bg-primary-600/20 rounded-lg transition-all"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Введите сообщение..."
                className="w-full px-4 py-2 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-primary-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all"
              />
            </div>

            <button
              onClick={startRecording}
              className="p-2 text-primary-400 hover:text-white hover:bg-primary-600/20 rounded-lg transition-all"
            >
              <Mic className="w-5 h-5" />
            </button>

            <button
              onClick={() => sendMessage(newMessage)}
              disabled={!newMessage.trim()}
              className="p-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:from-primary-700 hover:to-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}