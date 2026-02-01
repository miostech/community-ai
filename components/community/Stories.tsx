'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [pressedStory, setPressedStory] = useState<string | null>(null);

  const handleStoryClick = (user: StoryUser) => {
    router.push(`/dashboard/comunidade/perfil/${user.id}`);
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
        {users.map((user, index) => (
          <button 
            key={user.id} 
            onClick={() => handleStoryClick(user)}
            className="flex flex-col items-center flex-shrink-0 animate-fade-in-up cursor-pointer active:scale-95 transition-transform"
            style={{ 
              animationDelay: `${index * 0.05}s`,
              minWidth: '80px',
            }}
            onMouseEnter={() => setPressedStory(user.id)}
            onMouseLeave={() => setPressedStory(null)}
          >
            <div className="relative">
              {/* Ring gradient animado para stories */}
              <div className={`rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2.5px] transition-all duration-200 ${
                pressedStory === user.id ? 'scale-95' : 'group-hover:scale-105 group-active:scale-95'
              }`}>
                <div className="rounded-full bg-white dark:bg-black p-[2.5px]">
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
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-black">
                  <span className="text-white text-[10px] font-bold">
                    {index === 0 ? '🔥' : index === 1 ? '⭐' : '✨'}
                  </span>
                </div>
              )}
            </div>
            
            <p className="mt-2 text-xs font-medium text-gray-900 dark:text-slate-100 text-center max-w-[64px] truncate">
              {user.name.split(' ')[0]}
            </p>
            
            <div className="flex items-center gap-1 mt-0.5">
              <svg className="w-2.5 h-2.5 text-gray-400 dark:text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">{user.interactionCount}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
