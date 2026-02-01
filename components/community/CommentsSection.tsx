'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from '@/contexts/AccountContext';

interface CommentAuthor {
  id: string;
  name: string;
  avatar_url?: string;
}

interface Reply {
  _id: string;
  author: CommentAuthor;
  content: string;
  created_at: string;
  likes_count?: number;
  liked?: boolean;
}

interface Comment {
  _id: string;
  author: CommentAuthor;
  content: string;
  created_at: string;
  likes_count?: number;
  liked?: boolean;
  replies_count?: number;
  replies?: Reply[];
}

interface CommentsSectionProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: () => void;
}

interface ReplyingTo {
  commentId: string;
  authorName: string;
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

export function CommentsSection({ postId, isOpen, onClose, onCommentAdded }: CommentsSectionProps) {
  const { account } = useAccount();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasFetched = useRef(false);

  // Buscar comentários da API
  const fetchComments = useCallback(async () => {
    if (!postId) return;

    try {
      setIsLoading(true);
      console.log('Buscando comentários para post:', postId);
      const response = await fetch(`/api/posts/${postId}/comments`);

      if (response.ok) {
        const data = await response.json();
        console.log('Comentários recebidos:', data);
        setComments(data.comments || []);
      } else {
        console.error('Erro na resposta:', response.status);
      }
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  // Buscar comentários quando abrir o modal
  useEffect(() => {
    if (isOpen && postId) {
      hasFetched.current = false;
      fetchComments();
    }
  }, [isOpen, postId, fetchComments]);

  // Bloquear scroll do body quando modal está aberto
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

  // Enviar comentário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentText.trim(),
          parent_id: replyingTo?.commentId || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (replyingTo) {
          // Adicionar reply ao comentário pai
          setComments(prev =>
            prev.map(comment => {
              if (comment._id === replyingTo.commentId) {
                return {
                  ...comment,
                  replies_count: (comment.replies_count || 0) + 1,
                  replies: [...(comment.replies || []), data.comment],
                };
              }
              return comment;
            })
          );
          // Expandir replies do comentário pai
          setExpandedReplies(prev => new Set(prev).add(replyingTo.commentId));
          setReplyingTo(null);
        } else {
          // Adicionar novo comentário no topo
          setComments(prev => [{ ...data.comment, replies: [] }, ...prev]);
        }

        setCommentText('');

        // Notificar que um comentário foi adicionado
        onCommentAdded?.();

        // Scroll para o topo para ver o novo comentário (se não for reply)
        if (!replyingTo) {
          setTimeout(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = 0;
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('Erro ao enviar comentário:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Iniciar resposta a um comentário
  const handleReply = (commentId: string, authorName: string) => {
    setReplyingTo({ commentId, authorName });
    setCommentText('');
    inputRef.current?.focus();
  };

  // Cancelar resposta
  const cancelReply = () => {
    setReplyingTo(null);
    setCommentText('');
  };

  // Toggle exibição de replies
  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  // Deletar comentário
  const handleDeleteComment = async (commentId: string, isReply: boolean = false, parentId?: string) => {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) return;

    try {
      const response = await fetch(`/api/posts/${postId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (isReply && parentId) {
          // Remover reply do comentário pai
          setComments(prev =>
            prev.map(comment => {
              if (comment._id === parentId) {
                return {
                  ...comment,
                  replies_count: Math.max(0, (comment.replies_count || 0) - 1),
                  replies: comment.replies?.filter(r => r._id !== commentId) || [],
                };
              }
              return comment;
            })
          );
        } else {
          // Remover comentário principal
          setComments(prev => prev.filter(c => c._id !== commentId));
        }
        // Notificar que o contador mudou
        onCommentAdded?.();
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao deletar comentário');
      }
    } catch (error) {
      console.error('Erro ao deletar comentário:', error);
      alert('Erro ao deletar comentário');
    }
  };

  // Verificar se o usuário é o autor do comentário
  const isMyComment = (authorId: string) => {
    console.log('🔍 Comparando IDs:', { accountId: account?.id, authorId, match: account?.id === authorId });
    return account?.id === authorId;
  };

  // Adicionar emoji ao comentário
  const addEmoji = (emoji: string) => {
    setCommentText(prev => prev + emoji);
    inputRef.current?.focus();
  };

  // Like em comentário
  const handleLikeComment = async (commentId: string, isReply: boolean = false, parentId?: string) => {
    try {
      // Atualização otimista
      if (isReply && parentId) {
        setComments(prev =>
          prev.map(comment => {
            if (comment._id === parentId) {
              return {
                ...comment,
                replies: comment.replies?.map(reply => {
                  if (reply._id === commentId) {
                    const newLiked = !reply.liked;
                    return {
                      ...reply,
                      liked: newLiked,
                      likes_count: newLiked
                        ? (reply.likes_count || 0) + 1
                        : Math.max(0, (reply.likes_count || 0) - 1),
                    };
                  }
                  return reply;
                }),
              };
            }
            return comment;
          })
        );
      } else {
        setComments(prev =>
          prev.map(comment => {
            if (comment._id === commentId) {
              const newLiked = !comment.liked;
              return {
                ...comment,
                liked: newLiked,
                likes_count: newLiked
                  ? (comment.likes_count || 0) + 1
                  : Math.max(0, (comment.likes_count || 0) - 1),
              };
            }
            return comment;
          })
        );
      }

      // Chamar API
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        // Reverter em caso de erro
        if (isReply && parentId) {
          setComments(prev =>
            prev.map(comment => {
              if (comment._id === parentId) {
                return {
                  ...comment,
                  replies: comment.replies?.map(reply => {
                    if (reply._id === commentId) {
                      const newLiked = !reply.liked;
                      return {
                        ...reply,
                        liked: newLiked,
                        likes_count: newLiked
                          ? (reply.likes_count || 0) + 1
                          : Math.max(0, (reply.likes_count || 0) - 1),
                      };
                    }
                    return reply;
                  }),
                };
              }
              return comment;
            })
          );
        } else {
          setComments(prev =>
            prev.map(comment => {
              if (comment._id === commentId) {
                const newLiked = !comment.liked;
                return {
                  ...comment,
                  liked: newLiked,
                  likes_count: newLiked
                    ? (comment.likes_count || 0) + 1
                    : Math.max(0, (comment.likes_count || 0) - 1),
                };
              }
              return comment;
            })
          );
        }
      }
    } catch (error) {
      console.error('Erro ao dar like no comentário:', error);
    }
  };

  if (!isOpen) return null;

  const userName = account?.first_name || 'U';
  const userInitial = userName.charAt(0).toUpperCase();

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

        {/* Lista de comentários */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3"
          style={{
            minHeight: 0,
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 dark:text-slate-400">
              <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-gray-300 dark:text-slate-600 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337L5 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              <p className="font-medium text-sm mb-1">Nenhum comentário ainda</p>
              <span className="text-xs text-gray-400 dark:text-slate-500">Seja o primeiro a comentar!</span>
            </div>
          ) : (
            <>
              {comments.map((comment) => (
                <div key={comment._id} className="mb-4">
                  {/* Comentário principal */}
                  <div className="flex gap-3">
                    {comment.author.avatar_url ? (
                      <img
                        src={comment.author.avatar_url}
                        alt={comment.author.name}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {comment.author.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl px-3.5 py-2.5">
                        <p className="font-semibold text-sm text-gray-900 dark:text-slate-100 mb-0.5">
                          {comment.author.name}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed break-words">
                          {comment.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 pl-3.5">
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                          {formatTimeAgo(comment.created_at)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleLikeComment(comment._id)}
                          className={`text-xs font-semibold transition-colors flex items-center gap-1 ${comment.liked
                              ? 'text-red-500 dark:text-red-400'
                              : 'text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400'
                            }`}
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill={comment.liked ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth={comment.liked ? 0 : 2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                            />
                          </svg>
                          {(comment.likes_count || 0) > 0 && comment.likes_count}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReply(comment._id, comment.author.name)}
                          className="text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                        >
                          Responder
                        </button>
                        {isMyComment(comment.author.id) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          >
                            Excluir
                          </button>
                        )}
                      </div>

                      {/* Ver respostas */}
                      {(comment.replies_count || 0) > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleReplies(comment._id)}
                          className="flex items-center gap-2 mt-2 pl-3.5 text-xs font-semibold text-blue-500 dark:text-blue-400"
                        >
                          <div className="w-6 h-[1px] bg-gray-300 dark:bg-slate-600" />
                          {expandedReplies.has(comment._id)
                            ? 'Ocultar respostas'
                            : `Ver ${comment.replies_count} resposta${(comment.replies_count || 0) > 1 ? 's' : ''}`}
                        </button>
                      )}

                      {/* Lista de replies */}
                      {expandedReplies.has(comment._id) && comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 space-y-3 pl-2">
                          {comment.replies.map((reply) => (
                            <div key={reply._id} className="flex gap-2.5">
                              {reply.author.avatar_url ? (
                                <img
                                  src={reply.author.avatar_url}
                                  alt={reply.author.name}
                                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                                  {reply.author.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="bg-gray-100 dark:bg-slate-700 rounded-xl px-3 py-2">
                                  <p className="font-semibold text-xs text-gray-900 dark:text-slate-100 mb-0.5">
                                    {reply.author.name}
                                  </p>
                                  <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed break-words">
                                    {reply.content}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 mt-1 pl-3">
                                  <span className="text-[11px] text-gray-500 dark:text-slate-400">
                                    {formatTimeAgo(reply.created_at)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleLikeComment(reply._id, true, comment._id)}
                                    className={`text-[11px] font-semibold transition-colors flex items-center gap-1 ${reply.liked
                                        ? 'text-red-500 dark:text-red-400'
                                        : 'text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400'
                                      }`}
                                  >
                                    <svg
                                      className="w-3 h-3"
                                      fill={reply.liked ? 'currentColor' : 'none'}
                                      stroke="currentColor"
                                      strokeWidth={reply.liked ? 0 : 2}
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                                      />
                                    </svg>
                                    {(reply.likes_count || 0) > 0 && reply.likes_count}
                                  </button>
                                  {isMyComment(reply.author.id) && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteComment(reply._id, true, comment._id)}
                                      className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                    >
                                      Excluir
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="h-5" />
            </>
          )}
        </div>

        {/* Indicador de resposta */}
        {replyingTo && (
          <div className="flex-shrink-0 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-700 px-4 py-2 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-slate-400">
              Respondendo a <span className="font-semibold text-gray-900 dark:text-slate-200">{replyingTo.authorName}</span>
            </span>
            <button
              type="button"
              onClick={cancelReply}
              className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 p-1"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Barra de emojis */}
        <div className="flex-shrink-0 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/80 px-3 py-2 flex items-center gap-1.5 overflow-x-auto h-14">
          {['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'].map((emoji, index) => (
            <button
              key={index}
              type="button"
              onClick={() => addEmoji(emoji)}
              className="text-2xl p-1.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg active:scale-95 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Campo de entrada */}
        <div
          className="flex-shrink-0 bg-white dark:bg-black border-t-2 border-gray-200 dark:border-neutral-800 px-4 py-3 flex flex-col"
          style={{
            minHeight: replyingTo ? '70px' : '80px',
            zIndex: 10001,
            boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2.5 w-full"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
              {userInitial}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={replyingTo ? `Responder a ${replyingTo.authorName}...` : 'Adicione um comentário...'}
              className="flex-1 px-4 py-3 text-base bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-3xl outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
              style={{
                WebkitAppearance: 'none',
                fontSize: '16px',
              }}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isSubmitting}
              className="px-4 py-3 text-base font-bold flex-shrink-0 transition-colors min-h-[44px] flex items-center text-blue-600 dark:text-blue-400 disabled:text-gray-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                'Enviar'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
