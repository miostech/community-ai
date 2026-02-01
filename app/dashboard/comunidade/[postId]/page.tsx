'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { VideoEmbed } from '@/components/community/VideoEmbed';
import { ImageCarousel } from '@/components/community/ImageCarousel';
import { useSession } from 'next-auth/react';

type PostCategory = 'ideia' | 'resultado' | 'duvida' | 'roteiro' | 'geral';

interface PostAuthor {
    id: string;
    name: string;
    avatar_url?: string;
}

interface Comment {
    _id: string;
    author: PostAuthor;
    content: string;
    created_at: string;
}

interface Post {
    id: string;
    author: PostAuthor;
    content: string;
    images: string[];
    video_url?: string;
    link_instagram_post?: string;
    category: PostCategory;
    likes_count: number;
    comments_count: number;
    created_at: string;
    liked?: boolean;
    saved?: boolean;
}

const categoryLabels: Record<PostCategory, string> = {
    ideia: '💡 Ideia',
    resultado: '🏆 Resultado',
    duvida: '❓ Dúvida',
    roteiro: '📝 Roteiro',
    geral: '💬 Geral',
};

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

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function PostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const postId = params.postId as string;

    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showHeartAnimation, setShowHeartAnimation] = useState(false);

    // Buscar post
    const fetchPost = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/posts/${postId}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Post não encontrado');
                }
                throw new Error('Erro ao carregar post');
            }

            const data = await response.json();
            setPost(data.post);
            setError(null);
        } catch (err) {
            console.error('Erro ao buscar post:', err);
            setError(err instanceof Error ? err.message : 'Erro ao carregar post');
        } finally {
            setIsLoading(false);
        }
    }, [postId]);

    // Buscar comentários
    const fetchComments = useCallback(async () => {
        try {
            setIsLoadingComments(true);
            const response = await fetch(`/api/posts/${postId}/comments`);

            if (!response.ok) {
                throw new Error('Erro ao carregar comentários');
            }

            const data = await response.json();
            setComments(data.comments || []);
        } catch (err) {
            console.error('Erro ao buscar comentários:', err);
        } finally {
            setIsLoadingComments(false);
        }
    }, [postId]);

    useEffect(() => {
        if (postId) {
            fetchPost();
            fetchComments();
        }
    }, [postId, fetchPost, fetchComments]);

    // Like no post
    const handleLike = async () => {
        if (!post || !session?.user) return;

        const newLiked = !post.liked;
        setPost(prev => prev ? {
            ...prev,
            liked: newLiked,
            likes_count: newLiked ? prev.likes_count + 1 : prev.likes_count - 1
        } : null);

        try {
            await fetch(`/api/posts/${postId}/like`, {
                method: newLiked ? 'POST' : 'DELETE',
            });
        } catch (err) {
            console.error('Erro ao dar like:', err);
            // Reverter
            setPost(prev => prev ? {
                ...prev,
                liked: !newLiked,
                likes_count: !newLiked ? prev.likes_count + 1 : prev.likes_count - 1
            } : null);
        }
    };

    // Double tap para like
    const handleDoubleTap = () => {
        if (!post?.liked) {
            handleLike();
        }
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 800);
    };

    // Salvar post
    const handleSave = async () => {
        if (!post || !session?.user) return;

        const newSaved = !post.saved;
        setPost(prev => prev ? { ...prev, saved: newSaved } : null);

        try {
            await fetch(`/api/posts/${postId}/save`, {
                method: newSaved ? 'POST' : 'DELETE',
            });
        } catch (err) {
            console.error('Erro ao salvar:', err);
            setPost(prev => prev ? { ...prev, saved: !newSaved } : null);
        }
    };

    // Enviar comentário
    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting || !session?.user) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment.trim() }),
            });

            if (!response.ok) throw new Error('Erro ao enviar comentário');

            const data = await response.json();
            setComments(prev => [data.comment, ...prev]);
            setNewComment('');

            // Atualizar contador
            setPost(prev => prev ? { ...prev, comments_count: prev.comments_count + 1 } : null);
        } catch (err) {
            console.error('Erro ao enviar comentário:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col items-center justify-center p-4">
                <p className="text-red-500 mb-4">{error || 'Post não encontrado'}</p>
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    Voltar
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black overflow-x-hidden">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white dark:bg-black border-b border-gray-200 dark:border-neutral-800">
                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="font-semibold text-gray-900 dark:text-white">Post</h1>
                    <div className="w-10"></div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto">
                {/* Post */}
                <div className="bg-white dark:bg-black">
                    {/* Autor */}
                    <div className="p-4 flex items-center justify-between">
                        <Link
                            href={`/dashboard/comunidade/perfil/${post.author.id}`}
                            className="flex items-center space-x-3 group"
                        >
                            {post.author.avatar_url ? (
                                <img
                                    src={post.author.avatar_url}
                                    alt={post.author.name}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-slate-600 group-hover:opacity-90 transition-opacity"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm group-hover:opacity-90 transition-opacity">
                                    {post.author.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <p className="font-semibold text-sm text-gray-900 dark:text-slate-100 group-hover:underline">{post.author.name}</p>
                                <p className="text-xs text-gray-500 dark:text-slate-400">{formatDate(post.created_at)}</p>
                            </div>
                        </Link>
                        <span className="text-xs font-medium text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                            {categoryLabels[post.category] || '💬 Geral'}
                        </span>
                    </div>

                    {/* Conteúdo */}
                    {post.content && (
                        <div className="px-4 pb-3 text-gray-900 dark:text-slate-100 whitespace-pre-line break-words leading-relaxed overflow-hidden [word-break:break-word]">
                            {post.content}
                        </div>
                    )}

                    {/* Imagens */}
                    {post.images && post.images.length > 0 && (
                        <div className="relative" onDoubleClick={handleDoubleTap}>
                            {post.images.length > 1 ? (
                                <ImageCarousel images={post.images} />
                            ) : (
                                <img
                                    src={post.images[0]}
                                    alt="Post image"
                                    className="w-full object-contain bg-gray-100 dark:bg-slate-900 max-h-[70vh]"
                                />
                            )}
                            {/* Animação de coração */}
                            {showHeartAnimation && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                    <svg
                                        className="w-24 h-24 text-red-500 animate-ping"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Vídeo */}
                    {post.video_url && (
                        <div className="relative" onDoubleClick={handleDoubleTap}>
                            <video
                                src={post.video_url}
                                controls
                                className="w-full max-h-[70vh] object-contain bg-black"
                                playsInline
                            />
                        </div>
                    )}

                    {/* Link da rede social */}
                    {post.link_instagram_post && (
                        <div className="px-4 pb-3">
                            <a
                                href={post.link_instagram_post}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                {post.link_instagram_post.includes('instagram.com')
                                    ? 'Ver post no Instagram'
                                    : post.link_instagram_post.includes('tiktok.com')
                                        ? 'Ver post no TikTok'
                                        : (post.link_instagram_post.includes('x.com') || post.link_instagram_post.includes('twitter.com'))
                                            ? 'Ver post no X'
                                            : 'Ver post original'}
                            </a>
                        </div>
                    )}

                    {/* Ações */}
                    <div className="px-4 py-3 border-t border-gray-100 dark:border-neutral-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                {/* Like */}
                                <button
                                    onClick={handleLike}
                                    className="flex items-center space-x-2 text-gray-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                >
                                    <svg
                                        className={`w-7 h-7 transition-transform ${post.liked ? 'text-red-500 scale-110' : ''}`}
                                        fill={post.liked ? 'currentColor' : 'none'}
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={post.liked ? 0 : 1.5}
                                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                        />
                                    </svg>
                                    <span className="text-sm font-medium">{post.likes_count}</span>
                                </button>

                                {/* Comentários */}
                                <div className="flex items-center space-x-2 text-gray-600 dark:text-slate-300">
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                        />
                                    </svg>
                                    <span className="text-sm font-medium">{post.comments_count}</span>
                                </div>
                            </div>

                            {/* Salvar */}
                            <button
                                onClick={handleSave}
                                className="text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <svg
                                    className={`w-7 h-7 ${post.saved ? 'text-gray-900 dark:text-white' : ''}`}
                                    fill={post.saved ? 'currentColor' : 'none'}
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={post.saved ? 0 : 1.5}
                                        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Seção de Comentários */}
                <div className="bg-white dark:bg-black border-t border-gray-200 dark:border-neutral-800">
                    <div className="p-4 border-b border-gray-100 dark:border-neutral-800">
                        <h2 className="font-semibold text-gray-900 dark:text-white">
                            Comentários ({post.comments_count})
                        </h2>
                    </div>

                    {/* Form de comentário */}
                    {session?.user && (
                        <form onSubmit={handleSubmitComment} className="p-4 border-b border-gray-100 dark:border-neutral-800">
                            <div className="flex items-start space-x-3">
                                {session.user.image ? (
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name || 'User'}
                                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                                        {session.user.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Adicione um comentário..."
                                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 dark:text-white placeholder-gray-500"
                                        rows={2}
                                    />
                                    <div className="flex justify-end mt-2">
                                        <button
                                            type="submit"
                                            disabled={!newComment.trim() || isSubmitting}
                                            className="px-4 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isSubmitting ? 'Enviando...' : 'Publicar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* Lista de comentários */}
                    <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                        {isLoadingComments ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-500 dark:text-slate-400 text-sm">
                                    Nenhum comentário ainda. Seja o primeiro a comentar!
                                </p>
                            </div>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment._id} className="p-4">
                                    <div className="flex items-start space-x-3">
                                        {comment.author.avatar_url ? (
                                            <img
                                                src={comment.author.avatar_url}
                                                alt={comment.author.name}
                                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                                                {comment.author.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                                    {comment.author.name}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-slate-400">
                                                    {formatTimeAgo(comment.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-slate-300 mt-1 whitespace-pre-line break-words">
                                                {comment.content}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
