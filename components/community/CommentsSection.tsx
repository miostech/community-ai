'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePosts, Comment } from '@/contexts/PostsContext';
import { useUser } from '@/contexts/UserContext';

interface CommentsSectionProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CommentsSection({ postId, isOpen, onClose }: CommentsSectionProps) {
  const { getPostComments, getCommentReplies, addComment, updateComment, comments: allComments } = usePosts();
  const { user } = useUser();
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const comments = getPostComments(postId);

  // Bloquear scroll do body e esconder MobileMenu
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('comments-modal-open');
      return () => {
        document.body.style.overflow = '';
        document.body.classList.remove('comments-modal-open');
      };
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      addComment(postId, commentText.trim(), user?.name || 'Usuário', user?.avatar || null);
      setCommentText('');
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      }, 100);
    }
  };

  const handleReplySubmit = (parentId: string) => {
    const text = replyText[parentId]?.trim();
    if (text) {
      addComment(postId, text, user?.name || 'Usuário', user?.avatar || null, parentId);
      setReplyText((prev) => ({ ...prev, [parentId]: '' }));
      setReplyingTo(null);
      setShowReplies((prev) => ({ ...prev, [parentId]: true }));
    }
  };

  const handleLikeComment = (commentId: string) => {
    // Buscar em todos os comentários (principais e respostas)
    const comment = allComments.find((c) => c.id === commentId);
    if (comment) {
      updateComment(commentId, {
        liked: !comment.liked,
        likes: comment.liked ? comment.likes - 1 : comment.likes + 1,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 pointer-events-auto"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black rounded-t-3xl shadow-2xl pointer-events-auto flex flex-col"
        style={{
          height: '75vh',
          maxHeight: '75vh',
          zIndex: 10000,
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex-shrink-0 h-14">
          <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Comentários</h2>
          <button 
            onClick={onClose}
            type="button"
            className="w-11 h-11 flex items-center justify-center text-gray-500 dark:text-slate-400 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200 dark:active:bg-slate-700 transition-colors"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Lista de comentários - COM SCROLL */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3"
          style={{
            minHeight: 0,
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
        >
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 dark:text-slate-400">
              <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-gray-300 dark:text-slate-600 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337L5 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              <p className="font-medium text-sm mb-1">Nenhum comentário ainda</p>
              <span className="text-xs text-gray-400 dark:text-slate-500">Seja o primeiro a comentar!</span>
            </div>
          ) : (
            <>
              {comments.map((comment) => {
                const replies = getCommentReplies(comment.id);
                const isShowingReplies = showReplies[comment.id];
                
                return (
                  <div key={comment.id} className="mb-4">
                    {/* Comentário principal */}
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {comment.author.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl px-3.5 py-2.5">
                          <p className="font-semibold text-sm text-gray-900 dark:text-slate-100 mb-0.5">{comment.author}</p>
                          <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed break-words">{comment.content}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 pl-3.5">
                          <span className="text-xs text-gray-500 dark:text-slate-400">{comment.timeAgo}</span>
                          <button
                            onClick={() => handleLikeComment(comment.id)}
                            type="button"
                            className={`flex items-center space-x-1 min-h-[44px] transition-colors ${
                              comment.liked ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-slate-400'
                            }`}
                          >
                            <svg
                              className="w-4 h-4"
                              fill={comment.liked ? 'currentColor' : 'none'}
                              stroke="currentColor"
                              strokeWidth={comment.liked ? 0 : 1.5}
                              viewBox="0 0 24 24"
                            >
                              {comment.liked ? (
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                              ) : (
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                                />
                              )}
                            </svg>
                            {comment.likes > 0 && (
                              <span className="text-xs font-semibold">{comment.likes}</span>
                            )}
                          </button>
                          <button
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            type="button"
                            className="text-xs font-semibold text-gray-500 dark:text-slate-400 min-h-[44px] flex items-center"
                          >
                            Responder
                          </button>
                        </div>
                        
                        {/* Mostrar/Ocultar respostas */}
                        {replies.length > 0 && (
                          <button
                            onClick={() => setShowReplies((prev) => ({ ...prev, [comment.id]: !prev[comment.id] }))}
                            type="button"
                            className="text-xs text-gray-500 dark:text-slate-400 mt-2 pl-3.5 min-h-[32px] flex items-center"
                          >
                            {isShowingReplies ? 'Ocultar' : 'Ver'} {replies.length} {replies.length === 1 ? 'resposta' : 'respostas'}
                          </button>
                        )}
                        
                        {/* Input de resposta */}
                        {replyingTo === comment.id && (
                          <div className="mt-3 ml-3.5 flex gap-2 items-center w-full pr-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <input
                              type="text"
                              value={replyText[comment.id] || ''}
                              onChange={(e) => setReplyText((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                              placeholder={`Responder ${comment.author}...`}
                              className="flex-1 min-w-0 px-3 py-2 text-sm bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-2xl outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                              style={{ WebkitAppearance: 'none', fontSize: '16px' }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleReplySubmit(comment.id);
                                }
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => handleReplySubmit(comment.id)}
                              type="button"
                              disabled={!replyText[comment.id]?.trim()}
                              className="px-3 py-2 text-sm font-bold text-blue-600 dark:text-blue-400 disabled:text-gray-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed flex-shrink-0 whitespace-nowrap"
                            >
                              Enviar
                            </button>
                          </div>
                        )}
                        
                        {/* Lista de respostas */}
                        {isShowingReplies && replies.length > 0 && (
                          <div className="mt-3 ml-3.5 space-y-3 border-l-2 border-gray-200 dark:border-slate-600 pl-3">
                            {replies.map((reply) => (
                              <div key={reply.id} className="flex gap-2">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                                  {reply.author.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl px-3 py-2">
                                    <p className="font-semibold text-xs text-gray-900 dark:text-slate-100 mb-0.5">{reply.author}</p>
                                    <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed break-words">{reply.content}</p>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 pl-3">
                                    <span className="text-[10px] text-gray-500 dark:text-slate-400">{reply.timeAgo}</span>
                                    <button
                                      onClick={() => handleLikeComment(reply.id)}
                                      type="button"
                                      className={`flex items-center space-x-1 min-h-[32px] transition-colors ${
                                        reply.liked ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-slate-400'
                                      }`}
                                    >
                                      <svg
                                        className="w-3.5 h-3.5"
                                        fill={reply.liked ? 'currentColor' : 'none'}
                                        stroke="currentColor"
                                        strokeWidth={reply.liked ? 0 : 1.5}
                                        viewBox="0 0 24 24"
                                      >
                                        {reply.liked ? (
                                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                        ) : (
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                                          />
                                        )}
                                      </svg>
                                      {reply.likes > 0 && (
                                        <span className="text-[10px] font-semibold">{reply.likes}</span>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="h-5" />
            </>
          )}
        </div>

        {/* Barra de emojis - FIXO */}
        <div className="flex-shrink-0 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/80 px-3 py-2 flex items-center gap-1.5 overflow-x-auto h-14">
          {['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'].map((emoji, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setCommentText(commentText + emoji);
                inputRef.current?.focus();
              }}
              className="text-2xl p-1.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg active:scale-95 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Campo de entrada - SEMPRE FIXO E VISÍVEL */}
        <div 
          className="flex-shrink-0 bg-white dark:bg-black border-t-2 border-gray-200 dark:border-neutral-800 px-4 py-3 flex items-center"
          style={{
            minHeight: '80px',
            height: '80px',
            zIndex: 10001,
            boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          <form 
            onSubmit={handleSubmit}
            className="flex items-center gap-2.5 w-full"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Adicione um comentário..."
              className="flex-1 px-4 py-3 text-base bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-3xl outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
              style={{
                WebkitAppearance: 'none',
                fontSize: '16px', // Previne zoom no iOS
              }}
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="px-4 py-3 text-base font-bold flex-shrink-0 transition-colors min-h-[44px] flex items-center text-blue-600 dark:text-blue-400 disabled:text-gray-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
              style={{
                cursor: commentText.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Enviar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
