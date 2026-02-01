'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { nameToSlug } from '@/lib/community-users';
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
    const phoneTrimmed = phone?.trim() ?? '';
    if (!phoneTrimmed) {
      alert('O telefone é obrigatório. Preencha para continuar usando a comunidade.');
      return;
    }
    setIsSaving(true);
    updateUser({ 
      name, 
      email, 
      phone: phoneTrimmed, 
      phoneCountryCode,
      instagramProfile,
      tiktokProfile,
      primarySocialLink: null,
    });
    setTimeout(() => {
      setIsSaving(false);
      alert('Perfil atualizado com sucesso!');
    }, 500);
  };

  const hasPhone = Boolean((phone ?? '').trim());
  const userHasPhone = Boolean((user.phone ?? '').trim());

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24 sm:pb-8">
      {!userHasPhone && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
          <p className="text-sm font-medium">
            O telefone é obrigatório para usar a comunidade. Preencha o campo abaixo e salve para continuar.
          </p>
        </div>
      )}

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
            Seu telefone para contato direto com a comunidade <span className="text-amber-600 dark:text-amber-400 font-medium">(obrigatório)</span>
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
            Preencha os que quiser. Os dois links aparecerão no seu perfil quando alguém visualizar.
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
                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1.5">
                  Link: tiktok.com/@{tiktokProfile}
                </p>
              )}
            </div>
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
              setAvatarPreview(user.avatar);
            }}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !hasPhone}
            className="w-full sm:w-auto"
          >
            {isSaving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </Card>

      <Card className="mt-4 sm:mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Ver meu perfil público</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 mt-1">Veja como sua página aparece para quem clica no seu nome ou foto na comunidade</p>
          </div>
          <Link
            href={`/dashboard/comunidade/perfil/${nameToSlug(user.name)}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors text-sm font-medium w-full sm:w-auto shrink-0"
          >
            <svg className="w-5 h-5 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Ver como outros me veem
          </Link>
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
