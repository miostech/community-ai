'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';

const suggestedPrompts = [
  'Criar roteiro para Reels',
  'Ideia de post viral',
  'Storytelling pessoal',
  'Conteúdo educativo',
  'Venda sem parecer venda',
];

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [placeholderText, setPlaceholderText] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const fullPlaceholder = 'Crie ideias de conteúdo para Instagram';
  
  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex < fullPlaceholder.length) {
        setPlaceholderText(fullPlaceholder.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50); // Velocidade da digitação
    
    return () => clearInterval(typingInterval);
  }, [fullPlaceholder]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const firstHalf = container.children.length / 2;
      const firstHalfWidth = Array.from(container.children)
        .slice(0, firstHalf)
        .reduce((sum, child) => sum + (child as HTMLElement).offsetWidth + 8, 0); // 8px é o gap
      
      container.style.setProperty('--scroll-width', `${firstHalfWidth}px`);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      window.location.href = '/login';
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
    // Pequeno delay para atualizar o input antes de redirecionar
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <Header />

      {/* Hero Section */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-12 sm:pb-20 md:pt-40 md:pb-32">
        <div className="text-center space-y-6 sm:space-y-8">
          {/* Launch Banner */}
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-blue-700">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-medium">Lançamento Conteúdo IA</span>
          </div>

          {/* Headline */}
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-tight px-2">
              Dê vida às suas ideias de conteúdo
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
              Crie roteiros, ideias e estratégias completas em minutos, apenas conversando com a IA.
            </p>
          </div>

          {/* Main Input */}
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto mt-8 sm:mt-12 px-4" suppressHydrationWarning>
            <div className="relative flex items-center bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shadow-lg hover:border-gray-300 transition-all focus-within:border-blue-500 focus-within:shadow-xl">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholderText || 'Crie ideias de conteúdo para Instagram'}
                className="flex-1 px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base md:text-lg outline-none bg-transparent text-gray-900 placeholder-gray-400"
                suppressHydrationWarning
              />
              <button
                type="submit"
                className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 hover:bg-blue-700 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors shadow-md hover:shadow-lg flex-shrink-0"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </form>

          {/* Suggested Prompts */}
          <div className="mt-4 sm:mt-6 px-4">
            <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">Sem ideias? Tente uma destas opções:</p>
            <div className="relative overflow-hidden w-full max-w-3xl mx-auto">
              <div 
                ref={scrollContainerRef}
                className="flex items-center gap-2 animate-scroll"
              >
                {/* Duplicar os prompts para criar loop infinito */}
                {[...suggestedPrompts, ...suggestedPrompts].map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptClick(prompt)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-xs sm:text-sm text-gray-700 transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-8 sm:mt-12 md:mt-16 flex items-center justify-center space-x-2 sm:space-x-3">
            <div className="flex -space-x-1.5 sm:-space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white"></div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white"></div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-2 border-white"></div>
            </div>
            <div className="text-left">
              <p className="text-xs sm:text-sm font-semibold text-gray-900">
                +20 mil
              </p>
              <p className="text-[10px] sm:text-xs text-gray-600">
                Alunos criando conteúdo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Criadores Section */}
      <section id="criadores" className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-8 sm:pb-12">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 px-2">Criado por especialistas em conteúdo</h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Que já alcançaram mais de 1 milhão de seguidores e estão dispostos a compartilhar seus conhecimentos com você.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto px-4">
          {/* Natália Trombelli */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 sm:p-8 text-center hover:shadow-lg transition-all">
            <div className="mb-4 sm:mb-6">
              <div 
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto mb-3 sm:mb-4 border-2 border-gray-200 bg-cover bg-center"
                style={{
                  backgroundImage: 'url(/images/cursos/natalia-trombelli.png)',
                }}
              />
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Natália Trombelli</h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-2">@natrombellii</p>
              <div className="flex items-center justify-center space-x-1 mb-4">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
                <span className="text-sm font-semibold text-gray-700">+1.1 milhão</span>
                <span className="text-sm text-gray-500">seguidores</span>
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4 sm:mb-6">
              Criadora de conteúdo especializada em estratégias de engajamento e crescimento orgânico. 
              Compartilha conhecimento prático sobre criação de conteúdo que converte.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <a 
                href="https://instagram.com/natrombellii" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-600 transition-colors"
                title="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="https://tiktok.com/@natrombellii" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-600 transition-colors"
                title="TikTok"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a4.85 4.85 0 0 0 3.77 4.22v-3.29a4.85 4.85 0 0 1-1-.4z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Luigi Andersen */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 sm:p-8 text-center hover:shadow-lg transition-all">
            <div className="mb-4 sm:mb-6">
              <div 
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto mb-3 sm:mb-4 border-2 border-gray-200 bg-cover bg-center"
                style={{
                  backgroundImage: 'url(/images/cursos/luigi-andersen.png)',
                }}
              />
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Luigi Andersen</h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-2">@luigi.andersen</p>
              <div className="flex items-center justify-center space-x-1 mb-4">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
                <span className="text-sm font-semibold text-gray-700">+772 mil</span>
                <span className="text-sm text-gray-500">seguidores</span>
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4 sm:mb-6">
              Especialista em criação de conteúdo estratégico e monetização. 
              Ajuda criadores a transformarem sua paixão em negócio através de conteúdo de valor.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <a 
                href="https://instagram.com/luigi.andersen" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-600 transition-colors"
                title="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="https://tiktok.com/@luigi.andersen" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-600 transition-colors"
                title="TikTok"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a4.85 4.85 0 0 0 3.77 4.22v-3.29a4.85 4.85 0 0 1-1-.4z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos Section */}
      <section id="recursos" className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-4 px-2">Recursos</h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Tudo que você precisa para criar conteúdo que converte e gera resultados.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-4 sm:p-6 hover:shadow-lg transition-all">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 sm:mb-2">Ideias Estruturadas</h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Receba ideias de como melhorar seu conteúdo, ganhar engajamento e conversão pra você se tornar um criador de conteúdo de sucesso.
            </p>
          </div>

          {/* <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-4 sm:p-6 hover:shadow-lg transition-all">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 sm:mb-2">Templates Prontos</h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Templates e estruturas que você pode adaptar para qualquer rede social.
            </p>
          </div> */}

          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-4 sm:p-6 hover:shadow-lg transition-all">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 sm:mb-2">Chat com IA</h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Converse com a IA treinada pela Natália e pelo Luigi, ela será sua assistente de criação de conteúdo.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-4 sm:p-6 hover:shadow-lg transition-all">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 sm:mb-2">Comunidade</h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Faça parte de uma comunidade de criadores de conteúdo que buscam melhorar, se inspirar e se apoiar mutuamente. Tire suas dúvidas, compartilhe suas ideias e seja inspirado por outros criadores.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-4 sm:p-6 hover:shadow-lg transition-all">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 sm:mb-2">Temas em Alta</h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Saiba quais são os assuntos que estão em alta no momento, que estão gerando muito engajamento e conversão pra você se inspirar.
            </p>
          </div>

          {/* <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-4 sm:p-6 hover:shadow-lg transition-all">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 sm:mb-2">Projetos Organizados</h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Salve e organize todos os seus conteúdos em projetos para acessar depois.
            </p>
          </div> */}
        </div>
      </section>

      {/* Showcase Section - Comentado temporariamente */}
      {/* <section id="showcase" className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-4 px-2">Showcase</h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Veja exemplos reais de conteúdo criado na plataforma
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {/* Exemplo 1 */}
          {/* <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-4 sm:p-6 hover:shadow-lg transition-all">
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold">
                  IA
                </div>
                <span className="text-xs sm:text-sm text-gray-500">Conteúdo gerado</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-2 sm:mb-3">Roteiro para Reels - Engajamento</h3>
            </div>
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <div>
                <p className="font-medium text-gray-700 mb-1">Hook:</p>
                <p className="text-gray-600 italic">
                  "Você já parou para pensar como o conteúdo que você consome molda suas decisões?"
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">Desenvolvimento:</p>
                <p className="text-gray-600">
                  A verdade é que estamos constantemente sendo influenciados, mesmo sem perceber...
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">CTA:</p>
                <p className="text-gray-600">
                  Compartilhe nos comentários: qual foi o último conteúdo que mudou sua perspectiva?
                </p>
              </div>
            </div>
          </div> */}

          {/* Exemplo 2 */}
          {/* <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all">
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  IA
                </div>
                <span className="text-sm text-gray-500">Template aplicado</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">Storytelling Pessoal - Autoridade</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-700 mb-1">Narrativa:</p>
                <p className="text-gray-600">
                  "Há 3 anos, eu estava criando conteúdo sem estratégia. Foi quando descobri que..."
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">Lição:</p>
                <p className="text-gray-600">
                  Quando você entende seu público, cada post se torna uma oportunidade de conexão real.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">Resultado:</p>
                <p className="text-gray-600">
                  Hoje, cada conteúdo que crio tem propósito e impacto mensurável.
                </p>
              </div>
            </div>
          </div> */}

          {/* Exemplo 3 */}
          {/* <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all">
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  IA
                </div>
                <span className="text-sm text-gray-500">Conteúdo adaptado</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">Post Educativo - TikTok</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-700 mb-1">Hook (3 segundos):</p>
                <p className="text-gray-600 italic">
                  "POV: você descobrindo que TODO conteúdo que você vê está te influenciando"
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">Desenvolvimento:</p>
                <p className="text-gray-600">
                  Mas calma, isso não é ruim! Quando você entende como funciona...
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">CTA:</p>
                <p className="text-gray-600">
                  Salva esse vídeo e me conta: qual foi o último conteúdo que mudou sua cabeça?
                </p>
              </div>
            </div>
          </div> */}

          {/* Exemplo 4 */}
          {/* <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all">
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  IA
                </div>
                <span className="text-sm text-gray-500">Venda sutil</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">Conteúdo de Venda - Instagram</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-700 mb-1">Abordagem:</p>
                <p className="text-gray-600">
                  Em vez de vender diretamente, criamos valor primeiro através de educação...
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">Estratégia:</p>
                <p className="text-gray-600">
                  Mostrar o problema, apresentar a solução de forma natural, e então oferecer ajuda.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">Resultado:</p>
                <p className="text-gray-600">
                  Conversão orgânica sem parecer venda agressiva.
                </p>
              </div>
            </div>
          </div>
        </div> */}

        {/* <div className="text-center mt-8 sm:mt-12 px-4">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto">
              Começar a Criar Agora
            </Button>
          </Link>
        </div>
      </section> */}
    </div>
  );
}
