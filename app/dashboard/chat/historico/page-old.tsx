'use client';

import React, { useState } from 'react';
import { useChatHistory } from '@/contexts/ChatHistoryContext';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

export default function HistoricoPage() {
  const { conversations, deleteConversation, setCurrentConversationId } = useChatHistory();
  const { user } = useUser();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    router.push(`/dashboard/chat?conversation=${conversationId}`);
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    router.push('/dashboard/chat');
  };

  const handleDeleteConversation = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta conversa?')) {
      deleteConversation(conversationId);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Hoje';
    } else if (days === 1) {
      return 'Ontem';
    } else if (days < 7) {
      return `${days} dias atrás`;
    } else if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'} atrás`;
    } else {
      return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const getPreview = (conversation: any) => {
    const firstUserMessage = conversation.messages.find((msg: any) => msg.role === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.length > 100
        ? firstUserMessage.content.substring(0, 100) + '...'
        : firstUserMessage.content;
    }
    return 'Nova conversa';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push('/dashboard/chat')}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Histórico de Conversas
            </h1>
            <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
              {conversations.length} {conversations.length === 1 ? 'conversa' : 'conversas'} salvas
            </p>
          </div>
        </div>

        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-neutral-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500"
          />
        </div>
      </div>

      {filteredConversations.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-gray-400 dark:text-neutral-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
          </h3>
          <p className="text-gray-600 dark:text-neutral-400 mb-6">
            {searchTerm
              ? 'Tente buscar com outros termos'
              : 'Comece uma nova conversa com a IA para criar seu primeiro histórico'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleNewChat}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium"
            >
              Iniciar Conversa
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleOpenConversation(conversation.id)}
              className="group bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-700 rounded-xl p-4 sm:p-5 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {conversation.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400 mt-1">
                        <span>{formatDate(conversation.updatedAt)}</span>
                        <span>•</span>
                        <span>
                          {conversation.messages.length}{' '}
                          {conversation.messages.length === 1 ? 'mensagem' : 'mensagens'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-neutral-400 line-clamp-2 ml-13">
                    {getPreview(conversation)}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(e, conversation.id)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-gray-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 transition-colors flex-shrink-0"
                  title="Excluir conversa"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
