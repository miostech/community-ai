'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export type NotificationType = 'like' | 'comment' | 'reply';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  created_at: string;
  actor: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  post_id: string;
  post_preview?: string;
  comment_preview?: string;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'agora';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

function getNotificationLabel(type: NotificationType): string {
  switch (type) {
    case 'like':
      return 'curtiu seu post';
    case 'comment':
      return 'comentou no seu post';
    case 'reply':
      return 'respondeu seu comentário';
    default:
      return 'interagiu';
  }
}

export function NotificationsButton() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count ?? 0);
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative w-8 h-8 flex items-center justify-center text-gray-600 dark:text-slate-400 active:bg-gray-100 dark:active:bg-slate-800 rounded-full transition-all"
        aria-label="Notificações"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-red-500 text-white text-xs font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(90vw,320px)] sm:w-80 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-slate-100">
              Notificações
            </h3>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="p-6 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500 dark:text-slate-400">
                Nenhuma notificação ainda
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-slate-800">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={`/dashboard/comunidade/${n.post_id}`}
                      onClick={() => setOpen(false)}
                      className="flex gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {n.actor.avatar_url ? (
                        <img
                          src={n.actor.avatar_url}
                          alt={n.actor.name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                          {n.actor.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-900 dark:text-slate-100">
                          <span className="font-semibold">{n.actor.name}</span>{' '}
                          {getNotificationLabel(n.type)}
                        </p>
                        {n.comment_preview && (
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            &quot;{n.comment_preview}
                            {n.comment_preview.length >= 100 ? '…' : ''}&quot;
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                          {formatTimeAgo(n.created_at)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
