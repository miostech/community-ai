'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  name: string;
  email: string;
  avatar: string | null;
}

interface UserContextType {
  user: User;
  updateUser: (updates: Partial<User>) => void;
  updateAvatar: (avatar: string | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>({
    name: 'Usuário',
    email: 'usuario@email.com',
    avatar: null,
  });

  // Carregar do localStorage ao inicializar
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Erro ao carregar usuário:', e);
      }
    }
  }, []);

  // Salvar no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('user', JSON.stringify(user));
  }, [user]);

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const updateAvatar = (avatar: string | null) => {
    setUser((prev) => ({ ...prev, avatar }));
  };

  const logout = () => {
    // Limpar dados do usuário
    setUser({
      name: 'Usuário',
      email: 'usuario@email.com',
      avatar: null,
    });
    // Limpar localStorage
    localStorage.removeItem('user');
    // Redirecionar para login
    window.location.href = '/login';
  };

  return (
    <UserContext.Provider value={{ user, updateUser, updateAvatar, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
