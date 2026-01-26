import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}: ButtonProps) {
  const baseStyles = 'font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500 shadow-sm hover:shadow-md disabled:text-white',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 disabled:text-gray-900',
    ghost: 'bg-transparent text-gray-900 hover:bg-gray-100 focus:ring-gray-500 disabled:text-gray-900'
  };
  
  const sizes = {
    sm: 'px-4 py-2',
    md: 'px-6 py-3',
    lg: 'px-8 py-4'
  };
  
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };
  
  // Detecta se há classes de cor sendo sobrescritas
  const hasColorOverride = 
    className.includes('bg-') || 
    className.includes('border-') || 
    /text-(white|black|gray-[0-9]|red-|blue-|green-|yellow-|purple-|pink-|indigo-)/.test(className);
  
  // Detecta se há tamanho de texto customizado
  const hasTextSizeOverride = /text-(xs|sm|base|lg|xl|2xl|3xl)/.test(className);
  
  const textSizeClass = hasTextSizeOverride ? '' : textSizes[size];
  
  const finalClassName = hasColorOverride
    ? `${baseStyles} ${sizes[size]} ${textSizeClass} ${className}`
    : `${baseStyles} ${variants[variant]} ${sizes[size]} ${textSizeClass} ${className}`;
  
  return (
    <button
      className={finalClassName}
      {...props}
    >
      {children}
    </button>
  );
}
