'use client';

import React, { useState, useRef } from 'react';

interface ImageCarouselProps {
  images: string[];
  className?: string;
}

export function ImageCarousel({ images, className = '' }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!images || images.length === 0) return null;

  const minSwipeDistance = 50; // Distância mínima para considerar um swipe

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  // Touch handlers para swipe (mobile)
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }

    setIsDragging(false);
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Mouse handlers para drag (desktop)
  const onMouseDown = (e: React.MouseEvent) => {
    setTouchEnd(0);
    setTouchStart(e.clientX);
    setIsDragging(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTouchEnd(e.clientX);
  };

  const onMouseUp = () => {
    if (!touchStart || !touchEnd) {
      setIsDragging(false);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }

    setIsDragging(false);
    setTouchStart(0);
    setTouchEnd(0);
  };

  const onMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setTouchStart(0);
      setTouchEnd(0);
    }
  };

  return (
    <div className={`relative group overflow-hidden ${className}`}>
      {/* Imagem principal */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/5] max-h-[600px] bg-gray-100 dark:bg-slate-800 overflow-hidden select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'pan-y pinch-zoom',
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}
      >
        <img
          src={images[currentIndex]}
          alt={`Imagem ${currentIndex + 1}`}
          className={`w-full h-full object-cover transition-transform duration-200 ${isDragging ? 'scale-95' : 'scale-100'
            }`}
          draggable={false}
        />

        {/* Indicador de swipe (quando está arrastando) */}
        {isDragging && touchEnd !== 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10">
            {touchStart - touchEnd > 20 && (
              <div className="animate-fade-in-up">
                <svg className="w-12 h-12 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
            {touchStart - touchEnd < -20 && (
              <div className="animate-fade-in-up">
                <svg className="w-12 h-12 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Contador de imagens */}
        {images.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2.5 py-1 rounded-full font-medium backdrop-blur-sm z-10">
            {currentIndex + 1}/{images.length}
          </div>
        )}

        {/* Setas de navegação - apenas se tiver mais de uma imagem e não estiver arrastando */}
        {images.length > 1 && !isDragging && (
          <>
            {/* Seta esquerda */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 z-20 opacity-0 group-hover:opacity-100 sm:opacity-100"
              aria-label="Imagem anterior"
            >
              <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Seta direita */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 z-20 opacity-0 group-hover:opacity-100 sm:opacity-100"
              aria-label="Próxima imagem"
            >
              <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Indicadores (dots) */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`transition-all ${index === currentIndex
                ? 'w-6 h-1.5 bg-blue-600 rounded-full'
                : 'w-1.5 h-1.5 bg-gray-300 rounded-full hover:bg-gray-400'
                }`}
              aria-label={`Ir para imagem ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
