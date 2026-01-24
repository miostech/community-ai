'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-base sm:text-lg">IA</span>
            </div>
            <span className="font-semibold text-base sm:text-lg text-gray-900">Conteúdo IA</span>
            {/* <span className="text-xs sm:text-sm text-gray-500 font-normal">2.0</span> */}
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link href="/precos" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
              Preços
            </Link>
            <Link 
              href={isHomePage ? "#criadores" : "/#criadores"} 
              className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              Criadores
            </Link>
            <Link 
              href={isHomePage ? "#recursos" : "/#recursos"} 
              className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              Recursos
            </Link>
            <Link 
              href={isHomePage ? "#showcase" : "/#showcase"} 
              className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              Showcase
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors text-xs sm:text-sm font-medium">
              Login
            </Link>
            <Link href="/precos">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white border-0 text-xs sm:text-sm px-3 sm:px-4">
                Começar Agora
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
