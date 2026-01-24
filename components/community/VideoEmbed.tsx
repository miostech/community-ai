'use client';

import React from 'react';

interface VideoEmbedProps {
  url: string;
}

export function VideoEmbed({ url }: VideoEmbedProps) {
  // Detectar tipo de link
  const isTikTok = url.includes('tiktok.com');
  const isInstagram = url.includes('instagram.com') || url.includes('instagr.am');

  // Extrair username do TikTok (se disponível)
  const getTikTokInfo = (url: string) => {
    const match = url.match(/tiktok\.com\/@?([^/]+)\/video\/(\d+)/);
    if (match) {
      return { username: match[1], videoId: match[2] };
    }
    return null;
  };

  // Extrair código do Instagram
  const getInstagramCode = (url: string) => {
    const match = url.match(/instagram\.com\/p\/([A-Za-z0-9_-]+)/);
    return match ? match[1] : null;
  };

  if (isTikTok) {
    const tiktokInfo = getTikTokInfo(url);
    return (
      <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-6"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7.41a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-semibold text-gray-900">TikTok</span>
                {tiktokInfo?.username && (
                  <span className="text-sm text-gray-600">@{tiktokInfo.username}</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Clique para ver o vídeo no TikTok
              </p>
              <div className="flex items-center space-x-2 text-blue-600 text-sm font-medium">
                <span>Ver vídeo</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </div>
          </div>
        </a>
      </div>
    );
  }

  if (isInstagram) {
    const code = getInstagramCode(url);
    return (
      <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-6"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-semibold text-gray-900">Instagram</span>
                {code && (
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">Post</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Clique para ver o post no Instagram
              </p>
              <div className="flex items-center space-x-2 text-blue-600 text-sm font-medium">
                <span>Ver post</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </div>
          </div>
        </a>
      </div>
    );
  }

  // Link genérico
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline flex items-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <span className="truncate">{url}</span>
      </a>
    </div>
  );
}
