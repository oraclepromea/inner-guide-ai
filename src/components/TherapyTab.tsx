import React, { useEffect, useState } from 'react';
import { useAppStore } from '../stores';
import { MessageCircle, Plus, Archive, Trash2, Settings, Brain, Send, User, Bot } from 'lucide-react';
import type { TherapistPersonality } from '../types';

const TherapyTab: React.FC = () => {
  const {
    therapySessions,
    currentSession,
    messages,
    isLoadingTherapy,
    isTyping,
    selectedTherapist,
    loadTherapySessions,
    createTherapySession,
    loadSession,
    sendMessage,
    archiveSession,
    deleteSession,
    updateTherapistPersonality
  } = useAppStore();

  const [newMessage, setNewMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadTherapySessions();
  }, [loadTherapySessions]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentSession) return;
    
    await sendMessage(newMessage.trim());
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const therapistPersonalities: { value: TherapistPersonality; label: string; description: string }[] = [
    { value: 'empathetic', label: 'Empathetic', description: 'Warm, understanding, and emotionally supportive' },
    { value: 'analytical', label: 'Analytical', description: 'Logical, systematic, and solution-focused' },
    { value: 'supportive', label: 'Supportive', description: 'Encouraging, positive, and strength-based' },
    { value: 'direct', label: 'Direct', description: 'Straightforward, honest, and action-oriented' }
  ];

  if (isLoadingTherapy) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sessions Sidebar */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              Therapy Sessions
            </h2>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={() => createTherapySession()}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </button>
        </div>

        {/* Therapist Settings */}
        {showSettings && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Therapist Personality
            </h3>
            <div className="space-y-2">
              {therapistPersonalities.map((personality) => (
                <label key={personality.value} className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="therapist"
                    value={personality.value}
                    checked={selectedTherapist === personality.value}
                    onChange={() => updateTherapistPersonality(personality.value)}
                    className="mt-1 text-blue-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {personality.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {personality.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {therapySessions.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No therapy sessions yet.</p>
              <p className="text-sm">Start your first session above.</p>
            </div>
          ) : (
            <div className="p-2">
              {therapySessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 mb-2 rounded-lg cursor-pointer border transition-colors ${
                    currentSession?.id === session.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => session.id && loadSession(session.id.toString())}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        Session {session.date}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (session.id) {
                            archiveSession(session.id.toString());
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400"
                        title="Archive session"
                      >
                        <Archive className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (session.id && confirm('Are you sure you want to delete this session?')) {
                            deleteSession(session.id.toString());
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Delete session"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Session {currentSession.date}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {therapistPersonalities.find(p => p.value === selectedTherapist)?.label} Therapist
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Welcome to your therapy session</p>
                  <p>Feel free to share what's on your mind. I'm here to listen and support you.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <div className="flex items-center mb-1">
                        {message.sender === 'user' ? (
                          <User className="w-4 h-4 mr-2" />
                        ) : (
                          <Bot className="w-4 h-4 mr-2" />
                        )}
                        <span className="text-xs opacity-75">
                          {message.sender === 'user' ? 'You' : 'Therapist'}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-4 h-4" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex space-x-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Share what's on your mind..."
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isTyping}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">AI Therapy Assistant</h3>
              <p>Select a session from the sidebar or create a new one to begin.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TherapyTab;