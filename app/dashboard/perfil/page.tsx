'use client';

import React, { useState, useRef } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function PerfilPage() {
  const { user, updateUser, updateAvatar } = useUser();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        updateAvatar(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    updateAvatar(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    updateUser({ name, email });
    setTimeout(() => {
      setIsSaving(false);
      alert('Perfil atualizado com sucesso!');
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meu Perfil</h1>
        <p className="text-gray-600">Gerencie suas informações e foto de perfil</p>
      </div>

      <Card className="space-y-8">
        {/* Foto de Perfil */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Foto de Perfil</h2>
          <div className="flex items-start space-x-6">
            <div className="relative">
              {avatarPreview ? (
                <div className="relative">
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-100"
                  />
                  <button
                    onClick={handleRemoveAvatar}
                    className="absolute -bottom-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarPreview ? 'Alterar foto' : 'Adicionar foto'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-gray-500">
                Recomendamos uma imagem quadrada de pelo menos 400x400 pixels. Formatos: JPG, PNG.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Informações Pessoais</h2>
          <div className="space-y-6">
            <Input
              label="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={() => {
              setName(user.name);
              setEmail(user.email);
              setAvatarPreview(user.avatar);
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
