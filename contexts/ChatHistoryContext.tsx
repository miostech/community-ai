'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatHistoryContextType {
  conversations: ChatConversation[];
  currentConversationId: string | null;
  saveConversation: (messages: Message[], title?: string) => void;
  loadConversation: (id: string) => ChatConversation | null;
  deleteConversation: (id: string) => void;
  createNewConversation: () => string;
  updateConversation: (id: string, messages: Message[]) => void;
  setCurrentConversationId: (id: string | null) => void;
}

const ChatHistoryContext = createContext<ChatHistoryContextType | undefined>(undefined);

export function ChatHistoryProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Carregar conversas do localStorage ao montar
  useEffect(() => {
    const savedConversations = localStorage.getItem('chatConversations');
    if (savedConversations) {
      const parsed = JSON.parse(savedConversations);
      // Converter strings de data de volta para objetos Date
      const conversationsWithDates = parsed.map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
      setConversations(conversationsWithDates);
    }
  }, []);

  // Salvar conversas no localStorage sempre que mudar
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('chatConversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  const generateTitle = (messages: Message[]): string => {
    // Pega a primeira mensagem do usuário para gerar o título
    const firstUserMessage = messages.find((msg) => msg.role === 'user');
    if (firstUserMessage) {
      const content = firstUserMessage.content;
      // Limita a 50 caracteres e adiciona reticências se necessário
      return content.length > 50 ? content.substring(0, 50) + '...' : content;
    }
    return 'Nova conversa';
  };

  const createNewConversation = (): string => {
    const newId = `conv_${Date.now()}`;
    const newConversation: ChatConversation = {
      id: newId,
      title: 'Nova conversa',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversationId(newId);
    return newId;
  };

  const saveConversation = (messages: Message[], title?: string) => {
    if (messages.length === 0) return;

    const conversationTitle = title || generateTitle(messages);
    const now = new Date();

    if (currentConversationId) {
      // Atualizar conversa existente
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversationId
            ? {
                ...conv,
                title: conv.title === 'Nova conversa' ? conversationTitle : conv.title,
                messages,
                updatedAt: now,
              }
            : conv
        )
      );
    } else {
      // Criar nova conversa
      const newConversation: ChatConversation = {
        id: `conv_${Date.now()}`,
        title: conversationTitle,
        messages,
        createdAt: now,
        updatedAt: now,
      };
      setConversations((prev) => [newConversation, ...prev]);
      setCurrentConversationId(newConversation.id);
    }
  };

  const updateConversation = (id: string, messages: Message[]) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === id
          ? {
              ...conv,
              messages,
              updatedAt: new Date(),
              title: conv.title === 'Nova conversa' ? generateTitle(messages) : conv.title,
            }
          : conv
      )
    );
  };

  const loadConversation = (id: string): ChatConversation | null => {
    const conversation = conversations.find((conv) => conv.id === id);
    return conversation || null;
  };

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
  };

  return (
    <ChatHistoryContext.Provider
      value={{
        conversations,
        currentConversationId,
        saveConversation,
        loadConversation,
        deleteConversation,
        createNewConversation,
        updateConversation,
        setCurrentConversationId,
      }}
    >
      {children}
    </ChatHistoryContext.Provider>
  );
}

export function useChatHistory() {
  const context = useContext(ChatHistoryContext);
  if (context === undefined) {
    throw new Error('useChatHistory must be used within a ChatHistoryProvider');
  }
  return context;
}
