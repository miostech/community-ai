'use client';

import React, { useState, useRef } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';

export default function PerfilPage() {
  const { user, updateUser, updateAvatar, logout } = useUser();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [phoneCountryCode, setPhoneCountryCode] = useState(user.phoneCountryCode);
  const [instagramProfile, setInstagramProfile] = useState(user.instagramProfile);
  const [tiktokProfile, setTiktokProfile] = useState(user.tiktokProfile);
  const [primarySocialLink, setPrimarySocialLink] = useState<'instagram' | 'tiktok' | null>(user.primarySocialLink);
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
    updateUser({ 
      name, 
      email, 
      phone, 
      phoneCountryCode,
      instagramProfile,
      tiktokProfile,
      primarySocialLink,
    });
    setTimeout(() => {
      setIsSaving(false);
      alert('Perfil atualizado com sucesso!');
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24 sm:pb-8">
      <div className="mb-6 sm:mb-8 pt-4 sm:pt-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Meu Perfil</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-neutral-400">Gerencie suas informações e foto de perfil</p>
      </div>

      <Card className="space-y-6 sm:space-y-8">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Foto de Perfil</h2>
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative flex-shrink-0">
              {avatarPreview ? (
                <div className="relative">
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-gray-100 dark:border-neutral-700"
                  />
                  <button
                    onClick={handleRemoveAvatar}
                    className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-red-500 text-white rounded-full p-1.5 sm:p-2 hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl font-bold">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3 w-full text-center sm:text-left">
              <div>
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto"
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
              <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400">
                Imagem quadrada de 400x400px. JPG, PNG.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-neutral-700 pt-6 sm:pt-8">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Informações Pessoais</h2>
          <div className="space-y-4 sm:space-y-6">
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

        <div className="border-t border-gray-200 dark:border-neutral-700 pt-6 sm:pt-8">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">Contato</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 mb-4 sm:mb-6">
            Seu telefone para contato direto com a comunidade
          </p>
          <PhoneInput
            label="Telefone/WhatsApp"
            value={phone}
            countryCode={phoneCountryCode}
            onValueChange={setPhone}
            onCountryCodeChange={setPhoneCountryCode}
          />
        </div>

        <div className="border-t border-gray-200 dark:border-neutral-700 pt-6 sm:pt-8">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">Redes Sociais</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 mb-4 sm:mb-6">
            Conecte suas redes sociais ao seu perfil. O link principal aparecerá nos stories.
          </p>
          
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Instagram</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-neutral-400 text-sm">@</span>
                <input
                  type="text"
                  value={instagramProfile}
                  onChange={(e) => setInstagramProfile(e.target.value.replace('@', ''))}
                  placeholder="seu_usuario"
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                  suppressHydrationWarning
                />
              </div>
              {instagramProfile && (
                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1.5">Link: instagram.com/{instagramProfile}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">TikTok</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-neutral-400 text-sm">@</span>
                <input
                  type="text"
                  value={tiktokProfile}
                  onChange={(e) => setTiktokProfile(e.target.value.replace('@', ''))}
                  placeholder="seu_usuario"
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                  suppressHydrationWarning
                />
              </div>
              {tiktokProfile && (
                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1.5">Link: tiktok.com/@{tiktokProfile}</p>
              )}
            </div>

            {(instagramProfile || tiktokProfile) && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 border border-purple-200 dark:border-purple-800 rounded-xl p-4 sm:p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                  </svg>
                  Link principal do perfil
                </h3>
                <p className="text-xs text-gray-600 dark:text-neutral-400 mb-3">
                  Este link aparecerá quando alguém clicar na sua foto nos stories
                </p>
                
                <div className="space-y-2">
                  {instagramProfile && (
                    <button
                      onClick={() => setPrimarySocialLink('instagram')}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                        primarySocialLink === 'instagram'
                          ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/50'
                          : 'border-gray-200 dark:border-neutral-600 hover:border-purple-300 dark:hover:border-purple-500'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        primarySocialLink === 'instagram'
                          ? 'border-purple-500 dark:border-purple-400'
                          : 'border-gray-300 dark:border-neutral-500'
                      }`}>
                        {primarySocialLink === 'instagram' && (
                          <div className="w-3 h-3 rounded-full bg-purple-500 dark:bg-purple-400" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">Instagram</div>
                        <div className="text-xs text-gray-500 dark:text-neutral-400">@{instagramProfile}</div>
                      </div>
                      <svg className="w-5 h-5 text-pink-600 dark:text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </button>
                  )}

                  {tiktokProfile && (
                    <button
                      onClick={() => setPrimarySocialLink('tiktok')}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                        primarySocialLink === 'tiktok'
                          ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/50'
                          : 'border-gray-200 dark:border-neutral-600 hover:border-purple-300 dark:hover:border-purple-500'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        primarySocialLink === 'tiktok'
                          ? 'border-purple-500 dark:border-purple-400'
                          : 'border-gray-300 dark:border-neutral-500'
                      }`}>
                        {primarySocialLink === 'tiktok' && (
                          <div className="w-3 h-3 rounded-full bg-purple-500 dark:bg-purple-400" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">TikTok</div>
                        <div className="text-xs text-gray-500 dark:text-neutral-400">@{tiktokProfile}</div>
                      </div>
                      <svg className="w-5 h-5 text-gray-900 dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-reverse space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200 dark:border-neutral-700">
          <Button
            variant="ghost"
            onClick={() => {
              setName(user.name);
              setEmail(user.email);
              setPhone(user.phone);
              setPhoneCountryCode(user.phoneCountryCode);
              setInstagramProfile(user.instagramProfile);
              setTiktokProfile(user.tiktokProfile);
              setPrimarySocialLink(user.primarySocialLink);
              setAvatarPreview(user.avatar);
            }}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </Card>

      <Card className="mt-4 sm:mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex-1">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Sair da conta</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 mt-1">Desconectar desta conta no dispositivo</p>
          </div>
          <Button
            variant="secondary"
            onClick={logout}
            className="w-full sm:w-auto bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border-red-200 dark:border-red-800 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </Button>
        </div>
      </Card>
    </div>
  );
}
