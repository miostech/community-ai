'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AddToDesktopModal } from '@/components/AddToDesktopModal';

interface AddToDesktopContextValue {
  openAddToDesktopModal: () => void;
}

const AddToDesktopContext = createContext<AddToDesktopContextValue | null>(null);

export function AddToDesktopProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openAddToDesktopModal = useCallback(() => {
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <AddToDesktopContext.Provider value={{ openAddToDesktopModal }}>
      {children}
      <AddToDesktopModal open={open} onClose={closeModal} />
    </AddToDesktopContext.Provider>
  );
}

export function useAddToDesktop() {
  const ctx = useContext(AddToDesktopContext);
  if (!ctx) {
    throw new Error('useAddToDesktop must be used within AddToDesktopProvider');
  }
  return ctx;
}
