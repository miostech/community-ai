'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { DomeLogo } from '@/components/ui/DomeLogo';

export function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-gray-100 dark:border-neutral-800 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <DomeLogo className="text-base sm:text-xl" />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link 
              href={isHomePage ? "#criadores" : "/#criadores"} 
              className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors text-sm font-medium"
            >
              Criadores
            </Link>
            <Link 
              href={isHomePage ? "#recursos" : "/#recursos"} 
              className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors text-sm font-medium"
            >
              Recursos
            </Link>
            <Link href="/precos" className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors text-sm font-medium">
              Preços
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <ThemeToggle />
            <Link href="/login" className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors text-xs sm:text-sm font-medium py-2 px-1">
              Login
            </Link>
            <Link href="/precos">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white border-0 text-xs sm:text-sm px-3 sm:px-4">
                Começar Agora
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
