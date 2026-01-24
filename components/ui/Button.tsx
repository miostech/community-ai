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
  const baseStyles = 'font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500 shadow-sm hover:shadow-md',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-500'
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };
  
  // Se className contém classes que sobrescrevem, aplica por último
  const finalClassName = className.includes('bg-') || className.includes('text-') || className.includes('border-')
    ? `${baseStyles} ${sizes[size]} ${className}`
    : `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <button
      className={finalClassName}
      {...props}
    >
      {children}
    </button>
  );
}
