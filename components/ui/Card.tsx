import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`
        bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:border-gray-200 hover:shadow-lg' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
