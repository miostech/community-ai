'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ImageCarouselProps {
  images: string[];
  className?: string;
}

export function ImageCarousel({ images, className = '' }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalRef = useRef<boolean | null>(null);

  if (!images || images.length === 0) return null;

  const minSwipeDistance = 40;

  // Preload de todas as imagens
  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  const goToIndex = (index: number) => {
    if (index < 0 || index >= images.length || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setDragOffset(0);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      goToIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      goToIndex(currentIndex - 1);
    }
  };

  const handleSwipeEnd = useCallback(() => {
    const absOffset = Math.abs(dragOffset);
    const containerWidth = containerRef.current?.offsetWidth || 300;

    if (absOffset > minSwipeDistance || absOffset > containerWidth * 0.15) {
      if (dragOffset < 0 && currentIndex < images.length - 1) {
        // Swipe para esquerda → próxima
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev + 1);
      } else if (dragOffset > 0 && currentIndex > 0) {
        // Swipe para direita → anterior
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev - 1);
      }
    }

    setDragOffset(0);
    setIsDragging(false);
    isHorizontalRef.current = null;
    setTimeout(() => setIsTransitioning(false), 300);
  }, [dragOffset, currentIndex, images.length]);

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    startXRef.current = e.targetTouches[0].clientX;
    startYRef.current = e.targetTouches[0].clientY;
    isHorizontalRef.current = null;
    setIsDragging(true);
    setDragOffset(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isTransitioning) return;
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    const diffX = startXRef.current - currentX;
    const diffY = startYRef.current - currentY;

    // Detectar direção do gesto na primeira movimentação significativa
    if (isHorizontalRef.current === null && (Math.abs(diffX) > 5 || Math.abs(diffY) > 5)) {
      isHorizontalRef.current = Math.abs(diffX) > Math.abs(diffY);
    }

    // Só arrastar horizontalmente se o gesto for horizontal
    if (isHorizontalRef.current) {
      e.preventDefault();
      let offset = -diffX;

      // Resistência elástica nos limites
      if ((currentIndex === 0 && offset > 0) || (currentIndex === images.length - 1 && offset < 0)) {
        offset = offset * 0.3;
      }

      setDragOffset(offset);
    }
  };

  const onTouchEnd = () => {
    if (!isDragging) return;
    handleSwipeEnd();
  };

  // Mouse handlers
  const onMouseDown = (e: React.MouseEvent) => {
    if (isTransitioning) return;
    e.preventDefault();
    startXRef.current = e.clientX;
    isHorizontalRef.current = true;
    setIsDragging(true);
    setDragOffset(0);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isTransitioning) return;
    const diffX = startXRef.current - e.clientX;
    let offset = -diffX;

    // Resistência elástica nos limites
    if ((currentIndex === 0 && offset > 0) || (currentIndex === images.length - 1 && offset < 0)) {
      offset = offset * 0.3;
    }

    setDragOffset(offset);
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    handleSwipeEnd();
  };

  const onMouseLeave = () => {
    if (isDragging) {
      handleSwipeEnd();
    }
  };

  const containerWidth = containerRef.current?.offsetWidth || 0;
  const translateX = -(currentIndex * containerWidth) + dragOffset;

  return (
    <div className={`relative group overflow-hidden ${className}`}>
      {/* Container do carousel */}
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
          cursor: images.length > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          touchAction: 'pan-y pinch-zoom',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
      >
        {/* Faixa de imagens lado a lado */}
        <div
          style={{
            display: 'flex',
            width: `${images.length * 100}%`,
            height: '100%',
            transform: `translateX(${translateX}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            willChange: 'transform',
          }}
        >
          {images.map((src, index) => (
            <img
              key={index}
              src={src}
              alt={`Imagem ${index + 1}`}
              className="h-full object-cover"
              style={{ width: `${100 / images.length}%`, flexShrink: 0 }}
              draggable={false}
            />
          ))}
        </div>

        {/* Contador de imagens */}
        {images.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2.5 py-1 rounded-full font-medium backdrop-blur-sm z-10">
            {currentIndex + 1}/{images.length}
          </div>
        )}

        {/* Setas de navegação */}
        {images.length > 1 && !isDragging && (
          <>
            {currentIndex > 0 && (
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
            )}

            {currentIndex < images.length - 1 && (
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
            )}
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
              className={`transition-all duration-300 ${index === currentIndex
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
