'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CreatePostContextType {
  showCreateModal: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
}

const CreatePostContext = createContext<CreatePostContextType | undefined>(undefined);

export function CreatePostProvider({ children }: { children: ReactNode }) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const openCreateModal = () => setShowCreateModal(true);
  const closeCreateModal = () => setShowCreateModal(false);

  return (
    <CreatePostContext.Provider value={{ showCreateModal, openCreateModal, closeCreateModal }}>
      {children}
    </CreatePostContext.Provider>
  );
}

export function useCreatePost() {
  const context = useContext(CreatePostContext);
  if (context === undefined) {
    throw new Error('useCreatePost must be used within a CreatePostProvider');
  }
  return context;
}
