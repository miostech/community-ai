'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    AppBar,
    Avatar,
    Box,
    Button,
    CircularProgress,
    Divider,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    List,
    ListItemButton,
    ListItemText,
    Stack,
    TextField,
    Toolbar,
    Typography,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Send as SendIcon,
    Search as SearchIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { useAccount } from '@/contexts/AccountContext';

interface DmConversation {
    _id: string;
    title: string;
    other_participant: {
        id: string;
        first_name: string;
        last_name: string;
        avatar_url?: string | null;
        role?: string;
    } | null;
    last_message: {
        id: string;
        content: string;
        created_at: string;
        account_id: string;
    } | null;
    last_message_at?: string;
    unread_count?: number;
}

interface DmMessage {
    id: string;
    role: 'user';
    content: string;
    account_id: string;
    created_at: string;
}

interface MentionUser {
    id: string;
    name: string;
    handle: string;
}

function DmPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { account } = useAccount();
    const [conversations, setConversations] = useState<DmConversation[]>([]);
    const [messages, setMessages] = useState<DmMessage[]>([]);
    const [input, setInput] = useState('');
    const [loadingList, setLoadingList] = useState(true);
    const [loadingThread, setLoadingThread] = useState(false);
    const [sending, setSending] = useState(false);
    const [listError, setListError] = useState<string | null>(null);
    const [newDialogOpen, setNewDialogOpen] = useState(false);
    const [usersLoading, setUsersLoading] = useState(false);
    const [users, setUsers] = useState<MentionUser[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [startingConversation, setStartingConversation] = useState(false);
    const canStartConversation = ['moderator', 'admin', 'criador'].includes(
        account?.role || 'user'
    );

    const selectedConversationId = searchParams.get('conversation') || '';

    const selectedConversation = useMemo(
        () => conversations.find((c) => c._id === selectedConversationId) || null,
        [conversations, selectedConversationId]
    );
    const sortedConversations = useMemo(() => {
        return [...conversations].sort((a, b) => {
            const aUnread = a.unread_count || 0;
            const bUnread = b.unread_count || 0;
            if (aUnread > 0 && bUnread === 0) return -1;
            if (bUnread > 0 && aUnread === 0) return 1;
            const aTime = new Date(a.last_message_at || 0).getTime();
            const bTime = new Date(b.last_message_at || 0).getTime();
            return bTime - aTime;
        });
    }, [conversations]);
    const unreadConversations = useMemo(
        () => sortedConversations.filter((conversation) => (conversation.unread_count || 0) > 0),
        [sortedConversations]
    );
    const readConversations = useMemo(
        () => sortedConversations.filter((conversation) => (conversation.unread_count || 0) === 0),
        [sortedConversations]
    );

    const filteredUsers = useMemo(() => {
        const q = userSearch.trim().toLowerCase();
        if (!q) return users.slice(0, 30);
        return users
            .filter(
                (u) =>
                    u.name.toLowerCase().includes(q) ||
                    u.handle.toLowerCase().includes(q)
            )
            .slice(0, 30);
    }, [users, userSearch]);

    const fetchConversations = useCallback(async () => {
        try {
            const res = await fetch('/api/dm');
            if (!res.ok) throw new Error('Erro ao carregar conversas');
            const data = await res.json();
            setConversations(data.conversations || []);
            setListError(null);
        } catch (error: any) {
            setListError(error?.message || 'Erro ao carregar conversas');
        } finally {
            setLoadingList(false);
        }
    }, []);

    const fetchMessages = useCallback(
        async (conversationId: string, silent = false) => {
            if (!conversationId) return;
            if (!silent) setLoadingThread(true);
            try {
                const res = await fetch(`/api/dm/${conversationId}?limit=100`);
                if (!res.ok) throw new Error('Erro ao carregar mensagens');
                const data = await res.json();
                setMessages(data.messages || []);
            } catch (error) {
                console.error('Erro ao carregar thread DM:', error);
            } finally {
                if (!silent) setLoadingThread(false);
            }
        },
        []
    );

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        if (!selectedConversationId) {
            setMessages([]);
            return;
        }
        fetchMessages(selectedConversationId);
    }, [selectedConversationId, fetchMessages]);

    // Realtime nativo via SSE para inbox + thread.
    useEffect(() => {
        const params = new URLSearchParams();
        if (selectedConversationId) {
            params.set('conversation', selectedConversationId);
        }

        const source = new EventSource(`/api/dm/stream?${params.toString()}`);
        source.addEventListener('update', () => {
            fetchConversations();
            if (selectedConversationId) {
                fetchMessages(selectedConversationId, true);
            }
        });

        source.onerror = () => {
            source.close();
        };

        return () => {
            source.close();
        };
    }, [fetchConversations, fetchMessages, selectedConversationId]);

    const handleOpenConversation = (conversationId: string) => {
        router.push(`/dashboard/mensagens?conversation=${conversationId}`);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedConversationId || !input.trim() || sending) return;
        setSending(true);
        const content = input.trim();
        setInput('');

        try {
            const res = await fetch(`/api/dm/${selectedConversationId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: content }),
            });
            if (!res.ok) throw new Error('Erro ao enviar mensagem');
            await Promise.all([fetchMessages(selectedConversationId, true), fetchConversations()]);
        } catch (error) {
            console.error('Erro ao enviar DM:', error);
            setInput(content);
        } finally {
            setSending(false);
        }
    };

    const openNewConversationDialog = async () => {
        if (!canStartConversation) return;
        setNewDialogOpen(true);
        if (users.length > 0 || usersLoading) return;
        setUsersLoading(true);
        try {
            const res = await fetch('/api/community/mention-users', {
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Erro ao carregar usuários');
            const data = await res.json();
            setUsers(Array.isArray(data.users) ? data.users : []);
        } catch (error) {
            console.error('Erro ao carregar usuários para DM:', error);
            setUsers([]);
        } finally {
            setUsersLoading(false);
        }
    };

    const handleStartConversation = async (targetAccountId: string) => {
        if (startingConversation) return;
        setStartingConversation(true);
        try {
            const res = await fetch('/api/dm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target_account_id: targetAccountId }),
            });
            const data = await res.json();
            if (!res.ok || !data?.conversation_id) {
                throw new Error(data?.error || 'Não foi possível iniciar a conversa');
            }
            setNewDialogOpen(false);
            setUserSearch('');
            await fetchConversations();
            router.push(`/dashboard/mensagens?conversation=${data.conversation_id}`);
        } catch (error: any) {
            console.error('Erro ao iniciar conversa privada:', error);
            alert(
                error?.message ||
                    'Não foi possível iniciar a conversa. Verifique sua permissão de moderador.'
            );
        } finally {
            setStartingConversation(false);
        }
    };

    return (
        <Box sx={{ height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }}>
            <AppBar position="static" sx={{ boxShadow: 'none', borderBottom: 1, borderColor: 'divider' }}>
                <Toolbar sx={{ minHeight: 56, px: 1 }}>
                    <IconButton onClick={() => router.push('/dashboard')} sx={{ color: 'text.primary' }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" fontWeight={700} sx={{ ml: 1 }}>
                        Mensagens Privadas
                    </Typography>
                    {canStartConversation && (
                        <Box sx={{ ml: 'auto' }}>
                            <Button
                                size="small"
                                startIcon={<AddIcon />}
                                variant="outlined"
                                onClick={openNewConversationDialog}
                                sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                                Nova conversa
                            </Button>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
                <Box sx={{ width: { xs: '100%', md: 340 }, borderRight: { md: 1 }, borderColor: 'divider', overflowY: 'auto', display: { xs: selectedConversationId ? 'none' : 'block', md: 'block' } }}>
                    {loadingList ? (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : listError ? (
                        <Typography variant="body2" color="error" sx={{ p: 2 }}>
                            {listError}
                        </Typography>
                    ) : conversations.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                            Nenhuma conversa privada ainda.
                        </Typography>
                    ) : (
                        <List disablePadding>
                            {unreadConversations.length > 0 && (
                                <Typography
                                    variant="overline"
                                    color="text.secondary"
                                    sx={{ display: 'block', px: 2, pt: 1.25, pb: 0.5, fontWeight: 700 }}
                                >
                                    Não lidas
                                </Typography>
                            )}
                            {unreadConversations.map((conversation) => (
                                <ListItemButton
                                    key={conversation._id}
                                    selected={conversation._id === selectedConversationId}
                                    onClick={() => handleOpenConversation(conversation._id)}
                                    sx={{ py: 1.5, px: 2, alignItems: 'flex-start' }}
                                >
                                    <Avatar src={conversation.other_participant?.avatar_url || undefined} sx={{ width: 34, height: 34, mr: 1.25 }}>
                                        {conversation.other_participant?.first_name?.charAt(0).toUpperCase() || 'U'}
                                    </Avatar>
                                    <ListItemText
                                        primary={conversation.title}
                                        secondary={conversation.last_message?.content || 'Conversa iniciada'}
                                        primaryTypographyProps={{ fontWeight: 600, fontSize: '0.92rem' }}
                                        secondaryTypographyProps={{
                                            fontSize: '0.8rem',
                                            color: 'text.secondary',
                                            sx: {
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                maxWidth: 230,
                                            },
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            minWidth: 20,
                                            height: 20,
                                            borderRadius: 10,
                                            px: 0.75,
                                            ml: 0.5,
                                            bgcolor: 'error.main',
                                            color: 'error.contrastText',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            lineHeight: 1,
                                        }}
                                    >
                                        {conversation.unread_count! > 99 ? '99+' : conversation.unread_count}
                                    </Box>
                                </ListItemButton>
                            ))}

                            {readConversations.length > 0 && (
                                <>
                                    {unreadConversations.length > 0 && (
                                        <Divider sx={{ my: 0.5 }} />
                                    )}
                                    <Typography
                                        variant="overline"
                                        color="text.secondary"
                                        sx={{ display: 'block', px: 2, pt: unreadConversations.length > 0 ? 1.5 : 1.25, pb: 0.5, fontWeight: 700 }}
                                    >
                                        Lidas
                                    </Typography>
                                </>
                            )}
                            {readConversations.map((conversation) => (
                                <ListItemButton
                                    key={conversation._id}
                                    selected={conversation._id === selectedConversationId}
                                    onClick={() => handleOpenConversation(conversation._id)}
                                    sx={{ py: 1.5, px: 2, alignItems: 'flex-start' }}
                                >
                                    <Avatar src={conversation.other_participant?.avatar_url || undefined} sx={{ width: 34, height: 34, mr: 1.25 }}>
                                        {conversation.other_participant?.first_name?.charAt(0).toUpperCase() || 'U'}
                                    </Avatar>
                                    <ListItemText
                                        primary={conversation.title}
                                        secondary={conversation.last_message?.content || 'Conversa iniciada'}
                                        primaryTypographyProps={{ fontWeight: 600, fontSize: '0.92rem' }}
                                        secondaryTypographyProps={{
                                            fontSize: '0.8rem',
                                            color: 'text.secondary',
                                            sx: {
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                maxWidth: 230,
                                            },
                                        }}
                                    />
                                </ListItemButton>
                            ))}
                        </List>
                    )}
                </Box>

                <Box sx={{ flex: 1, display: { xs: selectedConversationId ? 'flex' : 'none', md: 'flex' }, flexDirection: 'column', minHeight: 0 }}>
                    {!selectedConversationId ? (
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography color="text.secondary">Selecione uma conversa para começar.</Typography>
                        </Box>
                    ) : (
                        <>
                            <Box sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <IconButton
                                        size="small"
                                        sx={{ display: { xs: 'inline-flex', md: 'none' } }}
                                        onClick={() => router.push('/dashboard/mensagens')}
                                    >
                                        <ArrowBackIcon fontSize="small" />
                                    </IconButton>
                                    <Avatar src={selectedConversation?.other_participant?.avatar_url || undefined} sx={{ width: 30, height: 30 }}>
                                        {selectedConversation?.other_participant?.first_name?.charAt(0).toUpperCase() || 'U'}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={700}>
                                            {selectedConversation?.title || 'Conversa'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Mensagem privada
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>

                            <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1.5 }}>
                                {loadingThread ? (
                                    <Box sx={{ textAlign: 'center', py: 3 }}>
                                        <CircularProgress size={20} />
                                    </Box>
                                ) : (
                                    <Stack spacing={1.25}>
                                        {messages.map((message) => {
                                            const mine = message.account_id === account?.id;
                                            return (
                                                <Box key={message.id} sx={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                                                    <Box
                                                        sx={{
                                                            maxWidth: '80%',
                                                            px: 1.5,
                                                            py: 1,
                                                            borderRadius: 2,
                                                            bgcolor: mine ? 'primary.main' : 'action.hover',
                                                            color: mine ? 'primary.contrastText' : 'text.primary',
                                                        }}
                                                    >
                                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                            {message.content}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                )}
                            </Box>
                            <Divider />
                            <Box component="form" onSubmit={handleSend} sx={{ p: 1.5 }}>
                                <TextField
                                    fullWidth
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Escreva sua mensagem privada..."
                                    multiline
                                    maxRows={4}
                                    InputProps={{
                                        endAdornment: (
                                            <IconButton type="submit" disabled={!input.trim() || sending}>
                                                {sending ? <CircularProgress size={16} /> : <SendIcon fontSize="small" />}
                                            </IconButton>
                                        ),
                                    }}
                                />
                            </Box>
                        </>
                    )}
                </Box>
            </Box>

            <Dialog
                open={newDialogOpen}
                onClose={() => {
                    if (!startingConversation) setNewDialogOpen(false);
                }}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Nova conversa privada</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        placeholder="Buscar por nome ou @usuario"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        sx={{ mt: 0.5, mb: 1.5 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {usersLoading ? (
                        <Box sx={{ py: 3, textAlign: 'center' }}>
                            <CircularProgress size={20} />
                        </Box>
                    ) : filteredUsers.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            Nenhum usuário encontrado.
                        </Typography>
                    ) : (
                        <List disablePadding sx={{ maxHeight: 340, overflowY: 'auto' }}>
                            {filteredUsers.map((user) => (
                                <ListItemButton
                                    key={user.id}
                                    disabled={startingConversation}
                                    onClick={() => handleStartConversation(user.id)}
                                >
                                    <Avatar sx={{ width: 32, height: 32, mr: 1.25 }}>
                                        {user.name.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <ListItemText
                                        primary={user.name}
                                        secondary={`@${user.handle}`}
                                        primaryTypographyProps={{ fontWeight: 600 }}
                                    />
                                </ListItemButton>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setNewDialogOpen(false)}
                        disabled={startingConversation}
                    >
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default function PrivateMessagesPage() {
    return (
        <Suspense
            fallback={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                    <CircularProgress />
                </Box>
            }
        >
            <DmPageContent />
        </Suspense>
    );
}
