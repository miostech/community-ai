'use client';

import React, { useState } from 'react';

interface StoryUser {
  id: string;
  name: string;
  avatar: string | null;
  initials: string;
  interactionCount: number;
  instagramProfile?: string;
  tiktokProfile?: string;
  primarySocialLink?: 'instagram' | 'tiktok' | null;
}

interface StoriesProps {
  users: StoryUser[];
}

export function Stories({ users }: StoriesProps) {
  const [pressedStory, setPressedStory] = useState<string | null>(null);

  const getSocialLink = (user: StoryUser): string | null => {
    if (!user.primarySocialLink) return null;
    
    if (user.primarySocialLink === 'instagram' && user.instagramProfile) {
      return `https://instagram.com/${user.instagramProfile}`;
    }
    
    if (user.primarySocialLink === 'tiktok' && user.tiktokProfile) {
      return `https://tiktok.com/@${user.tiktokProfile}`;
    }
    
    return null;
  };

  const handleStoryClick = (user: StoryUser) => {
    const socialLink = getSocialLink(user);
    if (socialLink) {
      window.open(socialLink, '_blank');
    }
  };

  return (
    <div 
      className="w-full overflow-x-auto overflow-y-hidden scrollbar-hide"
      style={{
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <div 
        className="flex gap-4 px-4 py-3"
        style={{ 
          display: 'flex',
          flexWrap: 'nowrap',
          minWidth: 'min-content',
        }}
      >
        {users.map((user, index) => {
          const socialLink = getSocialLink(user);
          const hasLink = !!socialLink;
          
          return (
          <button 
            key={user.id} 
            onClick={() => handleStoryClick(user)}
            className={`flex flex-col items-center flex-shrink-0 animate-fade-in-up ${
              hasLink ? 'cursor-pointer active:scale-95 transition-transform' : 'cursor-default'
            }`}
            style={{ 
              animationDelay: `${index * 0.05}s`,
              minWidth: '80px',
            }}
            onMouseEnter={() => setPressedStory(user.id)}
            onMouseLeave={() => setPressedStory(null)}
            disabled={!hasLink}
          >
            <div className="relative">
              {/* Ring gradient animado para stories */}
              <div className={`rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2.5px] transition-all duration-200 ${
                pressedStory === user.id ? 'scale-95' : 'group-hover:scale-105 group-active:scale-95'
              }`}>
                <div className="rounded-full bg-white p-[2.5px]">
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden shadow-md">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-white font-bold text-lg">
                        {user.initials}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Badge de interação (top users) */}
              {index < 3 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <span className="text-white text-[10px] font-bold">
                    {index === 0 ? '🔥' : index === 1 ? '⭐' : '✨'}
                  </span>
                </div>
              )}
            </div>
            
            <p className="mt-2 text-xs font-medium text-gray-900 text-center max-w-[64px] truncate">
              {user.name.split(' ')[0]}
            </p>
            
            {/* Indicador de interação */}
            <div className="flex items-center gap-1 mt-0.5">
              <svg className="w-2.5 h-2.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              <span className="text-[10px] text-gray-500 font-medium">{user.interactionCount}</span>
            </div>
            
            {/* Indicador de link social */}
            {hasLink && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded-full shadow-sm border border-gray-100">
                {user.primarySocialLink === 'instagram' ? (
                  <svg className="w-3 h-3 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                ) : (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                )}
              </div>
            )}
          </button>
          );
        })}
      </div>
    </div>
  );
}
