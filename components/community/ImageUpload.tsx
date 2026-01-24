'use client';

import React, { useRef, useState, useEffect } from 'react';

interface ImageUploadProps {
  onImageSelect: (file: File | null) => void;
  currentImage?: string | null;
}

export function ImageUpload({ onImageSelect, currentImage }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  useEffect(() => {
    setPreview(currentImage || null);
  }, [currentImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        onImageSelect(file);
      } else {
        alert('Por favor, selecione apenas imagens.');
        onImageSelect(null);
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-64 object-cover rounded-xl border border-gray-200"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-red-600 rounded-full p-2 hover:bg-white hover:scale-110 transition-all shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute bottom-3 left-3 right-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-white/90 backdrop-blur-sm text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-white transition-colors"
            >
              Trocar imagem
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4 group-hover:from-blue-200 group-hover:to-purple-200 transition-colors">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">Adicionar imagem</p>
            <p className="text-xs text-gray-500">PNG, JPG até 10MB</p>
          </div>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
