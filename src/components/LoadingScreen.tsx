import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-primary-900 to-accent-900">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center animate-pulse-slow">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <div className="absolute inset-0 w-20 h-20 mx-auto border-4 border-primary-400 rounded-full animate-spin border-t-transparent"></div>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">APE</h1>
        <p className="text-primary-200 text-lg">Загрузка...</p>
        
        <div className="mt-8 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}