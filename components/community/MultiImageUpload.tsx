'use client';

import React, { useRef } from 'react';

interface MultiImageUploadProps {
  onImagesSelect: (files: File[]) => void;
  currentImages: string[];
  onRemoveImage: (index: number) => void;
  maxImages?: number;
}

export function MultiImageUpload({
  onImagesSelect,
  currentImages,
  onRemoveImage,
  maxImages = 10,
}: MultiImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onImagesSelect(files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const canAddMore = currentImages.length < maxImages;

  return (
    <div className="space-y-3">
      {/* Grid de imagens */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {currentImages.map((image, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
              <img
                src={image}
                alt={`Imagem ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Badge de ordem */}
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-medium backdrop-blur-sm">
                {index + 1}
              </div>

              {/* Botão remover */}
              <button
                onClick={() => onRemoveImage(index)}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all shadow-lg opacity-0 group-hover:opacity-100"
                aria-label="Remover imagem"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Overlay de primeira imagem */}
              {index === 0 && currentImages.length > 1 && (
                <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                  Capa
                </div>
              )}
            </div>
          ))}

          {/* Botão adicionar mais (se ainda pode) */}
          {canAddMore && (
            <button
              onClick={handleClick}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 flex flex-col items-center justify-center gap-2 transition-colors bg-gray-50 hover:bg-blue-50"
            >
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs text-gray-500 font-medium">Adicionar</span>
            </button>
          )}
        </div>
      )}

      {/* Botão inicial (quando não tem imagens) */}
      {currentImages.length === 0 && (
        <button
          onClick={handleClick}
          className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 flex flex-col items-center justify-center gap-3 transition-all bg-gray-50 hover:bg-blue-50"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">Adicionar imagens</p>
            <p className="text-xs text-gray-500 mt-1">Até {maxImages} imagens</p>
          </div>
        </button>
      )}

      {/* Info */}
      {currentImages.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          {currentImages.length} de {maxImages} imagens • A primeira será a capa
        </p>
      )}

      {/* Input escondido */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
