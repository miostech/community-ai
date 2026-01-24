'use client';

import React, { useState } from 'react';

interface CourseImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function CourseImage({ src, alt, className = '' }: CourseImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!hasError ? (
        <>
          {isLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 animate-pulse" />
          )}
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
          />
        </>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
          <div className="text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <p className="text-sm text-gray-500 font-medium">Imagem do curso</p>
          </div>
        </div>
      )}
    </div>
  );
}
